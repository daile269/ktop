# Thêm Scroll cho InputPage

## Sửa dòng 186 trong `src/InputPage.jsx`

**Tìm:**

```javascript
<div style={{ overflowX: "auto" }}>
```

**Thay bằng:**

```javascript
<div style={{
  overflowX: "auto",
  overflowY: "auto",
  maxHeight: "calc(100vh - 250px)",
  border: "1px solid #ddd"
}}>
```

---

## Kết quả:

- ✅ Scroll ngang (cho 20 cột Q)
- ✅ Scroll dọc (cho 366 dòng)
- ✅ Chiều cao tự động theo màn hình
- ✅ Border để dễ nhìn

---

Xong! Bảng sẽ có scroll cả 2 chiều! 🎉
