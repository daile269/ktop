# Hướng dẫn Setup Firebase

## Bước 1: Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Đăng nhập bằng Google Account
3. Click "Add project" (Thêm dự án)
4. Đặt tên project (vd: "ktop-app")
5. Tắt Google Analytics (không cần thiết)
6. Click "Create project"

## Bước 2: Thêm Web App

1. Trong Firebase Console, click vào icon Web (</>) để thêm web app
2. Đặt tên app (vd: "ktop-web")
3. KHÔNG check "Firebase Hosting" (chưa cần)
4. Click "Register app"

## Bước 3: Copy Firebase Config

Sau khi register, bạn sẽ thấy Firebase configuration như này:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

## Bước 4: Cập nhật file .env

Mở file `.env` trong project và điền các giá trị:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Bước 5: Tạo Firestore Database

1. Trong Firebase Console, vào menu bên trái
2. Click "Firestore Database"
3. Click "Create database"
4. Chọn "Start in **test mode**" (cho development)
5. Chọn location gần nhất (vd: asia-southeast1)
6. Click "Enable"

⚠️ **Lưu ý về Security Rules:**
Test mode cho phép read/write tự do trong 30 ngày. Sau đó bạn cần update rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /pages/{pageId} {
      allow read, write: if true; // Cho phép tất cả (không an toàn cho production)
    }
  }
}
```

## Bước 6: Restart Dev Server

Sau khi cập nhật `.env`, restart dev server:

```bash
# Dừng server hiện tại (Ctrl+C)
# Chạy lại
npm run dev
```

## Bước 7: Test

1. Mở http://localhost:5173/q1
2. Nhập dữ liệu T1, T2
3. Nhấn "Tính"
4. Check console: should see "💾 Đã lưu trang q1 lên Firestore"
5. Mở Firebase Console → Firestore Database
6. Verify document `pages/q1` được tạo với t1Values và t2Values

## Troubleshooting

**Lỗi: "Firebase: Error (auth/api-key-not-valid)"**

- Kiểm tra lại API key trong `.env`
- Đảm bảo không có khoảng trắng thừa

**Lỗi: "Missing or insufficient permissions"**

- Vào Firestore Database → Rules
- Đảm bảo rules cho phép read/write

**Không thấy dữ liệu trong Firestore:**

- Check console có lỗi không
- Verify `.env` file đã được load (restart dev server)
- Check Network tab trong DevTools

## Kiểm tra URL routing

- `/q1` → Trang 1 (pageId = 'q1')
- `/q2` → Trang 2 (pageId = 'q2')
- `/` → Default trang 1 (pageId = 'q1')

Mỗi URL sẽ load/save dữ liệu riêng biệt!
