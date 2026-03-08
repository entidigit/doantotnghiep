package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type contextKey string

const AgentIDKey contextKey = "agentId"

func JWT(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if !strings.HasPrefix(header, "Bearer ") {
				http.Error(w, `{"error":"missing token"}`, http.StatusUnauthorized)
				return
			}
			tokenStr := strings.TrimPrefix(header, "Bearer ")

			token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(secret), nil
			})
			if err != nil || !token.Valid {
				http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
				return
			}

			claims, _ := token.Claims.(jwt.MapClaims)
			agentIDStr, _ := claims["agentId"].(string)
			agentID, err := primitive.ObjectIDFromHex(agentIDStr)
			if err != nil {
				http.Error(w, `{"error":"invalid token claims"}`, http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), AgentIDKey, agentID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetAgentID(r *http.Request) primitive.ObjectID {
	v, _ := r.Context().Value(AgentIDKey).(primitive.ObjectID)
	return v
}
