package handlers

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"net/http"
	"path"
	"strings"
	"time"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"

	"tea-origin/blockchain"
	"tea-origin/models"
	"tea-origin/store"
)

type BatchHandler struct {
	DB      *store.DB
	Chain   *blockchain.Client
	BaseURL string
}

// ─── POST /api/batches ───────────────────────────────────────────────────────

func (h *BatchHandler) Create(w http.ResponseWriter, r *http.Request) {
	agentID := getAgentID(r)

	var body struct {
		TeaType    string `json:"teaType"`
		WeightGram int    `json:"weightGram"`
		FarmName   string `json:"farmName"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	batch := models.TeaBatch{
		ID:         primitive.NewObjectID(),
		BatchID:    uuid.New().String(),
		AgentID:    agentID,
		FarmName:   body.FarmName,
		TeaType:    body.TeaType,
		WeightGram: body.WeightGram,
		Status:     models.StatusGrowing,
		CreatedAt:  time.Now(),
	}

	if _, err := h.DB.Batches.InsertOne(context.Background(), batch); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, batch)
}

// ─── GET /api/batches ────────────────────────────────────────────────────────

func (h *BatchHandler) List(w http.ResponseWriter, r *http.Request) {
	agentID := getAgentID(r)

	cursor, err := h.DB.Batches.Find(context.Background(),
		bson.M{"agentId": agentID},
		options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer cursor.Close(context.Background())

	var batches []models.TeaBatch
	cursor.All(context.Background(), &batches)
	if batches == nil {
		batches = []models.TeaBatch{}
	}
	writeJSON(w, http.StatusOK, batches)
}

// ─── GET /api/batches/:id ────────────────────────────────────────────────────

func (h *BatchHandler) Get(w http.ResponseWriter, r *http.Request) {
	batchID := path.Base(r.URL.Path)
	// strip /finalize suffix if accidentally called
	batchID = strings.TrimSuffix(batchID, "/finalize")

	batch, events, err := h.getBatchWithEvents(batchID)
	if err != nil {
		writeError(w, http.StatusNotFound, "batch not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"batch":  batch,
		"events": events,
	})
}

// ─── POST /api/batches/:id/finalize ─────────────────────────────────────────

func (h *BatchHandler) Finalize(w http.ResponseWriter, r *http.Request) {
	agentID := getAgentID(r)

	// URL pattern: /api/batches/{batchId}/finalize
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 3 {
		writeError(w, http.StatusBadRequest, "invalid path")
		return
	}
	batchID := parts[len(parts)-2]

	var batch models.TeaBatch
	err := h.DB.Batches.FindOne(context.Background(),
		bson.M{"batchId": batchID, "agentId": agentID}).Decode(&batch)
	if err != nil {
		writeError(w, http.StatusNotFound, "batch not found")
		return
	}
	if batch.Status == models.StatusPackaged {
		writeError(w, http.StatusBadRequest, "batch already finalized")
		return
	}

	// Lấy tất cả events của lô
	cursor, err := h.DB.Events.Find(context.Background(),
		bson.M{"batchId": batchID},
		options.Find().SetSort(bson.D{{Key: "timestamp", Value: 1}}),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	var events []models.Event
	cursor.All(context.Background(), &events)

	if len(events) == 0 {
		writeError(w, http.StatusBadRequest, "batch has no events, add at least one event before finalizing")
		return
	}

	// Tính BatchHash = SHA256(concat tất cả eventHash)
	var combined strings.Builder
	for _, e := range events {
		combined.WriteString(e.EventHash)
	}
	batchHashBytes := sha256.Sum256([]byte(combined.String()))
	batchHash := blockchain.HashToHex(batchHashBytes[:])

	// Ghi lên blockchain
	txHash, err := h.Chain.RecordHash(batchHash)
	if err != nil {
		writeError(w, http.StatusBadGateway, "blockchain error: "+err.Error())
		return
	}

	now := time.Now()
	verifyURL := h.BaseURL + "/verify/" + batchHash
	qrURL := h.BaseURL + "/qr/" + batchHash

	update := bson.M{
		"$set": bson.M{
			"status":      models.StatusPackaged,
			"batchHash":   batchHash,
			"txHash":      txHash,
			"verifyUrl":   verifyURL,
			"qrCode":      qrURL,
			"finalizedAt": now,
		},
	}
	h.DB.Batches.UpdateOne(context.Background(), bson.M{"batchId": batchID}, update)

	writeJSON(w, http.StatusOK, map[string]any{
		"message":   "batch finalized",
		"batchHash": batchHash,
		"txHash":    txHash,
		"verifyUrl": verifyURL,
		"qrCode":    qrURL,
	})
}

// ─── internal helper ─────────────────────────────────────────────────────────

func (h *BatchHandler) getBatchWithEvents(batchID string) (*models.TeaBatch, []models.Event, error) {
	var batch models.TeaBatch
	if err := h.DB.Batches.FindOne(context.Background(),
		bson.M{"batchId": batchID}).Decode(&batch); err != nil {
		return nil, nil, err
	}

	cursor, _ := h.DB.Events.Find(context.Background(),
		bson.M{"batchId": batchID},
		options.Find().SetSort(bson.D{{Key: "timestamp", Value: 1}}),
	)
	var events []models.Event
	cursor.All(context.Background(), &events)
	if events == nil {
		events = []models.Event{}
	}
	return &batch, events, nil
}
