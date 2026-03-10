package handlers

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
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

type OrderHandler struct {
	DB        *store.DB
	Chain     *blockchain.Client
	UploadDir string
}

func orderIDFromPath(path string) string {
	parts := strings.Split(strings.TrimPrefix(path, "/api/orders/"), "/")
	if len(parts) > 0 {
		return parts[0]
	}
	return ""
}

// ── POST /api/orders  (public — người mua đặt hàng) ─────────────────────────

func (h *OrderHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ListingID    string `json:"listingId"`
		PackageHash  string `json:"packageHash"`
		BuyerName    string `json:"buyerName"`
		BuyerPhone   string `json:"buyerPhone"`
		BuyerAddress string `json:"buyerAddress"`
		BuyerEmail   string `json:"buyerEmail"`
		Quantity     int    `json:"quantity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}

	if body.ListingID == "" || body.BuyerName == "" || body.BuyerPhone == "" || body.Quantity <= 0 {
		writeError(w, http.StatusBadRequest, "listingId, buyerName, buyerPhone, quantity are required")
		return
	}

	listingOID, err := primitive.ObjectIDFromHex(body.ListingID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid listingId")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Validate listing
	var listing models.Listing
	if err := h.DB.Listings.FindOne(ctx, bson.M{"_id": listingOID, "status": models.ListingActive}).Decode(&listing); err != nil {
		writeError(w, http.StatusNotFound, "listing not found or not active")
		return
	}

	if body.Quantity > listing.QuantityAvailable {
		writeError(w, http.StatusBadRequest, "not enough stock")
		return
	}

	now := time.Now()
	order := models.Order{
		ListingID:    listingOID,
		AgentID:      listing.AgentID,
		PackageHash:  body.PackageHash,
		BuyerName:    body.BuyerName,
		BuyerPhone:   body.BuyerPhone,
		BuyerAddress: body.BuyerAddress,
		BuyerEmail:   body.BuyerEmail,
		Quantity:     body.Quantity,
		TotalPrice:   body.Quantity * listing.Price,
		Status:       models.OrderPending,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	res, err := h.DB.Orders.InsertOne(ctx, order)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create order")
		return
	}
	order.ID = res.InsertedID.(primitive.ObjectID)
	writeJSON(w, http.StatusCreated, order)
}

// ── POST /api/orders/:id/payment  (public — gửi ảnh chuyển khoản) ────────────

func (h *OrderHandler) UploadPayment(w http.ResponseWriter, r *http.Request) {
	idStr := orderIDFromPath(r.URL.Path)
	oid, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Check order exists and is pending
	var order models.Order
	if err := h.DB.Orders.FindOne(ctx, bson.M{"_id": oid, "status": models.OrderPending}).Decode(&order); err != nil {
		writeError(w, http.StatusNotFound, "order not found or not pending")
		return
	}

	// Parse file upload (max 10MB)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "invalid form data")
		return
	}

	file, header, err := r.FormFile("paymentImage")
	if err != nil {
		writeError(w, http.StatusBadRequest, "paymentImage file is required")
		return
	}
	defer file.Close()

	// Validate extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		writeError(w, http.StatusBadRequest, "only jpg/png/webp allowed")
		return
	}

	// Save to uploads/
	filename := uuid.New().String() + ext
	dst, err := os.Create(filepath.Join(h.UploadDir, filename))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to save file")
		return
	}
	defer dst.Close()
	io.Copy(dst, file)

	imagePath := "/uploads/" + filename

	// Update order to "paid"
	after := options.After
	var updated models.Order
	h.DB.Orders.FindOneAndUpdate(ctx,
		bson.M{"_id": oid},
		bson.M{"$set": bson.M{
			"paymentImage": imagePath,
			"status":       models.OrderPaid,
			"updatedAt":    time.Now(),
		}},
		options.FindOneAndUpdate().SetReturnDocument(after),
	).Decode(&updated)

	writeJSON(w, http.StatusOK, updated)
}

// ── GET /api/orders/agent  (protected — đại lý xem đơn hàng nhận) ────────────

func (h *OrderHandler) ListForAgent(w http.ResponseWriter, r *http.Request) {
	agentID := getAgentID(r)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cur, err := h.DB.Orders.Find(ctx, bson.M{"agentId": agentID}, opts)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "db error")
		return
	}
	defer cur.Close(ctx)

	var orders []models.Order
	cur.All(ctx, &orders)
	if orders == nil {
		orders = []models.Order{}
	}
	writeJSON(w, http.StatusOK, orders)
}

// ── GET /api/orders/:id  (public — xem chi tiết đơn) ─────────────────────────

func (h *OrderHandler) Get(w http.ResponseWriter, r *http.Request) {
	idStr := orderIDFromPath(r.URL.Path)
	oid, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var order models.Order
	if err := h.DB.Orders.FindOne(ctx, bson.M{"_id": oid}).Decode(&order); err != nil {
		writeError(w, http.StatusNotFound, "order not found")
		return
	}
	writeJSON(w, http.StatusOK, order)
}

// ── POST /api/orders/:id/confirm  (protected — đại lý xác nhận) ──────────────

func (h *OrderHandler) Confirm(w http.ResponseWriter, r *http.Request) {
	agentID := getAgentID(r)
	idStr := orderIDFromPath(r.URL.Path)
	oid, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Find order and verify ownership
	var order models.Order
	if err := h.DB.Orders.FindOne(ctx, bson.M{"_id": oid, "agentId": agentID, "status": models.OrderPaid}).Decode(&order); err != nil {
		writeError(w, http.StatusNotFound, "order not found, not yours, or not paid")
		return
	}

	// Build buyer info hash: SHA256(packageHash + buyerName + buyerPhone + buyerAddress + timestamp)
	buyerData := fmt.Sprintf("%s|%s|%s|%s|%s",
		order.PackageHash,
		order.BuyerName,
		order.BuyerPhone,
		order.BuyerAddress,
		order.CreatedAt.Format(time.RFC3339),
	)
	sum := sha256.Sum256([]byte(buyerData))
	buyerHash := blockchain.HashToHex(sum[:])

	// Ghi buyer hash lên blockchain
	txHash, err := h.Chain.RecordHash(buyerHash)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "blockchain error: "+err.Error())
		return
	}

	// Update order → confirmed
	after := options.After
	var updated models.Order
	h.DB.Orders.FindOneAndUpdate(ctx,
		bson.M{"_id": oid},
		bson.M{"$set": bson.M{
			"status":      models.OrderConfirmed,
			"buyerTxHash": txHash,
			"updatedAt":   time.Now(),
		}},
		options.FindOneAndUpdate().SetReturnDocument(after),
	).Decode(&updated)

	// Giảm quantityAvailable của listing
	h.DB.Listings.UpdateOne(ctx,
		bson.M{"_id": order.ListingID},
		bson.M{"$inc": bson.M{"quantityAvailable": -order.Quantity}},
	)

	writeJSON(w, http.StatusOK, updated)
}

// ── POST /api/orders/:id/reject  (protected — đại lý từ chối) ────────────────

func (h *OrderHandler) Reject(w http.ResponseWriter, r *http.Request) {
	agentID := getAgentID(r)
	idStr := orderIDFromPath(r.URL.Path)
	oid, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var order models.Order
	if err := h.DB.Orders.FindOne(ctx, bson.M{"_id": oid, "agentId": agentID, "status": models.OrderPaid}).Decode(&order); err != nil {
		writeError(w, http.StatusNotFound, "order not found, not yours, or not paid")
		return
	}

	after := options.After
	var updated models.Order
	h.DB.Orders.FindOneAndUpdate(ctx,
		bson.M{"_id": oid},
		bson.M{"$set": bson.M{
			"status":    models.OrderRejected,
			"updatedAt": time.Now(),
		}},
		options.FindOneAndUpdate().SetReturnDocument(after),
	).Decode(&updated)

	writeJSON(w, http.StatusOK, updated)
}

// ── GET /api/orders/by-phone?phone=xxx  (public — tra cứu theo SĐT người mua) ─

type OrderResult struct {
	models.Order
	TeaType    string `json:"teaType"`
	FarmName   string `json:"farmName"`
	WeightGram int    `json:"weightGram"`
	VerifyURL  string `json:"verifyUrl"`
}

func (h *OrderHandler) SearchByPhone(w http.ResponseWriter, r *http.Request) {
	phone := r.URL.Query().Get("phone")
	if phone == "" {
		writeError(w, http.StatusBadRequest, "phone is required")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := h.DB.Orders.Find(ctx, bson.M{
		"buyerPhone": phone,
		"status":     models.OrderConfirmed,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "db error")
		return
	}
	defer cursor.Close(ctx)

	var orders []models.Order
	cursor.All(ctx, &orders)

	results := make([]OrderResult, 0, len(orders))
	for _, o := range orders {
		res := OrderResult{Order: o}
		// Look up listing for tea info
		var listing models.Listing
		if err := h.DB.Listings.FindOne(ctx, bson.M{"_id": o.ListingID}).Decode(&listing); err == nil {
			res.TeaType = listing.TeaType
			res.FarmName = listing.FarmName
			res.WeightGram = listing.WeightGram
		}
		// Build verify URL from packageHash
		if o.PackageHash != "" {
			res.VerifyURL = "/verify/" + o.PackageHash
		}
		results = append(results, res)
	}

	writeJSON(w, http.StatusOK, results)
}

// ── GET /api/orders/sold-packages/:batchId  (public — lấy packages đã bán) ───

func (h *OrderHandler) GetSoldPackages(w http.ResponseWriter, r *http.Request) {
	// Note: batchID từ URL path không được sử dụng vì ta lấy tất cả packages đã bán
	// Frontend sẽ filter theo batchId nếu cần

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Tìm tất cả orders confirmed
	cursor, err := h.DB.Orders.Find(ctx, bson.M{
		"status": models.OrderConfirmed,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "db error")
		return
	}
	defer cursor.Close(ctx)

	var orders []models.Order
	cursor.All(ctx, &orders)

	// Lấy danh sách packageHash
	soldHashes := make([]string, 0)
	for _, order := range orders {
		if order.PackageHash != "" {
			soldHashes = append(soldHashes, order.PackageHash)
		}
	}

	writeJSON(w, http.StatusOK, soldHashes)
}
