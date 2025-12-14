# Fix: Bảng T hiển thị đủ 300 rows

## Vấn đề

- Bảng bên trái (input T1, T2): 300 rows ✅
- Bảng bên phải (T1-T60): chỉ 8 rows ❌

## Nguyên nhân

Hàm `generateTableData()` vẫn hardcode `const ROWS = 8` thay vì dùng `ROWS = 300` từ component.

## Giải pháp

Xóa `const ROWS = 8` trong `generateTableData()` để function dùng `ROWS` từ component scope (300).

## Kết quả

- Tất cả 60 bảng T giờ hiển thị đủ 300 rows ✅
- Mỗi bảng có 300 rows × 10 columns = 3,000 cells
- Màu sắc (đỏ, tím) áp dụng cho tất cả 300 rows

## Test

1. Refresh trang: http://localhost:5173/q1
2. Nhập T1, T2 (vài giá trị)
3. Nhấn "Tính"
4. Scroll xuống các bảng T1, T2, T3, ...
5. Verify mỗi bảng có 300 rows (không phải 8)

## Files thay đổi

- `src/App.jsx`: Xóa hardcode `ROWS = 8` trong `generateTableData()`
