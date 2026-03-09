package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"

	"tea-origin/models"
	"tea-origin/store"
)

type AdminHandler struct {
	DB *store.DB
}

// ─── GET /api/admin/users ─────────────────────────────────────────────────

func (h *AdminHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	cur, err := h.DB.Agents.Find(context.Background(), bson.M{},
		options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}))
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer cur.Close(context.Background())

	var agents []models.Agent
	if err := cur.All(context.Background(), &agents); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, agents)
}

// ─── POST /api/admin/users ────────────────────────────────────────────────
// Admin tạo tài khoản đại lý mới.

func (h *AdminHandler) CreateAgent(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
		FullName string `json:"fullName"`
		FarmName string `json:"farmName"`
		Location string `json:"location"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if body.Username == "" || body.Password == "" {
		writeError(w, http.StatusBadRequest, "username and password required")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "hashing failed")
		return
	}

	agent := models.Agent{
		ID:           primitive.NewObjectID(),
		Username:     body.Username,
		PasswordHash: string(hash),
		FullName:     body.FullName,
		FarmName:     body.FarmName,
		Location:     body.Location,
		Role:         "agent",
		CreatedAt:    time.Now(),
	}

	_, err = h.DB.Agents.InsertOne(context.Background(), agent)
	if mongo.IsDuplicateKeyError(err) {
		writeError(w, http.StatusConflict, "username already exists")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, agent)
}

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────

func (h *AdminHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/admin/users/")
	oid, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid user id")
		return
	}

	res, err := h.DB.Agents.DeleteOne(context.Background(), bson.M{"_id": oid})
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if res.DeletedCount == 0 {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"message": "deleted"})
}

// ─── GET /api/admin/batches ───────────────────────────────────────────────
// Trả về tất cả lô chè (của mọi đại lý), kèm thông tin đại lý.

type batchWithAgent struct {
	models.TeaBatch
	AgentName string `json:"agentName"`
	AgentFarm string `json:"agentFarm"`
}

func (h *AdminHandler) ListBatches(w http.ResponseWriter, r *http.Request) {
	cur, err := h.DB.Batches.Find(context.Background(), bson.M{},
		options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}))
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer cur.Close(context.Background())

	var batches []models.TeaBatch
	if err := cur.All(context.Background(), &batches); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Collect unique agent IDs
	agentMap := map[primitive.ObjectID]models.Agent{}
	for _, b := range batches {
		agentMap[b.AgentID] = models.Agent{}
	}
	for aid := range agentMap {
		var agent models.Agent
		if err := h.DB.Agents.FindOne(context.Background(), bson.M{"_id": aid}).Decode(&agent); err == nil {
			agentMap[aid] = agent
		}
	}

	result := make([]batchWithAgent, 0, len(batches))
	for _, b := range batches {
		a := agentMap[b.AgentID]
		result = append(result, batchWithAgent{
			TeaBatch:  b,
			AgentName: a.FullName,
			AgentFarm: a.FarmName,
		})
	}
	writeJSON(w, http.StatusOK, result)
}
