# Implementation Plan: Nhập T1, T2 cho 10Q trong 1 trang

## 🎯 Mục tiêu:

**UI mới:**

```
STT | Ngày | Q1-T1 | Q1-T2 | Q2-T1 | Q2-T2 | ... | Q10-T1 | Q10-T2
00  | date | 1     | 2     | 3     | 4     | ... | 9      | 0
01  | date | 5     | 6     | 7     | 8     | ... | 1      | 2
```

**DB vẫn như cũ:**

- Mỗi Q lưu riêng: `pages/q1/`, `pages/q2/`, ...
- Mỗi Q có: `t1Values`, `t2Values`, `dateValues`, `deletedRows`, `purpleRange`

---

## 📋 Các bước thực hiện:

### 1. Thay đổi State

**Thêm state mới:**

```javascript
// State cho T1, T2 của 10Q
const [allQData, setAllQData] = useState(
  Array(10)
    .fill(null)
    .map(() => ({
      t1Values: Array(ROWS).fill(""),
      t2Values: Array(ROWS).fill(""),
    }))
);
```

**Cấu trúc:**

```javascript
allQData = [
  { t1Values: [...], t2Values: [...] }, // Q1
  { t1Values: [...], t2Values: [...] }, // Q2
  ...
  { t1Values: [...], t2Values: [...] }  // Q10
]
```

---

### 2. Load Data từ 10Q

**Trong `loadData`:**

```javascript
const loadData = async () => {
  // Load data từ tất cả 10Q
  const loadPromises = [];
  for (let i = 1; i <= 10; i++) {
    loadPromises.push(loadPageData(`q${i}`));
  }

  const results = await Promise.all(loadPromises);

  const newAllQData = [];
  let sharedDateValues = [];
  let sharedDeletedRows = [];
  let sharedPurpleFrom = 0;
  let sharedPurpleTo = 0;

  results.forEach((result, index) => {
    if (result.success && result.data) {
      newAllQData.push({
        t1Values: result.data.t1Values,
        t2Values: result.data.t2Values,
      });

      // Lấy shared data từ Q1
      if (index === 0) {
        sharedDateValues = result.data.dateValues;
        sharedDeletedRows = result.data.deletedRows;
        sharedPurpleFrom = result.data.purpleRangeFrom;
        sharedPurpleTo = result.data.purpleRangeTo;
      }
    } else {
      newAllQData.push({
        t1Values: Array(ROWS).fill(""),
        t2Values: Array(ROWS).fill(""),
      });
    }
  });

  setAllQData(newAllQData);
  setDateValues(sharedDateValues);
  setDeletedRows(sharedDeletedRows);
  setPurpleRangeFrom(sharedPurpleFrom);
  setPurpleRangeTo(sharedPurpleTo);
};
```

---

### 3. Update UI - Bảng trái

**Header:**

```javascript
<thead>
  <tr>
    <th rowSpan="2">STT</th>
    <th rowSpan="2">Ngày</th>
    <th colSpan="2">Q1</th>
    <th colSpan="2">Q2</th>
    <th colSpan="2">Q3</th>
    <th colSpan="2">Q4</th>
    <th colSpan="2">Q5</th>
    <th colSpan="2">Q6</th>
    <th colSpan="2">Q7</th>
    <th colSpan="2">Q8</th>
    <th colSpan="2">Q9</th>
    <th colSpan="2">Q10</th>
  </tr>
  <tr>
    {Array.from({ length: 10 }, (_, qIndex) => (
      <React.Fragment key={qIndex}>
        <th>T1</th>
        <th>T2</th>
      </React.Fragment>
    ))}
  </tr>
</thead>
```

**Body:**

```javascript
<tbody>
  {Array.from({ length: ROWS }, (_, rowIndex) => {
    if (deletedRows[rowIndex]) return null;

    return (
      <tr key={rowIndex}>
        <td>{String(rowIndex).padStart(2, "0")}</td>
        <td>
          <input
            type="date"
            value={dateValues[rowIndex] || ""}
            onChange={(e) => {
              const newDateValues = [...dateValues];
              newDateValues[rowIndex] = e.target.value;
              setDateValues(newDateValues);
            }}
          />
        </td>

        {/* 10 cột T1, T2 cho Q1-Q10 */}
        {Array.from({ length: 10 }, (_, qIndex) => (
          <React.Fragment key={qIndex}>
            <td>
              <input
                type="text"
                value={allQData[qIndex].t1Values[rowIndex] || ""}
                onChange={(e) => {
                  const newAllQData = [...allQData];
                  newAllQData[qIndex].t1Values[rowIndex] = e.target.value;
                  setAllQData(newAllQData);
                }}
              />
            </td>
            <td>
              <input
                type="text"
                value={allQData[qIndex].t2Values[rowIndex] || ""}
                onChange={(e) => {
                  const newAllQData = [...allQData];
                  newAllQData[qIndex].t2Values[rowIndex] = e.target.value;
                  setAllQData(newAllQData);
                }}
              />
            </td>
          </React.Fragment>
        ))}
      </tr>
    );
  })}
</tbody>
```

---

### 4. Save Data vào 10Q

**Trong `handleGenerate` (nút "Lưu dữ liệu"):**

```javascript
const handleGenerate = async () => {
  setIsGenerating(true);

  // Lưu vào tất cả 10Q
  const savePromises = [];

  for (let qIndex = 0; qIndex < 10; qIndex++) {
    const qId = `q${qIndex + 1}`;

    savePromises.push(
      savePageData(
        qId,
        allQData[qIndex].t1Values,
        allQData[qIndex].t2Values,
        dateValues,
        deletedRows,
        purpleRangeFrom,
        purpleRangeTo
      )
    );
  }

  await Promise.all(savePromises);

  setIsGenerating(false);
  alert("✅ Đã lưu tất cả Q1-Q10!");
};
```

---

### 5. Xóa đồng bộ

**Xóa theo dòng/ngày đã sync `deletedRows` rồi, không cần thay đổi!**

---

### 6. Bảng phải - Hiển thị theo Q

**Thêm dropdown chọn Q:**

```javascript
const [selectedQ, setSelectedQ] = useState(1);

// Trong render
<select value={selectedQ} onChange={(e) => setSelectedQ(parseInt(e.target.value))}>
  {Array.from({ length: 10 }, (_, i) => (
    <option key={i} value={i + 1}>Q{i + 1}</option>
  ))}
</select>

// Generate bảng cho Q được chọn
const currentQData = allQData[selectedQ - 1];
generateTableWithValues([currentQData.t1Values, currentQData.t2Values, ...]);
```

---

## 🎨 CSS Updates

**Bảng trái sẽ rộng hơn:**

```css
.left-panel {
  width: 80%; /* Thay vì 300px */
  overflow-x: auto;
}

.right-panel {
  width: 20%;
}
```

---

## ✅ Checklist

- [ ] Thêm state `allQData`
- [ ] Update `loadData` - load 10Q
- [ ] Update UI header - 10 cột Q
- [ ] Update UI body - 10 input T1, T2
- [ ] Update `handleGenerate` - save 10Q
- [ ] Thêm dropdown chọn Q (bảng phải)
- [ ] Update CSS - width
- [ ] Test: Nhập, lưu, load, xóa

---

Bạn muốn tôi implement từng bước không? Hoặc tạo file App.jsx hoàn chỉnh? 🚀
