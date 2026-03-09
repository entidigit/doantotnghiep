package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"tea-origin/models"
	"tea-origin/store"
)

type ListingHandler struct {
	DB *store.DB
}

// ── helpers ───────────────────────────────────────────────────────────────────

func listingIDFromPath(path string) string {
	// /api/listings/XXXX  or  /api/listings/XXXX/status
	parts := strings.Split(strings.TrimPrefix(path, "/api/listings/"), "/")
	if len(parts) > 0 {
		return parts[0]
	}
	return ""
}

// ── POST /api/listings  (protected) ──────────────────────────────────────────

func (h *ListingHandler) Create(w http.ResponseWriter, r *http.Request) {
	agentID := getAgentID(r)

	var body struct {
		BatchID           string `json:"batchId"`
		Price             int    `json:"price"`
		QuantityAvailable int    `json:"quantityAvailable"`
		Description       string `json:"description"`
		Contact           string `json:"contact"`
		BankName          string `json:"bankName"`
		BankAccount       string `json:"bankAccount"`
		BankOwner         string `json:"bankOwner"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	if body.BatchID == "" || body.Price <= 0 || body.QuantityAvailable <= 0 {
		writeError(w, http.StatusBadRequest, "batchId, price, quantityAvailable are required")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Fetch batch to validate ownership + denormalize
	var batch models.TeaBatch
	err := h.DB.Batches.FindOne(ctx, bson.M{"batchId": body.BatchID, "agentId": agentID}).Decode(&batch)
	if err != nil {
		writeError(w, http.StatusNotFound, "batch not found or not yours")
		return
	}
	if batch.Status != models.StatusPackaged {
		writeError(w, http.StatusBadRequest, "only packaged batches can be listed for sale")
		return
	}

	// Fetch agent to get name/location
	var agent models.Agent
	h.DB.Agents.FindOne(ctx, bson.M{"_id": agentID}).Decode(&agent)

	now := time.Now()
	listing := models.Listing{
		BatchID:           body.BatchID,
		AgentID:           agentID,
		AgentName:         agent.FullName,
		FarmName:          batch.FarmName,
		Location:          agent.Location,
		TeaType:           batch.TeaType,
		WeightGram:        batch.WeightGram,
		QuantityAvailable: body.QuantityAvailable,
		Price:             body.Price,
		Description:       body.Description,
		Contact:           body.Contact,
		// Auto-fill bank info from agent profile, can be overridden by body
		BankName:    agent.BankName,
		BankAccount: agent.BankAccount,
		BankOwner:   agent.BankOwner,
		VerifyURL:   batch.VerifyURL,
		Status:      models.ListingActive,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	// Override with body values if provided
	if body.BankName != "" {
		listing.BankName = body.BankName
	}
	if body.BankAccount != "" {
		listing.BankAccount = body.BankAccount
	}
	if body.BankOwner != "" {
		listing.BankOwner = body.BankOwner
	}

	res, err := h.DB.Listings.InsertOne(ctx, listing)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create listing")
		return
	}
	listing.ID = res.InsertedID.(primitive.ObjectID)
	writeJSON(w, http.StatusCreated, listing)
}

// ── GET /api/listings  (public) ───────────────────────────────────────────────

func (h *ListingHandler) List(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"status": models.ListingActive}
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})

	cur, err := h.DB.Listings.Find(ctx, filter, opts)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "db error")
		return
	}
	defer cur.Close(ctx)

	var listings []models.Listing
	if err := cur.All(ctx, &listings); err != nil {
		writeError(w, http.StatusInternalServerError, "decode error")
		return
	}
	if listings == nil {
		listings = []models.Listing{}
	}
	writeJSON(w, http.StatusOK, listings)
}

// ── GET /api/listings/mine  (protected) ───────────────────────────────────────

func (h *ListingHandler) Mine(w http.ResponseWriter, r *http.Request) {
	agentID := getAgentID(r)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cur, err := h.DB.Listings.Find(ctx, bson.M{"agentId": agentID}, opts)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "db error")
		return
	}
	defer cur.Close(ctx)

	var listings []models.Listing
	cur.All(ctx, &listings)
	if listings == nil {
		listings = []models.Listing{}
	}
	writeJSON(w, http.StatusOK, listings)
}

// ── GET /api/listings/:id  (public) ──────────────────────────────────────────

func (h *ListingHandler) Get(w http.ResponseWriter, r *http.Request) {
	idStr := listingIDFromPath(r.URL.Path)
	oid, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var listing models.Listing
	if err := h.DB.Listings.FindOne(ctx, bson.M{"_id": oid}).Decode(&listing); err != nil {
		writeError(w, http.StatusNotFound, "listing not found")
		return
	}
	writeJSON(w, http.StatusOK, listing)
}

// ── PATCH /api/listings/:id  (protected, own) ────────────────────────────────

func (h *ListingHandler) Update(w http.ResponseWriter, r *http.Request) {
	agentID := getAgentID(r)
	idStr := listingIDFromPath(r.URL.Path)
	oid, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var body struct {
		Price             *int    `json:"price"`
		QuantityAvailable *int    `json:"quantityAvailable"`
		Description       *string `json:"description"`
		Contact           *string `json:"contact"`
		BankName          *string `json:"bankName"`
		BankAccount       *string `json:"bankAccount"`
		BankOwner         *string `json:"bankOwner"`
		Status            *string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Verify ownership
	var existing models.Listing
	if err := h.DB.Listings.FindOne(ctx, bson.M{"_id": oid, "agentId": agentID}).Decode(&existing); err != nil {
		writeError(w, http.StatusNotFound, "listing not found or not yours")
		return
	}

	set := bson.M{"updatedAt": time.Now()}
	if body.Price != nil {
		set["price"] = *body.Price
	}
	if body.QuantityAvailable != nil {
		set["quantityAvailable"] = *body.QuantityAvailable
	}
	if body.Description != nil {
		set["description"] = *body.Description
	}
	if body.Contact != nil {
		set["contact"] = *body.Contact
	}
	if body.BankName != nil {
		set["bankName"] = *body.BankName
	}
	if body.BankAccount != nil {
		set["bankAccount"] = *body.BankAccount
	}
	if body.BankOwner != nil {
		set["bankOwner"] = *body.BankOwner
	}
	if body.Status != nil {
		s := *body.Status
		if s == models.ListingActive || s == models.ListingClosed || s == models.ListingSold {
			set["status"] = s
		}
	}

	after := options.After
	var updated models.Listing
	h.DB.Listings.FindOneAndUpdate(
		ctx,
		bson.M{"_id": oid},
		bson.M{"$set": set},
		options.FindOneAndUpdate().SetReturnDocument(after),
	).Decode(&updated)

	writeJSON(w, http.StatusOK, updated)
}

// ── DELETE /api/listings/:id  (protected, own) ───────────────────────────────

func (h *ListingHandler) Delete(w http.ResponseWriter, r *http.Request) {
	agentID := getAgentID(r)
	idStr := listingIDFromPath(r.URL.Path)
	oid, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	res, err := h.DB.Listings.DeleteOne(ctx, bson.M{"_id": oid, "agentId": agentID})
	if err != nil || res.DeletedCount == 0 {
		writeError(w, http.StatusNotFound, "listing not found or not yours")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}
