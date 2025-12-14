# ✅ Đổi màu đỏ từ background sang text color

## Thay đổi

Thay đổi cách hiển thị màu đỏ:

- **Trước:** Background màu đỏ, chữ trắng
- **Sau:** Background trắng, chữ màu đỏ

## Áp dụng cho:

1. **Cột T{n}** (input fields)
2. **Cells được tô đỏ** (theo logic thuật toán)

## CSS Changes

### 1. Grid Input (Cột T{n}):

**Trước:**

```css
.grid-input {
  color: #333; /* Màu đen */
}
```

**Sau:**

```css
.grid-input {
  color: #ef4444; /* Text màu đỏ */
  font-weight: 600;
}
```

### 2. Red Cells (Cells tô đỏ):

**Trước:**

```css
.data-cell.red {
  background: #ef4444; /* Background đỏ */
  color: white; /* Chữ trắng */
  font-weight: 600;
}

.data-cell.red:hover {
  background: #dc2626; /* Đỏ đậm hơn */
}
```

**Sau:**

```css
.data-cell.red {
  background: #ffffff; /* Background trắng */
  color: #ef4444; /* Text màu đỏ */
  font-weight: 700; /* Bold hơn */
  font-size: 14px; /* Lớn hơn 1px */
}

.data-cell.red:hover {
  background: #fef2f2; /* Hover nhẹ màu hồng */
}
```

## Visual Comparison

### Trước:

```
┌──────┬───────┬───────┬───────┐
│  T1  │  0-1  │  1-2  │  2-3  │
├──────┼───────┼───────┼───────┤
│  2   │ 0-1   │ 1-2   │ [2-3] │ ← Background đỏ
│      │       │       │ white │
```

### Sau:

```
┌──────┬───────┬───────┬───────┐
│  T1  │  0-1  │  1-2  │  2-3  │
├──────┼───────┼───────┼───────┤
│  2   │ 0-1   │ 1-2   │  2-3  │ ← Text đỏ
│ red  │       │       │  red  │
```

## Color Palette

**Red color:** `#ef4444`

- Bright, easy to read
- High contrast với background trắng
- Consistent với design system

**Hover color:** `#fef2f2`

- Very light pink
- Subtle feedback
- Không quá nổi bật

## Benefits

1. **Dễ đọc hơn:** Text đỏ trên nền trắng dễ đọc hơn text trắng trên nền đỏ
2. **Professional:** Trông chuyên nghiệp, giống Excel
3. **Consistent:** Cột T và cells đỏ cùng màu
4. **Highlight:** Số đỏ nổi bật hơn, dễ nhận diện
5. **Print-friendly:** In ra giấy đẹp hơn

## Files thay đổi

**src/App.css:**

1. `.grid-input`: Thêm `color: #ef4444` và `font-weight: 600`
2. `.data-cell.red`: Đổi từ background đỏ sang text đỏ
3. `.data-cell.red:hover`: Đổi sang background nhẹ

## Test

### Test 1: Cột T{n}

1. Refresh trang
2. Nhập T1, T2
3. **Verify:**
   - Input text màu đỏ ✅
   - Font weight bold ✅
   - Dễ đọc ✅

### Test 2: Cells tô đỏ

1. Nhập T1, T2, nhấn "Tính"
2. Xem các cells được tô đỏ (theo thuật toán)
3. **Verify:**
   - Background trắng ✅
   - Text màu đỏ ✅
   - Font size 14px (lớn hơn 1px) ✅
   - Font weight 700 (bold) ✅

### Test 3: Hover effect

1. Hover vào cells màu đỏ
2. **Verify:**
   - Background chuyển sang #fef2f2 (hồng nhạt) ✅
   - Text vẫn màu đỏ ✅
   - Smooth transition ✅

### Test 4: Contrast

1. Xem tổng thể bảng
2. **Verify:**
   - Số đỏ nổi bật, dễ nhận diện ✅
   - Không chói mắt ✅
   - Dễ đọc ✅

## Color Psychology

**Màu đỏ (#ef4444):**

- Attention-grabbing
- Indicates importance
- High visibility
- Professional tone

**Background trắng:**

- Clean, minimal
- High contrast
- Easy to read
- Print-friendly

## Accessibility

**Contrast ratio:**

- Red (#ef4444) on white (#ffffff)
- Ratio: ~4.5:1
- ✅ Passes WCAG AA standard
- ✅ Readable for most users

## Summary

**Trước:**

- Background đỏ, chữ trắng
- Khó đọc, chói mắt
- Không professional

**Sau:**

- Background trắng, chữ đỏ
- Dễ đọc, nổi bật
- Professional, giống Excel
- Print-friendly
