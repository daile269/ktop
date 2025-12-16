# Soft Delete Implementation - Code Changes

## File: App.jsx

### 1. Load deletedRows khi mount (Dòng ~75)

**Tìm:**

```javascript
setDateValues(result.data.dateValues || Array(ROWS).fill(""));
setIsDataLoaded(true);
```

**Thay bằng:**

```javascript
setDateValues(result.data.dateValues || Array(ROWS).fill(""));
setDeletedRows(result.data.deletedRows || Array(ROWS).fill(false)); // ← Thêm dòng này
setIsDataLoaded(true);
```

---

### 2. Update handleDelete - Xóa tất cả (Dòng ~360)

**Tìm:**

```javascript
setDateValues(Array(ROWS).fill(""));
setAllTableData(
```

**Thay bằng:**

```javascript
setDateValues(Array(ROWS).fill(""));
setDeletedRows(Array(ROWS).fill(false)); // ← Thêm dòng này
setAllTableData(
```

---

### 3. Update handleDelete - Xóa theo dòng (Dòng ~370-430)

**Tìm toàn bộ block:**

```javascript
} else if (deleteOption === "rows") {
  // Xóa theo số dòng và shift data lên
  const from = parseInt(deleteRowFrom) - 1;
  const to = parseInt(deleteRowTo) - 1;

  // ... (toàn bộ logic shift)
}
```

**Thay bằng:**

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
    newDeletedRows  // ← Pass deletedRows
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
          newDeletedRows  // ← Sync deletedRows
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

### 4. Update Render - Bảng trái (Dòng ~620)

**Tìm:**

```javascript
<tbody>
  {Array.from({ length: ROWS }, (_, rowIndex) => (
    <tr key={rowIndex}>
```

**Thay bằng:**

```javascript
<tbody>
  {Array.from({ length: ROWS }, (_, rowIndex) => {
    // Skip deleted rows
    if (deletedRows[rowIndex]) return null;

    return (
      <tr key={rowIndex}>
```

**Và thêm closing:**

```javascript
      </tr>
    );
  })}
</tbody>
```

---

### 5. Update Render - Bảng phải (Dòng ~720)

**Tìm:**

```javascript
<tbody>
  {tableData.map((row, rowIndex) => (
    <tr key={rowIndex}>
```

**Thay bằng:**

```javascript
<tbody>
  {tableData.map((row, rowIndex) => {
    // Skip deleted rows
    if (deletedRows[rowIndex]) return null;

    return (
      <tr key={rowIndex}>
```

**Và thêm closing:**

```javascript
      </tr>
    );
  })}
</tbody>
```

---

### 6. Update tất cả savePageData calls

**Tìm tất cả:**

```javascript
await savePageData(pageId, allTValues[0], allTValues[1], dateValues);
```

**Thay bằng:**

```javascript
await savePageData(
  pageId,
  allTValues[0],
  allTValues[1],
  dateValues,
  deletedRows
);
```

**Locations:**

- handleGenerate (~line 250)
- handleDelete - dates (~line 480)
- Date input onChange (~line 640)

---

## Tóm tắt thay đổi:

1. ✅ Load `deletedRows` khi mount
2. ✅ Reset `deletedRows` khi xóa tất cả
3. ✅ Mark deleted thay vì shift khi xóa theo dòng
4. ✅ Skip deleted rows khi render
5. ✅ Pass `deletedRows` vào tất cả `savePageData` calls

---

## Test:

1. Nhập T1=1, T2=2 ở dòng 01
2. Click "Tính" → Grid: 0-1, 1-2, 2-3
3. Xóa dòng 01 → Dòng 01 biến mất
4. Refresh → Dòng 01 vẫn bị ẩn
5. Check DB → T1=1, T2=2, deletedRows[1]=true vẫn còn

Bạn muốn tôi tạo file App.jsx hoàn chỉnh với tất cả changes không? 🚀
