# Test Firebase Integration

## Quick Test Steps

### 1. Kiểm tra Firebase đã cài

```bash
npm list firebase
# Should show: firebase@10.x.x
```

### 2. Kiểm tra .env file

```bash
cat .env
# Should have all VITE_FIREBASE_* variables filled
```

### 3. Start dev server

```bash
npm run dev
```

### 4. Test trong browser

#### Test 1: Load trang /q1

- Mở http://localhost:5173/q1
- Check console:
  - Nếu chưa có dữ liệu: "ℹ️ Trang q1 chưa có dữ liệu"
  - Nếu có dữ liệu: "✅ Đã tải trang q1 từ Firestore"

#### Test 2: Nhập dữ liệu

- Nhập vài số vào cột T1 (vd: 1, 2, 3, 4, 5)
- Nhập vài số vào cột T2 (vd: 2, 3, 4, 5, 6)
- Check console: "💾 Đã lưu trang q1 lên Firestore"
- Check header: "✅ Đã lưu lên cloud"

#### Test 3: Generate bảng

- Nhấn nút "Tính"
- Verify 60 bảng được hiển thị
- Verify T3 = T1 + T2 (lấy chữ số cuối)
- Verify màu sắc đúng (đỏ, tím)

#### Test 4: Refresh trang

- F5 để refresh
- Check console: "✅ Đã tải trang q1 từ Firestore"
- Verify dữ liệu T1, T2 vẫn còn
- Verify 60 bảng tự động generate lại

#### Test 5: Firebase Console

- Mở https://console.firebase.google.com/
- Vào project của bạn
- Click "Firestore Database"
- Verify collection "pages" tồn tại
- Verify document "q1" có:
  - t1Values: array[150]
  - t2Values: array[150]
  - updatedAt: timestamp

#### Test 6: URL routing

- Mở http://localhost:5173/q2
- Nhập dữ liệu khác
- Verify lưu riêng biệt
- Quay lại /q1
- Verify dữ liệu /q1 vẫn còn

#### Test 7: Xóa dữ liệu

- Nhấn nút "Xóa dữ liệu" (màu đỏ)
- Confirm
- Check console: "🗑️ Đã xóa tất cả dữ liệu"
- Verify bảng trống
- Check Firebase Console: document "q1" đã bị xóa

## Expected Console Logs

### Khi load trang lần đầu (chưa có dữ liệu):

```
ℹ️ Trang q1 chưa có dữ liệu
Không có dữ liệu trên Firestore, thử migrate từ localStorage...
```

### Khi nhập dữ liệu:

```
💾 Đã lưu trang q1 lên Firestore
```

### Khi refresh trang (đã có dữ liệu):

```
✅ Đã tải trang q1 từ Firestore
=== GENERATING 60 TABLES FROM SAVED DATA ===
...
Hoàn tất gen 60 bảng!
```

### Khi xóa dữ liệu:

```
🗑️ Đã xóa trang q1 khỏi Firestore
🗑️ Đã xóa tất cả dữ liệu (Firestore + localStorage)
```

## Troubleshooting

### Lỗi: "Firebase: Error (auth/api-key-not-valid)"

**Nguyên nhân:** API key sai hoặc chưa điền
**Giải pháp:**

1. Check file `.env`
2. Verify API key từ Firebase Console
3. Restart dev server

### Lỗi: "Missing or insufficient permissions"

**Nguyên nhân:** Firestore rules không cho phép read/write
**Giải pháp:**

1. Vào Firebase Console → Firestore Database → Rules
2. Update rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /pages/{pageId} {
      allow read, write: if true;
    }
  }
}
```

### Không thấy "💾 Đã lưu lên cloud"

**Nguyên nhân:** Firebase chưa được config đúng
**Giải pháp:**

1. Check console có lỗi
2. Verify `.env` đã điền đầy đủ
3. Restart dev server
4. Check Network tab → Firestore requests

### Dữ liệu không load sau refresh

**Nguyên nhân:**

- Firebase chưa lưu thành công
- URL khác nhau (/q1 vs /q2)
  **Giải pháp:**

1. Check Firebase Console có document không
2. Verify URL đúng
3. Check console logs
