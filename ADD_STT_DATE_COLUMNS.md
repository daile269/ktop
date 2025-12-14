# ✅ Thêm cột STT và Ngày cho các bảng T

## Thay đổi

Thêm cột **STT** và **Ngày** vào các bảng T1-T60 để đồng nhất với bảng input bên trái, giúp dễ theo dõi và so sánh dữ liệu.

## Trước:

**Bảng T (bên phải):**

```
┌──────┬───┬───┬───┬───┐
│  T1  │ 0 │ 1 │ 2 │...│
├──────┼───┼───┼───┼───┤
│ input│ data...        │
```

**Bảng input (bên trái):**

```
┌─────┬──────────┬────┬────┐
│ STT │   Ngày   │ T1 │ T2 │
├─────┼──────────┼────┼────┤
│  1  │15/12/2025│ 1  │ 2  │
```

❌ Không đồng nhất, khó so sánh

## Sau:

**Bảng T (bên phải):**

```
┌─────┬──────────┬──────┬───┬───┬───┐
│ STT │   Ngày   │  T1  │ 0 │ 1 │ 2 │
├─────┼──────────┼──────┼───┼───┼───┤
│  1  │15/12/2025│input │ data...   │
│  2  │16/12/2025│input │ data...   │
```

✅ Đồng nhất, dễ theo dõi

## Implementation

### Header Changes:

#### Row 1 (Group header):

```javascript
<tr>
  <th colSpan="2" className="group-header">
    Thông tin
  </th>
  <th colSpan="1" className="group-header">
    Thông số
  </th>
  <th colSpan="10" className="group-header">
    Tham số
  </th>
</tr>
```

#### Row 2 (Column header):

```javascript
<tr>
  <th className="col-header fixed">STT</th>
  <th className="col-header fixed">Ngày</th>
  <th className="col-header fixed">T{tableIndex + 1}</th>
  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
    <th key={num} className="col-header">
      {num}
    </th>
  ))}
</tr>
```

### Body Changes:

```javascript
{tableData.map((row, rowIndex) => (
  <tr key={rowIndex}>
    <td className="data-cell fixed">{rowIndex + 1}</td>
    <td className="data-cell fixed date-col">{dateValues[rowIndex] || ''}</td>
    <td className="data-cell fixed value-col">
      <input ... />
    </td>
    {/* 10 cột data ... */}
  </tr>
))}
```

### CSS cho cột Ngày:

```css
.data-cell.date-col {
  min-width: 100px;
  max-width: 120px;
  text-align: left;
  padding-left: 12px;
  font-size: 12px;
}
```

## Cấu trúc bảng mới:

**13 cột tổng:**

1. **STT** (fixed) - Auto number: 1, 2, 3...
2. **Ngày** (fixed) - Từ dateValues
3. **T{n}** (fixed) - Input field
   4-13. **0-9** - Data cells với màu sắc

**2 rows header:**

1. Group header: "Thông tin" (2 cols) + "Thông số" (1 col) + "Tham số" (10 cols)
2. Column header: STT + Ngày + T{n} + 0-9

## Benefits

1. **Đồng nhất:** Bảng input và bảng T có cùng cấu trúc
2. **Dễ theo dõi:** Thấy ngay STT và ngày của mỗi row
3. **So sánh:** Dễ so sánh giữa bảng input và bảng T
4. **Professional:** Trông chuyên nghiệp hơn
5. **Context:** Luôn biết đang xem dữ liệu ngày nào

## Files thay đổi

**src/App.jsx:**

1. Update header row 1: Thêm "Thông tin" colspan 2
2. Update header row 2: Thêm STT và Ngày
3. Update tbody: Thêm 2 td cho STT và Ngày

**src/App.css:**

1. Thêm `.data-cell.date-col` styles

## Test

### Test 1: Visual check

1. Refresh trang
2. Nhập T1, T2, nhấn "Tính"
3. **Verify:**
   - Bảng T có cột STT (1, 2, 3...)
   - Bảng T có cột Ngày (hiển thị ngày đã nhập)
   - Cột T{n} vẫn có input
   - 10 cột data (0-9) vẫn đúng

### Test 2: Data consistency

1. Nhập ngày vào bảng input: "15/12/2025"
2. Nhập T1, T2
3. Nhấn "Tính"
4. **Verify:**
   - Cột Ngày trong bảng T hiển thị "15/12/2025"
   - STT match với row number
   - Data đồng nhất giữa input và bảng T

### Test 3: Sticky header

1. Scroll xuống trong bảng T
2. **Verify:**
   - Header STT, Ngày, T{n}, 0-9 dính ở trên
   - Vẫn thấy tên cột khi scroll

### Test 4: Multiple rows

1. Nhập 20 rows T1, T2 với ngày khác nhau
2. Nhấn "Tính"
3. **Verify:**
   - STT: 1-20
   - Ngày: Hiển thị đúng cho từng row
   - Data: Đúng cho từng row

## Layout

**Bảng T hoàn chỉnh:**

```
┌──────────────┬─────────────┬────────────────────────────────┐
│  Thông tin   │  Thông số   │         Tham số                │
├─────┬────────┼─────────────┼───┬───┬───┬───┬───┬───┬───┬───┤
│ STT │  Ngày  │     T1      │ 0 │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │
├─────┼────────┼─────────────┼───┼───┼───┼───┼───┼───┼───┼───┤
│  1  │15/12/25│   [input]   │0-1│1-2│2-3│...                │
│  2  │16/12/25│   [input]   │0-2│1-3│2-4│...                │
│  3  │17/12/25│   [input]   │0-3│1-4│2-5│...                │
└─────┴────────┴─────────────┴───┴───┴───┴───┴───┴───┴───┴───┘
```

## Summary

**Trước:**

- Bảng T: 11 cột (T{n} + 0-9)
- Không có STT, Ngày
- Khó so sánh với bảng input

**Sau:**

- Bảng T: 13 cột (STT + Ngày + T{n} + 0-9)
- Đồng nhất với bảng input
- Dễ theo dõi và so sánh
- Professional layout
