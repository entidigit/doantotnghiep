package handlers

import (
	"context"
	"net/http"
	"path"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/skip2/go-qrcode"
	"tea-origin/models"
	"tea-origin/store"
)

type VerifyHandler struct {
	DB      *store.DB
	BaseURL string
}

// ─── GET /verify/:hash ────────────────────────────────────────────────────────
// Công khai — không cần JWT

func (h *VerifyHandler) Verify(w http.ResponseWriter, r *http.Request) {
	hash := path.Base(r.URL.Path)

	// 1. Thử tìm theo batchHash
	var batch models.TeaBatch
	batchErr := h.DB.Batches.FindOne(context.Background(),
		bson.M{"batchHash": hash}).Decode(&batch)

	var pkgInfo map[string]any
	var packageHash string

	if batchErr != nil {
		// 2. Thử tìm theo packageHash trong collection packages
		var pkg models.TeaPackage
		if pkgErr := h.DB.Packages.FindOne(context.Background(),
			bson.M{"packageHash": hash}).Decode(&pkg); pkgErr != nil {
			writeError(w, http.StatusNotFound, "hash not found")
			return
		}
		// Tìm batch cha theo batchId
		if err := h.DB.Batches.FindOne(context.Background(),
			bson.M{"batchId": pkg.BatchID}).Decode(&batch); err != nil {
			writeError(w, http.StatusNotFound, "parent batch not found")
			return
		}
		packageHash = pkg.PackageHash
		pkgInfo = map[string]any{
			"packageIdx":  pkg.PackageIdx,
			"total":       batch.Quantity,
			"packageHash": pkg.PackageHash,
			"verifyUrl":   pkg.VerifyURL,
		}
	}

	// Lấy agent info
	var agent models.Agent
	h.DB.Agents.FindOne(context.Background(), bson.M{"_id": batch.AgentID}).Decode(&agent)

	// Lấy tất cả events
	cursor, _ := h.DB.Events.Find(context.Background(),
		bson.M{"batchId": batch.BatchID},
		options.Find().SetSort(bson.D{{Key: "timestamp", Value: 1}}),
	)
	var events []models.Event
	cursor.All(context.Background(), &events)
	if events == nil {
		events = []models.Event{}
	}

	resp := map[string]any{
		"batch":  batch,
		"agent":  agent,
		"events": events,
		"blockchain": map[string]any{
			"batchHash": batch.BatchHash,
			"txHash":    batch.TxHash,
			"verifyUrl": h.BaseURL + "/verify/" + batch.BatchHash,
		},
	}
	if pkgInfo != nil {
		resp["package"] = pkgInfo
		
		// Tìm thông tin người mua nếu gói này đã được bán (confirmed order)
		if packageHash != "" {
			var order models.Order
			if err := h.DB.Orders.FindOne(context.Background(),
				bson.M{
					"packageHash": packageHash,
					"status":      models.OrderConfirmed,
				}).Decode(&order); err == nil {
				// Có order confirmed cho package này
				resp["buyer"] = map[string]any{
					"name":       order.BuyerName,
					"phone":      order.BuyerPhone,
					"address":    order.BuyerAddress,
					"purchaseAt": order.UpdatedAt,
					"txHash":     order.BuyerTxHash,
				}
			}
		}
	}
	writeJSON(w, http.StatusOK, resp)
}

// ─── GET /qr/:hash ───────────────────────────────────────────────────────────
// Trả về ảnh QR PNG trỏ đến trang verify

func (h *VerifyHandler) QRCode(w http.ResponseWriter, r *http.Request) {
	batchHash := path.Base(r.URL.Path)
	verifyURL := h.BaseURL + "/verify/" + batchHash

	png, err := qrcode.Encode(verifyURL, qrcode.Medium, 256)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to generate QR: "+err.Error())
		return
	}

	w.Header().Set("Content-Type", "image/png")
	w.WriteHeader(http.StatusOK)
	w.Write(png)
}
