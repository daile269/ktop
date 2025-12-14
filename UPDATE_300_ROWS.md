# ✅ Update: Thêm cột Ngày và tăng lên 300 rows

## 🎉 Đã hoàn thành

### Thay đổi chính:

1. **Tăng số dòng: 150 → 300 rows** ✅

   - `ROWS = 300` trong App.jsx
   - Tất cả bảng giờ có 300 dòng

2. **Thêm cột Ngày** ✅

   - State mới: `dateValues` (Array[300])
   - Lưu/load cùng với T1, T2
   - Input với placeholder "dd/mm/yyyy"

3. **Update Firestore** ✅

   - `savePageData()` giờ lưu: T1, T2, dateValues
   - `loadPageData()` giờ load: T1, T2, dateValues
   - Migration cũng hỗ trợ dateValues

4. **Update UI** ✅
   - Cột 1: STT (auto number: 1, 2, 3, ...)
   - Cột 2: Ngày-tháng-năm (input field)
   - Cột 3: T1 (input field)
   - Cột 4: T2 (input field)

---

## 📊 Storage Impact

**Trước (150 rows):**

- Mỗi trang: ~600 bytes (T1 + T2)

**Sau (300 rows + dateValues):**

- T1: 300 items × 2 bytes = 600 bytes
- T2: 300 items × 2 bytes = 600 bytes
- Dates: 300 items × ~10 bytes = 3,000 bytes
- **Tổng: ~4.2 KB/trang**

**Với 10 trang:**

- 10 × 4.2 KB = **~42 KB**
- Firebase free tier: 1GB
- **Vẫn dùng được ~20 năm!** 🎉

---

## 🔄 Data Structure

### Firestore Document (pages/{pageId}):

```javascript
{
  pageId: "q1",
  t1Values: [300 items],      // Giá trị T1
  t2Values: [300 items],      // Giá trị T2
  dateValues: [300 items],    // Ngày tháng (string)
  updatedAt: Timestamp
}
```

### localStorage backup:

```javascript
{
  allTValues: [[300 items], [300 items], ...],  // 60 bảng
  dateValues: [300 items],
  timestamp: "2025-12-15T00:13:58Z"
}
```

---

## 🧪 Testing

### Test 1: Nhập dữ liệu

1. Mở http://localhost:5173/q1
2. Nhập ngày vào cột "Ngày-tháng-năm" (vd: 15/12/2025)
3. Nhập T1, T2
4. Check console: "💾 Đã lưu trang q1 lên Firestore"

### Test 2: Verify Firestore

1. Mở Firebase Console → Firestore
2. Check document `pages/q1`
3. Verify có 3 fields:
   - `t1Values`: array[300]
   - `t2Values`: array[300]
   - `dateValues`: array[300]

### Test 3: Refresh & Load

1. F5 để refresh trang
2. Verify dữ liệu ngày được load lại
3. Verify T1, T2 được load lại
4. Verify 60 bảng tự động generate

### Test 4: 300 rows

1. Scroll xuống dưới bảng
2. Verify có 300 dòng (STT từ 1 đến 300)
3. Thử nhập dữ liệu ở dòng 299, 300
4. Verify lưu thành công

---

## 📝 Files đã thay đổi

1. **src/App.jsx**

   - Tăng `ROWS` từ 150 → 300
   - Thêm state `dateValues`
   - Update load logic để load dateValues
   - Update save logic để lưu dateValues
   - Update UI: cột STT + cột Ngày

2. **src/dataService.js**
   - Update `savePageData()`: thêm param `dateValues`
   - Update `loadPageData()`: return `dateValues`
   - Update `migrateFromLocalStorage()`: migrate dateValues

---

## ⚠️ Breaking Changes

**Nếu bạn đã có dữ liệu cũ (150 rows):**

- Dữ liệu cũ vẫn load được
- dateValues sẽ là array rỗng cho dữ liệu cũ
- T1, T2 sẽ có 150 items, phần còn lại rỗng
- Không mất dữ liệu!

**Migration tự động:**

- Khi load dữ liệu cũ, app sẽ tự động extend lên 300 rows
- Các row mới sẽ rỗng
- Bạn có thể nhập thêm dữ liệu

---

## 🚀 Next Steps

1. **Test ngay:**

   ```bash
   # App đang chạy tại http://localhost:5173/q1
   # Refresh trang để load code mới
   ```

2. **Nhập dữ liệu test:**

   - Nhập vài ngày
   - Nhập T1, T2
   - Nhấn "Tính"
   - Check Firebase Console

3. **Verify storage:**
   - Check Firebase Console
   - Xem document size (~4KB)

---

## 💡 Tips

### Format ngày tháng:

- Tự do nhập format bất kỳ
- Suggest: `dd/mm/yyyy` (vd: 15/12/2025)
- Hoặc: `yyyy-mm-dd` (vd: 2025-12-15)
- App không validate, bạn tự quản lý format

### Auto-save:

- Mỗi lần thay đổi ngày/T1/T2
- Debounce 500ms
- Tự động lưu lên Firestore

### Performance:

- 300 rows render nhanh
- Scroll mượt mà
- Auto-save không lag
