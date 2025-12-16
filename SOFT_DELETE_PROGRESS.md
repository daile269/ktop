# ✅ Đã hoàn thành: Update dataService.js

## Thay đổi:

### 1. `savePageData` - Lưu deletedRows

```javascript
export const savePageData = async (
  pageId,
  t1Values,
  t2Values,
  dateValues,
  deletedRows = [] // ← Thêm parameter
) => {
  // Trim deletedRows
  const trimmedDeleted =
    lastIndex >= 0 ? deletedRows.slice(0, lastIndex + 1) : [];

  // Lưu vào DB
  await set(pageRef, {
    pageId,
    t1Values: trimmedT1,
    t2Values: trimmedT2,
    dateValues: trimmedDates,
    deletedRows: trimmedDeleted, // ← Lưu deletedRows
    updatedAt: new Date().toISOString(),
  });
};
```

### 2. `loadPageData` - Load deletedRows

```javascript
export const loadPageData = async (pageId) => {
  const data = snapshot.val();

  const deleted = data.deletedRows || []; // ← Load deletedRows

  // Pad với false
  while (deleted.length < ROWS) deleted.push(false);

  return {
    success: true,
    data: {
      t1Values: t1,
      t2Values: t2,
      dateValues: dates,
      deletedRows: deleted, // ← Return deletedRows
    },
  };
};
```

---

## 🔜 Bước tiếp theo: Update App.jsx

### 1. Load deletedRows khi mount

Tìm useEffect load data, thêm:

```javascript
if (result.success && result.data) {
  const newAllTValues = [...allTValues];
  newAllTValues[0] = result.data.t1Values;
  newAllTValues[1] = result.data.t2Values;

  setAllTValues(newAllTValues);
  setDateValues(result.data.dateValues || Array(ROWS).fill(""));
  setDeletedRows(result.data.deletedRows || Array(ROWS).fill(false)); // ← Thêm
  setIsDataLoaded(true);
}
```

### 2. Update handleDelete - Xóa theo dòng

Thay logic shift bằng mark deleted:

```javascript
else if (deleteOption === "rows") {
  const from = parseInt(deleteRowFrom) - 1;
  const to = parseInt(deleteRowTo) - 1;

  if (isNaN(from) || isNaN(to) || from < 0 || to >= ROWS || from > to) {
    alert("⚠️ Số dòng không hợp lệ!");
    return;
  }

  const deleteCount = to - from + 1;
  const newDeletedRows = [...deletedRows];

  // Đánh dấu deleted (KHÔNG shift)
  for (let i = from; i <= to; i++) {
    newDeletedRows[i] = true;
  }

  setDeletedRows(newDeletedRows);

  // Lưu với deletedRows
  setSaveStatus("💾 Đang lưu...");
  const result = await savePageData(
    pageId,
    allTValues[0],
    allTValues[1],
    dateValues,
    newDeletedRows  // ← Pass deletedRows
  );

  // Sync sang Q1-Q10
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

### 3. Update Render - Skip deleted rows

**Bảng trái:**

```javascript
<tbody>
  {Array.from({ length: ROWS }, (_, rowIndex) => {
    // Skip deleted rows
    if (deletedRows[rowIndex]) return null;

    return <tr key={rowIndex}>{/* ... */}</tr>;
  })}
</tbody>
```

**Bảng phải:**

```javascript
<tbody>
  {tableData.map((row, rowIndex) => {
    // Skip deleted rows
    if (deletedRows[rowIndex]) return null;

    return <tr key={rowIndex}>{/* ... */}</tr>;
  })}
</tbody>
```

### 4. Update Xóa tất cả

```javascript
if (deleteOption === "all") {
  // ...
  setDeletedRows(Array(ROWS).fill(false)); // ← Reset deletedRows
  // ...
}
```

### 5. Update Save calls

Tìm tất cả `savePageData` calls và thêm `deletedRows`:

```javascript
// Trước
await savePageData(pageId, allTValues[0], allTValues[1], dateValues);

// Sau
await savePageData(
  pageId,
  allTValues[0],
  allTValues[1],
  dateValues,
  deletedRows
);
```

---

## 📊 Kết quả

**Trước:**

- Xóa dòng 01 → Shift data → Grid regenerate → 0-2 thành 0-1 ❌

**Sau:**

- Xóa dòng 01 → Đánh dấu deleted → Ẩn row → Grid giữ nguyên 0-2 ✅

---

## ✅ Checklist

- [x] Update `dataService.js` - Lưu/load deletedRows
- [ ] Load deletedRows khi mount
- [ ] Update handleDelete - Mark deleted thay vì shift
- [ ] Update render - Skip deleted rows
- [ ] Update xóa tất cả - Reset deletedRows
- [ ] Update tất cả savePageData calls

---

Bạn muốn tôi implement các bước còn lại không? 🚀
