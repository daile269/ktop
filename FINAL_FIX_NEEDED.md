# 🎯 App.jsx - Chỉ còn 1 chỗ cần sửa!

## ✅ Đã tự động (bởi Python script):

1. ✅ Load deletedRows khi mount
2. ✅ Reset deletedRows khi xóa tất cả
3. ✅ Update tất cả savePageData calls
4. ✅ Skip deleted rows khi render

---

## ⚠️ CẦN SỬA THỦ CÔNG - Xóa theo dòng:

### Tìm (khoảng dòng 365-432):

```javascript
} else if (deleteOption === "rows") {
  // Xóa theo số dòng và shift data lên
  const from = parseInt(deleteRowFrom) - 1;
  const to = parseInt(deleteRowTo) - 1;

  if (isNaN(from) || isNaN(to) || from < 0 || to >= ROWS || from > to) {
    alert("⚠️ Số dòng không hợp lệ!");
    return;
  }

  const deleteCount = to - from + 1;

  // Shift data lên (xóa và đẩy lên)
  for (let i = from; i < ROWS; i++) {
    if (i + deleteCount < ROWS) {
      newAllTValues[0][i] = newAllTValues[0][i + deleteCount];
      newAllTValues[1][i] = newAllTValues[1][i + deleteCount];
      newDateValues[i] = newDateValues[i + deleteCount];
    } else {
      newAllTValues[0][i] = "";
      newAllTValues[1][i] = "";
      newDateValues[i] = "";
    }
  }

  setAllTValues(newAllTValues);
  setDateValues(newDateValues);

  // Regenerate 60 bảng với data mới
  generateTableWithValues(newAllTValues);

  // Lưu Q hiện tại
  setSaveStatus("💾 Đang lưu...");
  const result = await savePageData(
    pageId,
    newAllTValues[0],
    newAllTValues[1],
    newDateValues
  );

  // Sync dateValues sang Q1-Q10
  for (let i = 1; i <= 10; i++) {
    const qId = `q${i}`;
    if (qId !== pageId) {
      const qResult = await loadPageData(qId);
      if (qResult.success && qResult.data) {
        await savePageData(
          qId,
          qResult.data.t1Values,
          qResult.data.t2Values,
          newDateValues
        );
      }
    }
  }

  if (result.success) {
    setSaveStatus("✅ Đã lưu dữ liệu thành công");
    alert(`✅ Đã xóa ${deleteCount} dòng (đồng bộ Q1-Q10)!`);
  } else {
    setSaveStatus("⚠️ Lỗi: " + result.error);
  }

  setTimeout(() => setSaveStatus(""), 2000);
}
```

### Thay bằng:

```javascript
} else if (deleteOption === "rows") {
  // Đánh dấu rows bị xóa (soft delete)
  const from = parseInt(deleteRowFrom) - 1;
  const to = parseInt(deleteRowTo) - 1;

  if (isNaN(from) || isNaN(to) || from < 0 || to >= ROWS || from > to) {
    alert("⚠️ Số dòng không hợp lệ!");
    return;
  }

  const deleteCount = to - from + 1;
  const newDeletedRows = [...deletedRows];

  // Đánh dấu deleted (KHÔNG shift data)
  for (let i = from; i <= to; i++) {
    newDeletedRows[i] = true;
  }

  setDeletedRows(newDeletedRows);

  // Lưu Q hiện tại
  setSaveStatus("💾 Đang lưu...");
  const result = await savePageData(
    pageId,
    allTValues[0],
    allTValues[1],
    dateValues,
    newDeletedRows
  );

  // Sync deletedRows sang Q1-Q10
  for (let i = 1; i <= 10; i++) {
    const qId = `q${i}`;
    if (qId !== pageId) {
      const qResult = await loadPageData(qId);
      if (qResult.success && qResult.data) {
        await savePageData(
          qId,
          qResult.data.t1Values,
          qResult.data.t2Values,
          dateValues,
          newDeletedRows
        );
      }
    }
  }

  if (result.success) {
    setSaveStatus("✅ Đã lưu dữ liệu thành công");
    alert(`✅ Đã ẩn ${deleteCount} dòng (đồng bộ Q1-Q10)!`);
  } else {
    setSaveStatus("⚠️ Lỗi: " + result.error);
  }

  setTimeout(() => setSaveStatus(""), 2000);
}
```

---

## 🔑 Điểm khác biệt:

### Trước (Hard Delete):

```javascript
// Shift data lên
for (let i = from; i < ROWS; i++) {
  if (i + deleteCount < ROWS) {
    newAllTValues[0][i] = newAllTValues[0][i + deleteCount];
    // ...
  }
}
setAllTValues(newAllTValues);
generateTableWithValues(newAllTValues); // ← Regenerate grid
```

### Sau (Soft Delete):

```javascript
// Đánh dấu deleted
const newDeletedRows = [...deletedRows];
for (let i = from; i <= to; i++) {
  newDeletedRows[i] = true;
}
setDeletedRows(newDeletedRows);
// KHÔNG shift data, KHÔNG regenerate grid
```

---

## 📝 Cách sửa:

1. Mở `src/App.jsx`
2. Tìm function `handleDelete` (dòng ~338)
3. Tìm block `} else if (deleteOption === "rows") {`
4. **Xóa toàn bộ** từ dòng `// Xóa theo số dòng...` đến `setTimeout(() => setSaveStatus(""), 2000);`
5. **Paste** code mới ở trên

---

## ✅ Sau khi sửa xong:

**Test:**

1. Nhập T1=1, T2=2 ở dòng 01
2. Click "Tính" → Grid: 0-1, 1-2, 2-3
3. Xóa dòng 01
4. ✅ Dòng 01 biến mất
5. ✅ Grid của dòng 02 vẫn là 0-2 (không đổi thành 0-1)
6. Refresh → Dòng 01 vẫn ẩn
7. Check DB → T1, T2, grid vẫn còn, chỉ có deletedRows[1]=true

**Xong!** 🎉
