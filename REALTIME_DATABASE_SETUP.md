# 🔥 Setup Realtime Database

Đã chuyển từ Firestore sang **Realtime Database**!

## 📋 Các bước setup:

### Bước 1: Lấy Database URL

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn
3. Menu trái → **Realtime Database**
4. Copy **Database URL** (dạng: `https://your-project-id-default-rtdb.firebaseio.com`)

### Bước 2: Update file `.env`

Mở file `.env` và thêm dòng này:

```bash
VITE_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
```

**Ví dụ file `.env` đầy đủ:**

```bash
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=ktop-xxxxx.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://ktop-xxxxx-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=ktop-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=ktop-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxx
```

### Bước 3: Update Realtime Database Rules

1. Firebase Console → **Realtime Database** → Tab **Rules**
2. Paste rules này:

```json
{
  "rules": {
    "pages": {
      "$pageId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

3. Click **Publish**

### Bước 4: Restart Dev Server

```bash
# Stop server hiện tại (Ctrl+C)
# Restart
npm run dev
```

---

## ✅ Test:

1. Refresh trang (F5)
2. Nhập T1, T2
3. Nhấn "Tính"
4. Check console: "💾 Đã lưu trang q1 lên Realtime Database"
5. Refresh lại → Dữ liệu load từ Realtime Database

---

## 🔒 Security Rules (Production):

**Hiện tại (Development):**

```json
{
  "rules": {
    "pages": {
      "$pageId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

**Sau này (Production với Authentication):**

```json
{
  "rules": {
    "pages": {
      "$pageId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

---

## 📊 Data Structure trong Realtime Database:

```
pages/
  ├── q1/
  │   ├── pageId: "q1"
  │   ├── t1Values: [...]
  │   ├── t2Values: [...]
  │   ├── dateValues: [...]
  │   └── updatedAt: "2025-12-15T..."
  ├── q2/
  │   └── ...
  └── q3/
      └── ...
```

---

## 💡 So sánh Firestore vs Realtime Database:

|                 | Firestore             | Realtime Database   |
| --------------- | --------------------- | ------------------- |
| **Setup**       | Cần Blaze Plan        | ✅ Spark Plan OK    |
| **Data format** | Documents/Collections | JSON tree           |
| **Queries**     | Mạnh hơn              | Đơn giản hơn        |
| **Free tier**   | 1GB, 50K reads        | 1GB, 100K downloads |
| **App này**     | ✅ Đủ                 | ✅ Đủ               |

---

## 🎉 Done!

Bây giờ app dùng **Realtime Database** - miễn phí, không cần thẻ tín dụng!
