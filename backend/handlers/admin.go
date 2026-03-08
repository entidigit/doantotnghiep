package handlers

import (
	"context"
	"net/http"
	"strings"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"

	"tea-origin/models"
	"tea-origin/store"
)

type AdminHandler struct {
	DB *store.DB
}

// ─── GET /api/admin/users ─────────────────────────────────────────────────
// Trả về danh sách tất cả đại lý (trừ trường passwordHash).

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

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────
// Xóa một đại lý theo ObjectID.

func (h *AdminHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	// path: /api/admin/users/<id>
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
