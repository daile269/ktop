# ✅ Hoàn thành! Trang nhập 10Q

## Đã tạo file mới:

**`src/InputPage.jsx`** - Trang nhập T1, T2 cho 10Q

---

## Cần làm: Update App.jsx (2 chỗ)

### 1. Thêm import (dòng 9)

**Tìm:**

```javascript
} from "./dataService";

function App() {
```

**Thêm sau dòng 8:**

```javascript
import InputPage from "./InputPage";
```

### 2. Thêm routing (dòng 19-20)

**Tìm:**

```javascript
// Lấy pageId từ URL (vd: /q1 -> pageId = 'q1')
const pageId = window.location.pathname.slice(1) || "q1";
```

**Thay bằng:**

```javascript
// Check if route is /input
const pathname = window.location.pathname.slice(1);
if (pathname === "input") {
  return <InputPage />;
}

// Lấy pageId từ URL (vd: /q1 -> pageId = 'q1')
const pageId = pathname || "q1";
```

---

## Cách dùng:

1. Truy cập: `http://localhost:5173/input`
2. Nhập T1, T2 cho 10Q
3. Click "Lưu dữ liệu"
4. Quay lại Q1-Q10 để xem kết quả

---

## Link thêm vào Q1-Q10:

Trong App.jsx, tìm dropdown Q (dòng ~520), thêm link:

```javascript
<a href="/input" style={{ marginLeft: "10px" }}>
  ✏️ Nhập 10Q
</a>
```

---

Xong! Chỉ cần sửa 2 chỗ trong App.jsx! 🎉
