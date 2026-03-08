package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"tea-origin/blockchain"
	"tea-origin/config"
	"tea-origin/handlers"
	"tea-origin/middleware"
	"tea-origin/store"
)

func main() {
	cfg := config.Load()

	// ── MongoDB ──────────────────────────────────────────────────────────────
	db, err := store.Connect(cfg.MongoURI)
	if err != nil {
		log.Fatalf("MongoDB connect failed: %v", err)
	}
	defer db.Disconnect()
	log.Println("✓ MongoDB connected")

	// ── Blockchain client ────────────────────────────────────────────────────
	chain := &blockchain.Client{
		APIKey:     cfg.APIKey,
		RPCPublic:  cfg.RPCPublic,
		RPCSend:    cfg.RPCSend,
		RPCAuth:    cfg.RPCAuth,
		WalletAddr: cfg.WalletAddr,
	}
	if bn, err := chain.GetBlockNumber(); err == nil {
		log.Printf("✓ Blockchain connected  block=%d", bn)
	} else {
		log.Printf("⚠ Blockchain connect warning: %v", err)
	}

	// ── Upload directory ─────────────────────────────────────────────────────
	uploadDir := "uploads"
	os.MkdirAll(uploadDir, 0755)

	// ── Handlers ─────────────────────────────────────────────────────────────
	authH := &handlers.AuthHandler{DB: db, JWTSecret: cfg.JWTSecret}
	batchH := &handlers.BatchHandler{DB: db, Chain: chain, BaseURL: cfg.BaseURL}
	eventH := &handlers.EventHandler{DB: db, Chain: chain, UploadDir: uploadDir, BaseURL: cfg.BaseURL}
	verifyH := &handlers.VerifyHandler{DB: db, BaseURL: cfg.BaseURL}

	jwtMW := middleware.JWT(cfg.JWTSecret)

	// ── Router ───────────────────────────────────────────────────────────────
	mux := http.NewServeMux()

	// Public
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintln(w, `{"status":"ok","service":"tea-origin"}`)
	})
	mux.HandleFunc("/verify/", verifyH.Verify)
	mux.HandleFunc("/qr/", verifyH.QRCode)
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadDir))))

	// Auth
	mux.HandleFunc("/api/auth/register", authH.Register)
	mux.HandleFunc("/api/auth/login", authH.Login)
	mux.Handle("/api/auth/me", jwtMW(http.HandlerFunc(authH.Me)))

	// Batches (protected)
	mux.Handle("/api/batches", jwtMW(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			batchH.Create(w, r)
		case http.MethodGet:
			batchH.List(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	// /api/batches/:id  and  /api/batches/:id/events  and  /api/batches/:id/finalize
	mux.Handle("/api/batches/", jwtMW(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path // e.g. /api/batches/uuid/events

		switch {
		case endsWith(path, "/finalize") && r.Method == http.MethodPost:
			batchH.Finalize(w, r)
		case endsWith(path, "/events") && r.Method == http.MethodPost:
			eventH.Create(w, r)
		case endsWith(path, "/events") && r.Method == http.MethodGet:
			eventH.List(w, r)
		case r.Method == http.MethodGet:
			batchH.Get(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	// ── Start ─────────────────────────────────────────────────────────────────
	addr := ":" + cfg.Port
	log.Printf("🍵 Tea Origin API  →  http://localhost%s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}

func endsWith(s, suffix string) bool {
	return len(s) >= len(suffix) && s[len(s)-len(suffix):] == suffix
}

