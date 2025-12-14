# ✅ Thêm Scroll cho từng bảng T

## Thay đổi

Thêm `max-height: 600px` cho `.data-grid-wrapper` để mỗi bảng T có scroll riêng.

## Trước:

- Các bảng T hiển thị toàn bộ 300 rows
- Phải scroll cả trang để xem
- Khó so sánh giữa các bảng

## Sau:

- Mỗi bảng T có chiều cao tối đa 600px
- Mỗi bảng có scrollbar riêng
- Dễ xem và so sánh giữa các bảng
- Có thể scroll 2 bảng độc lập

## UI/UX

- **Scrollbar đẹp**: 8px width, màu #c0c0c0
- **Sticky header**: Header bảng cố định khi scroll
- **Smooth scroll**: Mượt mà, không giật lag
- **2 bảng/hàng**: Grid layout 2 cột

## Files thay đổi

- `src/App.css`: Thêm `max-height: 600px` cho `.data-grid-wrapper`

## Test

1. Refresh trang
2. Nhập T1, T2, nhấn "Tính"
3. Scroll xuống xem các bảng T
4. Mỗi bảng có scroll riêng (chiều cao ~600px)
5. Header bảng cố định khi scroll trong bảng
