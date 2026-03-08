package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ──────────────────────────────────────────────
// Agent (đại lý)
// ──────────────────────────────────────────────

type Agent struct {
	ID           primitive.ObjectID `bson:"_id,omitempty"   json:"id"`
	Username     string             `bson:"username"        json:"username"`
	PasswordHash string             `bson:"passwordHash"    json:"-"`
	FullName     string             `bson:"fullName"        json:"fullName"`
	FarmName     string             `bson:"farmName"        json:"farmName"`
	Location     string             `bson:"location"        json:"location"`
	CreatedAt    time.Time          `bson:"createdAt"       json:"createdAt"`
}

// ──────────────────────────────────────────────
// TeaBatch (lô chè)
// ──────────────────────────────────────────────

const (
	StatusGrowing    = "growing"
	StatusProcessing = "processing"
	StatusPackaged   = "packaged"
)

type TeaBatch struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"  json:"id"`
	BatchID     string             `bson:"batchId"        json:"batchId"`     // UUID
	AgentID     primitive.ObjectID `bson:"agentId"        json:"agentId"`
	FarmName    string             `bson:"farmName"       json:"farmName"`
	TeaType     string             `bson:"teaType"        json:"teaType"`     // e.g. "Trà xanh Thái Nguyên"
	WeightGram  int                `bson:"weightGram"     json:"weightGram"`  // khối lượng gói (gram)
	Status      string             `bson:"status"         json:"status"`      // growing | processing | packaged
	BatchHash   string             `bson:"batchHash"      json:"batchHash"`   // SHA256 of all event hashes
	TxHash      string             `bson:"txHash"         json:"txHash"`      // blockchain tx of BatchHash
	QRCode      string             `bson:"qrCode"         json:"qrCode"`      // URL of QR image
	VerifyURL   string             `bson:"verifyUrl"      json:"verifyUrl"`   // public verify URL
	CreatedAt   time.Time          `bson:"createdAt"      json:"createdAt"`
	FinalizedAt *time.Time         `bson:"finalizedAt"    json:"finalizedAt"`
}

// ──────────────────────────────────────────────
// Event (sự kiện trong quá trình sản xuất)
// ──────────────────────────────────────────────

const (
	StagePlanting   = "planting"    // trồng cây
	StageFertilize  = "fertilizing" // bón phân
	StageSpraying   = "spraying"    // phun thuốc
	StageHarvest    = "harvesting"  // thu hoạch
	StageDrying     = "drying"      // phơi/sấy
	StageProcessing = "processing"  // chế biến
	StagePackaging  = "packaging"   // đóng gói
)

type Event struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"  json:"id"`
	BatchID     string             `bson:"batchId"        json:"batchId"`
	Stage       string             `bson:"stage"          json:"stage"`
	Description string             `bson:"description"    json:"description"`
	Images      []string           `bson:"images"         json:"images"`      // danh sách đường dẫn ảnh
	Location    string             `bson:"location"       json:"location"`
	RecordedBy  primitive.ObjectID `bson:"recordedBy"     json:"recordedBy"`
	EventHash   string             `bson:"eventHash"      json:"eventHash"`   // SHA256 của nội dung event
	TxHash      string             `bson:"txHash"         json:"txHash"`      // blockchain tx
	Timestamp   time.Time          `bson:"timestamp"      json:"timestamp"`   // thời điểm xảy ra
	CreatedAt   time.Time          `bson:"createdAt"      json:"createdAt"`
}
