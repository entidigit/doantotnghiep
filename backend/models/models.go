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
	BankName     string             `bson:"bankName"        json:"bankName"`     // Tên ngân hàng
	BankAccount  string             `bson:"bankAccount"     json:"bankAccount"`  // Số tài khoản
	BankOwner    string             `bson:"bankOwner"       json:"bankOwner"`    // Chủ tài khoản
	Role         string             `bson:"role"            json:"role"`         // "agent" | "admin"
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
	Quantity    int                `bson:"quantity"       json:"quantity"`    // số gói sản xuất
	Status      string             `bson:"status"         json:"status"`      // growing | processing | packaged
	BatchHash   string             `bson:"batchHash"      json:"batchHash"`   // SHA256 of all event hashes
	TxHash      string             `bson:"txHash"         json:"txHash"`      // blockchain tx of BatchHash
	QRCode      string             `bson:"qrCode"         json:"qrCode"`      // URL of QR image
	VerifyURL   string             `bson:"verifyUrl"      json:"verifyUrl"`   // public verify URL
	CreatedAt   time.Time          `bson:"createdAt"      json:"createdAt"`
	FinalizedAt *time.Time         `bson:"finalizedAt"    json:"finalizedAt"`
}

// ──────────────────────────────────────────────
// TeaPackage (từng gói chè riêng biệt)
// ──────────────────────────────────────────────

type TeaPackage struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"  json:"id"`
	BatchID     string             `bson:"batchId"        json:"batchId"`
	PackageIdx  int                `bson:"packageIdx"     json:"packageIdx"`  // số thứ tự (1-based)
	PackageHash string             `bson:"packageHash"    json:"packageHash"` // SHA256(batchHash+idx)
	VerifyURL   string             `bson:"verifyUrl"      json:"verifyUrl"`
	QRCode      string             `bson:"qrCode"         json:"qrCode"`
	CreatedAt   time.Time          `bson:"createdAt"      json:"createdAt"`
}

// ──────────────────────────────────────────────
// Listing (đăng bán)
// ──────────────────────────────────────────────

const (
	ListingActive = "active"
	ListingClosed = "closed"
	ListingSold   = "sold"
)

type Listing struct {
	ID                primitive.ObjectID `bson:"_id,omitempty"       json:"id"`
	BatchID           string             `bson:"batchId"             json:"batchId"`
	AgentID           primitive.ObjectID `bson:"agentId"             json:"agentId"`
	AgentName         string             `bson:"agentName"           json:"agentName"`
	FarmName          string             `bson:"farmName"            json:"farmName"`
	Location          string             `bson:"location"            json:"location"`
	TeaType           string             `bson:"teaType"             json:"teaType"`
	WeightGram        int                `bson:"weightGram"          json:"weightGram"`   // gram/gói
	QuantityAvailable int                `bson:"quantityAvailable"   json:"quantityAvailable"`
	Price             int                `bson:"price"               json:"price"`        // VND / gói
	Description       string             `bson:"description"         json:"description"`
	Contact           string             `bson:"contact"             json:"contact"`      // SĐT
	BankName          string             `bson:"bankName"            json:"bankName"`     // Tên ngân hàng
	BankAccount       string             `bson:"bankAccount"         json:"bankAccount"`  // Số tài khoản
	BankOwner         string             `bson:"bankOwner"           json:"bankOwner"`    // Chủ tài khoản
	VerifyURL         string             `bson:"verifyUrl"           json:"verifyUrl"`
	Status            string             `bson:"status"              json:"status"`       // active | closed | sold
	CreatedAt         time.Time          `bson:"createdAt"           json:"createdAt"`
	UpdatedAt         time.Time          `bson:"updatedAt"           json:"updatedAt"`
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
