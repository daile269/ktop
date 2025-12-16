# ✅ Hoàn thành 2/3! Còn 1 bước cuối

## Đã làm:

✅ Tạo file `src/InputPage.jsx`
✅ Thêm import InputPage vào App.jsx
✅ Thêm routing check vào App.jsx

## Còn 1 việc: Thêm nút "Nhập 10Q"

### Tìm dòng 551 trong App.jsx:

```javascript
            </select>
          </div>
```

### Thay bằng:

```javascript
            </select>
            <a
              href="/input"
              style={{
                padding: "6px 12px",
                background: "#28a745",
                color: "white",
                textDecoration: "none",
                borderRadius: "4px",
                fontSize: "13px",
                fontWeight: "600"
              }}
            >
              ✏️ Nhập 10Q
            </a>
          </div>
```

---

## Hoặc test ngay không cần nút:

Vào trực tiếp: `http://localhost:5173/input`

---

## Kết quả:

- Trang Q1-Q10 có nút xanh "✏️ Nhập 10Q"
- Click vào → Chuyển sang trang input
- Nhập T1, T2 cho 10Q cùng lúc
- Click "Lưu dữ liệu" → Lưu vào 10Q

Xong! 🎉
