# Hướng dẫn Development

## 🚀 Chạy Frontend với Hot Reload (Dùng Backend Docker)

### Bước 1: Đảm bảo Docker backend đang chạy

```bash
cd doantotnghiep
docker-compose up -d backend mongo
```

Kiểm tra backend:
```bash
curl http://localhost:9998/health
# Hoặc mở browser: http://localhost:9998/health
```

Nếu thấy `{"status":"ok","service":"tea-origin"}` là backend đã sẵn sàng!

### Bước 2: Chạy Vite dev server

```bash
cd doantotnghiep/frontend
npm run dev
```

**Xong!** Giờ bạn có:
- ✅ Frontend dev: http://localhost:3000 (hot reload)
- ✅ Backend API: http://localhost:9998 (Docker)
- ✅ Vite tự động proxy API calls

## 🔄 Luồng hoạt động:

```
Browser (localhost:3000)
    ↓ /api/listings
Vite Dev Server
    ↓ Proxy to
Docker Backend (localhost:9998)
    ↓ Response
Vite → Browser
```

## 📝 Workflow đơn giản:

1. **Chạy Docker backend** (1 lần, để chạy background):
   ```bash
   cd doantotnghiep
   docker-compose up -d backend mongo
   ```

2. **Chạy Vite** (mỗi khi dev):
   ```bash
   cd doantotnghiep/frontend
   npm run dev
   ```

3. **Sửa code frontend** → Tự động reload! ⚡

## 🎯 Ưu điểm:

✅ **Không cần chạy Go local** - Dùng backend Docker
✅ **Hot reload** - Sửa code frontend reload ngay
✅ **Fast Refresh** - Giữ React state
✅ **Không cần rebuild Docker** - Chỉ frontend reload
✅ **Backend stable** - Docker backend chạy background

## 🔧 Các lệnh hữu ích:

### Xem logs backend Docker:
```bash
docker logs -f tea_backend
```

### Restart backend nếu cần:
```bash
docker-compose restart backend
```

### Stop tất cả:
```bash
docker-compose down
```

### Xem services đang chạy:
```bash
docker-compose ps
```

## 🌐 Ports:

- **Frontend Dev**: http://localhost:3000 (Vite)
- **Backend API**: http://localhost:9998 (Docker)
- **Frontend Prod**: http://localhost:9999 (Docker - khi build)
- **MongoDB**: localhost:27017 (internal)

## 🔍 Troubleshooting:

### Backend không chạy?
```bash
# Kiểm tra containers
docker-compose ps

# Xem logs
docker logs tea_backend

# Restart
docker-compose restart backend
```

### Port 9998 bị chiếm?
Sửa trong `docker-compose.yml`:
```yaml
backend:
  ports:
    - "8080:8080"  # Đổi port bên trái
```

Và update `vite.config.ts`:
```typescript
const BACKEND_URL = 'http://localhost:8080'
```

### Vite không connect được backend?
```bash
# Test backend trực tiếp
curl http://localhost:9998/health

# Nếu không được, restart Docker
docker-compose restart backend
```

## 🚀 Production Build:

```bash
cd doantotnghiep/frontend
npm run build

# Build Docker image
cd ..
docker-compose build frontend
docker-compose up -d frontend
```

---

**Tóm lại**: 
1. Docker backend chạy background (port 9998)
2. Vite dev frontend (port 3000) với hot reload
3. Sửa code → Reload tức thì! ⚡
