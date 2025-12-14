# ✅ Tô màu vàng nhạt cho các ô bảng

## Thay đổi

Đổi background của các ô bảng từ trắng sang **màu vàng nhạt** để dễ nhìn và phân biệt hơn.

## CSS Change

**Trước:**

```css
.data-cell.white {
  background-color: #ffffff; /* Trắng */
  color: #333;
}
```

**Sau:**

```css
.data-cell.white {
  background-color: #fffbeb; /* Vàng nhạt */
  color: #333;
}
```

## Color Info

**Màu vàng nhạt:** `#fffbeb`

- Very light yellow/cream
- Soft, easy on the eyes
- Good contrast với text đen
- Professional, giống Excel/Google Sheets

## Visual

**Trước:**

```
┌───────┬───────┬───────┐
│  0-1  │  1-2  │  2-3  │ ← Background trắng
│ white │ white │ white │
```

**Sau:**

```
┌───────┬───────┬───────┐
│  0-1  │  1-2  │  2-3  │ ← Background vàng nhạt
│yellow │yellow │yellow │
```

## Benefits

1. **Dễ nhìn:** Vàng nhạt dễ chịu hơn trắng
2. **Phân biệt:** Dễ phân biệt cells với background
3. **Giảm mỏi mắt:** Không chói như trắng
4. **Professional:** Giống Excel
5. **Highlight:** Cells đỏ và tím nổi bật hơn

## Color Scheme

**Cells thường:** `#fffbeb` (vàng nhạt)
**Cells đỏ:** `#ef4444` (đỏ) - background đỏ, text trắng
**Cells tím:** `#f3e5f5` (tím nhạt) - background tím, text tím đậm

## Files thay đổi

**src/App.css:**

- `.data-cell.white`: Đổi background từ `#ffffff` → `#fffbeb`

## Test

1. Refresh trang
2. Nhập T1, T2, nhấn "Tính"
3. **Verify:**
   - Cells thường: Background vàng nhạt ✅
   - Cells đỏ: Vẫn đỏ ✅
   - Cells tím: Vẫn tím ✅
   - Dễ nhìn, không chói ✅
