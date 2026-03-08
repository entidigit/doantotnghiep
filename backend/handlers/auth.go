package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"

	"tea-origin/models"
	"tea-origin/store"
)

type AuthHandler struct {
	DB        *store.DB
	JWTSecret string
}

// ─── POST /api/auth/register ───────────────────────────────────────────────

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
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

	writeJSON(w, http.StatusCreated, map[string]any{
		"message": "registered successfully",
		"agentId": agent.ID.Hex(),
	})
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var agent models.Agent
	err := h.DB.Agents.FindOne(context.Background(),
		bson.M{"username": body.Username}).Decode(&agent)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(agent.PasswordHash), []byte(body.Password)); err != nil {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"agentId":  agent.ID.Hex(),
		"username": agent.Username,
		"farmName": agent.FarmName,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
	})
	tokenStr, err := token.SignedString([]byte(h.JWTSecret))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "token generation failed")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"token":    tokenStr,
		"agentId":  agent.ID.Hex(),
		"username": agent.Username,
		"farmName": agent.FarmName,
	})
}

// ─── GET /api/auth/me ────────────────────────────────────────────────────

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	agentID := getAgentID(r)
	var agent models.Agent
	if err := h.DB.Agents.FindOne(context.Background(),
		bson.M{"_id": agentID}).Decode(&agent); err != nil {
		writeError(w, http.StatusNotFound, "agent not found")
		return
	}
	writeJSON(w, http.StatusOK, agent)
}
