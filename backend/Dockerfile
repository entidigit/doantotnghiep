# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Cài git (cần cho một số Go module dùng VCS)
RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o tea-origin .

# ── Stage 2: run ────────────────────────────────────────────────────────────
FROM alpine:3.19

WORKDIR /app

# Cài ca-certificates để gọi HTTPS ra blockchain
RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /app/tea-origin .

# Thư mục lưu ảnh sự kiện (gắn volume từ ngoài)
RUN mkdir -p uploads

EXPOSE 8080

CMD ["./tea-origin"]
