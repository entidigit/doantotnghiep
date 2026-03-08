package config

import (
	"os"
)

type Config struct {
	Port        string
	MongoURI    string
	JWTSecret   string
	BaseURL     string // e.g. http://localhost:8080
	APIKey      string // blockchain IBN api key
	RPCPublic   string
	RPCSend     string
	RPCAuth     string
	WalletAddr  string
}

func Load() *Config {
	return &Config{
		Port:       getEnv("PORT", "8080"),
		MongoURI:   getEnv("MONGO_URI", "mongodb://localhost:27017"),
		JWTSecret:  getEnv("JWT_SECRET", "change_me_in_production"),
		BaseURL:    getEnv("BASE_URL", "http://localhost:8080"),
		APIKey:     getEnv("IBN_API_KEY", "347e69c9-0946-4e43-9b03-e63a184cd0ad"),
		RPCPublic:  getEnv("RPC_PUBLIC", "http://203.113.135.200:3002/api/rpc"),
		RPCSend:    getEnv("RPC_SEND", "http://203.113.135.200:3002/api/rpc/send"),
		RPCAuth:    getEnv("RPC_AUTH", "http://203.113.135.200:3002/api/rpc/auth"),
		WalletAddr: getEnv("WALLET_ADDRESS", "0x029b0720f7880F2b6041a4b4d75eFa872a8eC521"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
