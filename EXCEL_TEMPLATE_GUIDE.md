# Hướng dẫn tạo Excel Template với Logic tương tự App

## 📋 Tổng quan

File Excel sẽ có:

- **1 Sheet Input:** Nhập T1, T2, Ngày (300 dòng)
- **60 Sheets (T1-T60):** Tự động tính toán và tô màu

---

## 🏗️ Cấu trúc

### Sheet "Input" (Nhập liệu)

| STT | Ngày       | T1  | T2  |
| --- | ---------- | --- | --- |
| 00  | 15/12/2025 | 3   | 5   |
| 01  | 16/12/2025 | 1   | 7   |
| ... | ...        | ..  | ..  |
| 300 | ...        | ..  | ..  |

**Columns:**

- A: STT (00-300)
- B: Ngày
- C: T1
- D: T2

---

### Sheets T1-T60 (Output)

Mỗi sheet có cấu trúc:

| STT | Ngày       | T   | 0   | 1   | 2   | ... | 9   |
| --- | ---------- | --- | --- | --- | --- | --- | --- |
| 00  | 15/12/2025 | 3   | 0-1 | 1-2 | 2-3 | ... | 9-1 |
| 01  | 16/12/2025 | 1   | 0-1 | 1-2 | 2-3 | ... | 9-1 |

---

## 📐 Công thức Excel

### 1. Sheet T1, T2 (Copy từ Input)

```excel
Sheet T1:
- Cell A2: =Input!A2  (STT)
- Cell B2: =Input!B2  (Ngày)
- Cell C2: =Input!C2  (T1)

Sheet T2:
- Cell C2: =Input!D2  (T2)
```

### 2. Sheet T3-T60 (Tính tổng)

```excel
Sheet T3:
- Cell C2: =MOD(T1!C2 + T2!C2, 10)

Sheet T4:
- Cell C2: =MOD(T2!C2 + T3!C2, 10)

...

Sheet Tn:
- Cell C2: =MOD(T(n-2)!C2 + T(n-1)!C2, 10)
```

### 3. Grid Values (Cột 0-9)

**Logic:**

- Bắt đầu Y = 1
- Mỗi ô: `Cột-Y`
- Nếu Cột = T → Tô đỏ, Reset Y = 1
- Nếu Y = 7 hoặc 8 → Tô tím
- Y++, nếu Y > 8 → Y = 1

**Công thức (phức tạp, cần VBA):**

```vba
' VBA Function để tính Y value
Function CalculateY(row As Integer, col As Integer, tValue As Integer) As Integer
    Dim y As Integer
    Dim currentRow As Integer

    y = 1
    For currentRow = 2 To row
        Dim currentT As Integer
        currentT = Cells(currentRow, 3).Value ' Column C = T

        For c = 0 To col
            If c = currentT Then
                y = 1 ' Reset
            Else
                y = y + 1
                If y > 8 Then y = 1
            End If
        Next c
    Next currentRow

    CalculateY = y
End Function
```

**Hoặc dùng công thức Excel (đơn giản hơn nhưng không chính xác 100%):**

```excel
Cell D2 (Cột 0):
=IF(C2=0, "0-1", "0-1")

Cell E2 (Cột 1):
=IF(C2=1, "1-1", "1-" & MOD(OFFSET($D2,0,COLUMN()-4)+1,8)+1)
```

---

## 🎨 Tô màu (Conditional Formatting)

### Màu Đỏ (Cột = T)

**Áp dụng cho:** D2:M301 (Cột 0-9)

**Công thức:**

```excel
=COLUMN()-4 = $C2
```

**Format:** Background Red (#ff0000)

### Màu Tím (Y = 7 hoặc 8)

**Công thức (cần tính Y):**

```excel
=OR(RIGHT(D2,1)="7", RIGHT(D2,1)="8")
```

**Format:** Background Purple (#800080)

---

## 🚀 Cách tạo nhanh

### Bước 1: Tạo Sheet Input

1. Tạo sheet "Input"
2. Header: STT | Ngày | T1 | T2
3. STT: 00-300 (dùng công thức `=TEXT(ROW()-2,"00")`)
4. Nhập ngày, T1, T2

### Bước 2: Tạo Sheet T1

1. Copy structure từ Input
2. Thêm cột 0-9
3. Link data: `=Input!C2`

### Bước 3: Tạo Sheet T2

1. Copy từ T1
2. Sửa link: `=Input!D2`

### Bước 4: Tạo Sheet T3-T60

1. Copy từ T2
2. Sửa công thức T: `=MOD(T1!C2 + T2!C2, 10)`
3. Cho T4: `=MOD(T2!C2 + T3!C2, 10)`
4. ...

### Bước 5: Thêm Grid Logic (VBA)

**Vì logic grid phức tạp, khuyến nghị:**

- Dùng VBA macro
- Hoặc export từ app này sang Excel

---

## 💡 Lưu ý

**Hạn chế của Excel:**

- ❌ Logic Y phức tạp, khó dùng công thức thuần
- ❌ Cần VBA để tính chính xác
- ❌ Performance kém với 60 sheets x 300 rows

**Khuyến nghị:**

- ✅ Dùng app web này (nhanh, chính xác)
- ✅ Export kết quả từ app sang Excel
- ✅ Hoặc dùng Google Sheets + Apps Script

---

## 📥 Export từ App

**Nếu muốn export từ app này sang Excel:**

1. Thêm nút "Export to Excel"
2. Dùng thư viện `xlsx`
3. Export 60 sheets với data + màu

**Code mẫu:**

```javascript
import * as XLSX from "xlsx";

const exportToExcel = () => {
  const wb = XLSX.utils.book_new();

  // Export mỗi bảng
  allTableData.forEach((tableData, index) => {
    const ws = XLSX.utils.aoa_to_sheet(tableData);
    XLSX.utils.book_append_sheet(wb, ws, `T${index + 1}`);
  });

  XLSX.writeFile(wb, `Q${pageId}_${new Date().toISOString()}.xlsx`);
};
```

---

## ❓ Câu hỏi?

Bạn muốn:

1. **Template Excel thủ công** (phức tạp, cần VBA)?
2. **Export từ app** (đơn giản, chính xác)?
3. **Google Sheets + Apps Script** (online, dễ share)?

Cho tôi biết để tôi hỗ trợ thêm!
