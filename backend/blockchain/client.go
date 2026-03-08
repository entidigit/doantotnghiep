package blockchain

import (
	"bytes"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
)

type Client struct {
	APIKey     string
	RPCPublic  string
	RPCSend    string
	RPCAuth    string
	WalletAddr string
}

// ─── JSON-RPC types ───────────────────────────────────────────────────────────

type rpcRequest struct {
	Jsonrpc string `json:"jsonrpc"`
	Method  string `json:"method"`
	Params  []any  `json:"params"`
	ID      int    `json:"id"`
}

type rpcResponse struct {
	Result json.RawMessage `json:"result"`
	Error  *struct {
		Message string `json:"message"`
	} `json:"error"`
}

type sendResponse struct {
	TxHash string `json:"txHash"`
	From   string `json:"from"`
}

// ─── callRPC ─────────────────────────────────────────────────────────────────

func (c *Client) callRPC(url, method string, params []any) (json.RawMessage, error) {
	body, _ := json.Marshal(rpcRequest{Jsonrpc: "2.0", Method: method, Params: params, ID: 1})

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", c.APIKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	var result rpcResponse
	if err := json.Unmarshal(raw, &result); err != nil {
		return nil, err
	}
	if result.Error != nil {
		return nil, fmt.Errorf("rpc error: %s", result.Error.Message)
	}
	return result.Result, nil
}

// ─── RecordHash ghi hash lên blockchain ────────────────────────────────────────

// RecordHash nhận 1 chuỗi hash (hex string không có 0x) → ghi lên blockchain
// Trả về txHash nhận được từ server.
func (c *Client) RecordHash(hashHex string) (string, error) {
	payload := map[string]any{
		"to":    c.WalletAddr,
		"value": "0x0",
		"data":  "0x" + hashHex,
	}
	body, _ := json.Marshal(payload)

	req, err := http.NewRequest(http.MethodPost, c.RPCSend, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", c.APIKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	var sr sendResponse
	if err := json.Unmarshal(raw, &sr); err != nil {
		return "", fmt.Errorf("parse response: %w — body: %s", err, string(raw))
	}
	if sr.TxHash == "" {
		return "", fmt.Errorf("empty txHash from server: %s", string(raw))
	}
	return sr.TxHash, nil
}

// ─── HashToHex chuyển []byte hash → hex string ──────────────────────────────

func HashToHex(b []byte) string {
	return hex.EncodeToString(b)
}

// ─── GetBalance trả về số dư ví ──────────────────────────────────────────────

func (c *Client) GetBalance(address string) (string, error) {
	raw, err := c.callRPC(c.RPCPublic, "eth_getBalance", []any{address, "latest"})
	if err != nil {
		return "", err
	}
	var hexVal string
	json.Unmarshal(raw, &hexVal)
	wei := new(big.Int)
	wei.SetString(hexVal[2:], 16)
	ether := new(big.Float).Quo(new(big.Float).SetInt(wei), big.NewFloat(1e18))
	f, _ := ether.Float64()
	return fmt.Sprintf("%.6f IBN", f), nil
}

// ─── GetBlockNumber ──────────────────────────────────────────────────────────

func (c *Client) GetBlockNumber() (int64, error) {
	raw, err := c.callRPC(c.RPCPublic, "eth_blockNumber", []any{})
	if err != nil {
		return 0, err
	}
	var hexVal string
	json.Unmarshal(raw, &hexVal)
	n := new(big.Int)
	n.SetString(hexVal[2:], 16)
	return n.Int64(), nil
}
