package handlers

import (
	"context"
	"crypto/sha256"
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

type EventHandler struct {
	DB         *store.DB
	Chain      *blockchain.Client
	UploadDir  string
	BaseURL    string
}

// ─── POST /api/batches/:id/events ────────────────────────────────────────────
// Content-Type: multipart/form-data
// Fields: stage, description, location, timestamp (RFC3339)
// Files : images[] (multiple allowed)

func (h *EventHandler) Create(w http.ResponseWriter, r *http.Request) {
	agentID := getAgentID(r)

	// Lấy batchId từ URL /api/batches/{batchId}/events
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 3 {
		writeError(w, http.StatusBadRequest, "invalid path")
		return
	}
	batchID := parts[len(parts)-2]

	// Kiểm tra batch tồn tại và thuộc đại lý
	var batch models.TeaBatch
	if err := h.DB.Batches.FindOne(context.Background(),
		bson.M{"batchId": batchID, "agentId": agentID}).Decode(&batch); err != nil {
		writeError(w, http.StatusNotFound, "batch not found")
		return
	}
	if batch.Status == models.StatusPackaged {
		writeError(w, http.StatusBadRequest, "batch is already packaged, cannot add events")
		return
	}

	// Parse multipart (max 32 MB)
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "failed to parse form: "+err.Error())
		return
	}

	stage := r.FormValue("stage")
	description := r.FormValue("description")
	location := r.FormValue("location")

	eventTime := time.Now()
	if ts := r.FormValue("timestamp"); ts != "" {
		if t, err := time.Parse(time.RFC3339, ts); err == nil {
			eventTime = t
		}
	}

	// Lưu ảnh
	var imagePaths []string
	files := r.MultipartForm.File["images"]
	for _, fh := range files {
		ext := filepath.Ext(fh.Filename)
		filename := uuid.New().String() + ext
		savePath := filepath.Join(h.UploadDir, filename)

		src, err := fh.Open()
		if err != nil {
			continue
		}
		dst, err := os.Create(savePath)
		if err != nil {
			src.Close()
			continue
		}
		io.Copy(dst, src)
		src.Close()
		dst.Close()

		imagePaths = append(imagePaths, "/uploads/"+filename)
	}

	// Tính EventHash = SHA256(batchId + stage + description + images + timestamp)
	hashInput := fmt.Sprintf("%s|%s|%s|%s|%v",
		batchID, stage, description,
		strings.Join(imagePaths, ","),
		eventTime.UTC().Unix(),
	)
	hashBytes := sha256.Sum256([]byte(hashInput))
	eventHash := blockchain.HashToHex(hashBytes[:])

	// Ghi lên blockchain
	txHash, err := h.Chain.RecordHash(eventHash)
	if err != nil {
		writeError(w, http.StatusBadGateway, "blockchain error: "+err.Error())
		return
	}

	event := models.Event{
		ID:          primitive.NewObjectID(),
		BatchID:     batchID,
		Stage:       stage,
		Description: description,
		Images:      imagePaths,
		Location:    location,
		RecordedBy:  agentID,
		EventHash:   eventHash,
		TxHash:      txHash,
		Timestamp:   eventTime,
		CreatedAt:   time.Now(),
	}
	if event.Images == nil {
		event.Images = []string{}
	}

	if _, err := h.DB.Events.InsertOne(context.Background(), event); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, event)
}

// ─── GET /api/batches/:id/events ─────────────────────────────────────────────

func (h *EventHandler) List(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	batchID := parts[len(parts)-2]

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
	if events == nil {
		events = []models.Event{}
	}
	writeJSON(w, http.StatusOK, events)
}
