# ✅ Fix Sticky Header cho bảng T

## Vấn đề

**Trước:**

- Header bảng T scroll theo nội dung ❌
- Khi scroll xuống, không biết đang xem cột nào
- Header bị trong suốt, nhìn xuyên qua

## Giải pháp

**Sau:**

- Header **sticky** (dính ở trên) khi scroll ✅
- Luôn thấy tên cột (0-9, T1, etc.)
- Background không trong suốt
- 2 rows header đều sticky

## Implementation

### CSS Changes:

#### 1. Sticky cho thead:

```css
.data-grid thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #ffffff; /* Không trong suốt */
}

.data-grid thead tr {
  background: #ffffff;
}
```

#### 2. Sticky cho group-header (row 1):

```css
.group-header {
  background: #f5f5f5 !important;
  position: sticky;
  top: 0;
  z-index: 11; /* Cao hơn col-header */
}
```

#### 3. Sticky cho col-header (row 2):

```css
.col-header {
  background: #fafafa !important;
  position: sticky;
  top: 41px; /* Offset để nằm dưới group-header */
  z-index: 9;
}
```

## Z-index Layers:

```
z-index: 11 → group-header (row 1: "Thông số", "Tham số")
z-index: 10 → thead
z-index: 9  → col-header (row 2: T1, 0-9)
z-index: 1  → data cells
```

## Top Offset:

- **group-header:** `top: 0` (dính ngay trên cùng)
- **col-header:** `top: 41px` (dính dưới group-header)
  - 41px = padding + border của group-header

## Visual Result:

**Khi scroll trong bảng:**

```
┌─────────────────────────────────┐
│ Thông số │    Tham số           │ ← Sticky (top: 0)
├──────────┼──────────────────────┤
│   T1     │ 0 │ 1 │ 2 │ ... │ 9 │ ← Sticky (top: 41px)
├──────────┼──────────────────────┤
│   data   │ scrolling content... │
│   data   │ scrolling content... │
│   ...    │ ...                  │
└─────────────────────────────────┘
```

## Files thay đổi

**src/App.css:**

1. `.data-grid thead`: Thêm background
2. `.data-grid thead tr`: Thêm background
3. `.group-header`: Thêm sticky position
4. `.col-header`: Thêm sticky position với offset
5. Thêm `!important` cho background colors

## Test

### Test 1: Scroll trong bảng

1. Refresh trang
2. Nhập T1, T2, nhấn "Tính"
3. Scroll xuống trong 1 bảng T
4. **Verify:**
   - Header "Thông số", "Tham số" dính ở trên ✅
   - Header "T1", "0-9" dính ngay dưới ✅
   - Background không trong suốt ✅
   - Không bị lệch ✅

### Test 2: Multiple tables

1. Scroll qua nhiều bảng T1, T2, T3...
2. **Verify:**
   - Mỗi bảng có sticky header riêng ✅
   - Header không overlap với bảng khác ✅

### Test 3: Responsive

1. Resize browser window
2. **Verify:**
   - Sticky header vẫn hoạt động ✅
   - Không bị lỗi layout ✅

## Benefits

1. **UX:** Luôn thấy tên cột khi scroll
2. **Navigation:** Dễ định hướng trong bảng lớn
3. **Professional:** Trông chuyên nghiệp hơn
4. **Consistent:** Giống Excel/Google Sheets

## Notes

- `!important` cần thiết để override inline styles
- `top: 41px` có thể cần điều chỉnh nếu thay đổi padding
- Z-index phải đúng thứ tự để không bị overlap
- Background phải có để không bị trong suốt
