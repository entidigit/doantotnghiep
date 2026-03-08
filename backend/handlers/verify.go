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
	batchHash := path.Base(r.URL.Path)

	var batch models.TeaBatch
	if err := h.DB.Batches.FindOne(context.Background(),
		bson.M{"batchHash": batchHash}).Decode(&batch); err != nil {
		writeError(w, http.StatusNotFound, "batch not found or not yet finalized")
		return
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

	writeJSON(w, http.StatusOK, map[string]any{
		"batch":  batch,
		"agent":  agent,
		"events": events,
		"blockchain": map[string]any{
			"batchHash": batch.BatchHash,
			"txHash":    batch.TxHash,
			"verifyUrl": h.BaseURL + "/verify/" + batchHash,
		},
	})
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
