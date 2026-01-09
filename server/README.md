# KTOP Backend Server

Backend API cho ứng dụng KTOP sử dụng Node.js, Express và MongoDB.

## Yêu cầu

- Node.js >= 18.x
- MongoDB Community Server (đã cài đặt và đang chạy)

## Cài đặt

1. **Cài đặt dependencies:**

```bash
cd server
npm install
```

2. **Cấu hình environment:**

```bash
# Copy file .env.example thành .env
cp .env.example .env

# Hoặc tạo file .env với nội dung:
MONGODB_URI=mongodb://localhost:27017/ktop
PORT=5000
NODE_ENV=development
```

3. **Chạy server:**

```bash
# Development mode (auto-restart khi có thay đổi)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Health Check

```
GET /api/health
```

Kiểm tra trạng thái server và database connection.

### Get All Pages

```
GET /api/pages
```

Lấy danh sách tất cả các pages (dùng để debug).

### Get Page Data

```
GET /api/pages/:pageId
```

Lấy dữ liệu của một page cụ thể (q1, q2, ..., q10).

**Response:**

```json
{
  "success": true,
  "data": {
    "t1Values": [...],
    "t2Values": [...],
    "dateValues": [...],
    "deletedRows": [...],
    "purpleRangeFrom": 0,
    "purpleRangeTo": 0,
    "keepLastNRows": 366
  }
}
```

### Save Page Data

```
POST /api/pages/:pageId
```

Lưu dữ liệu cho một page.

**Request Body:**

```json
{
  "t1Values": [...],
  "t2Values": [...],
  "dateValues": [...],
  "deletedRows": [...],
  "purpleRangeFrom": 0,
  "purpleRangeTo": 0,
  "keepLastNRows": 366
}
```

### Delete Page Data

```
DELETE /api/pages/:pageId
```

Xóa dữ liệu của một page.

## Database Schema

**Collection:** `pages`

```javascript
{
  pageId: String,        // "q1", "q2", etc.
  t1Values: [String],
  t2Values: [String],
  dateValues: [String],
  deletedRows: [Boolean],
  purpleRangeFrom: Number,
  purpleRangeTo: Number,
  keepLastNRows: Number,
  updatedAt: Date,
  createdAt: Date
}
```

## Troubleshooting

### MongoDB không kết nối được

```bash
# Kiểm tra MongoDB đang chạy
mongod --version

# Nếu chưa chạy, start MongoDB service (Windows)
net start MongoDB
```

### Port 5000 đã được sử dụng

Sửa file `.env`:

```
PORT=5001
```

## Development

### Cấu trúc thư mục

```
server/
├── models/
│   └── Page.js          # Mongoose schema
├── .env.example         # Environment template
├── package.json
├── server.js            # Main server file
└── README.md
```

### Logs

Server sẽ log các hoạt động:

- ✅ Thành công
- ❌ Lỗi
- 📖 Load data
- 💾 Save data
- 🗑️ Delete data
