"""
Script để apply soft delete changes vào App.jsx
Chạy: python apply_soft_delete.py
"""

import re

# Đọc file
with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

print("Applying soft delete changes...")

# Change 1: Load deletedRows
print("1. Adding load deletedRows...")
content = content.replace(
    'setDateValues(result.data.dateValues || Array(ROWS).fill("")); // Load dateValues\n      setIsDataLoaded(true);',
    'setDateValues(result.data.dateValues || Array(ROWS).fill("")); // Load dateValues\n      setDeletedRows(result.data.deletedRows || Array(ROWS).fill(false)); // Load deletedRows\n      setIsDataLoaded(true);'
)

# Change 2: Reset deletedRows khi xóa tất cả
print("2. Adding reset deletedRows...")
content = content.replace(
    'setDateValues(Array(ROWS).fill(""));\n        setAllTableData(',
    'setDateValues(Array(ROWS).fill(""));\n        setDeletedRows(Array(ROWS).fill(false)); // Reset deletedRows\n        setAllTableData('
)

# Change 3: Update all savePageData calls to include deletedRows
print("3. Updating savePageData calls...")
# Pattern: savePageData(pageId, allTValues[0], allTValues[1], dateValues)
# Replace: savePageData(pageId, allTValues[0], allTValues[1], dateValues, deletedRows)
content = re.sub(
    r'savePageData\(\s*pageId,\s*allTValues\[0\],\s*allTValues\[1\],\s*dateValues\s*\)',
    'savePageData(pageId, allTValues[0], allTValues[1], dateValues, deletedRows)',
    content
)

# Change 4: Update render - bảng trái (skip deleted rows)
print("4. Updating left table render...")
content = content.replace(
    '{Array.from({ length: ROWS }, (_, rowIndex) => (',
    '{Array.from({ length: ROWS }, (_, rowIndex) => {\n                // Skip deleted rows\n                if (deletedRows[rowIndex]) return null;\n                \n                return ('
)

# Add closing for left table
content = content.replace(
    '</tr>\n              ))}\n            </tbody>',
    '</tr>\n                );\n              })}\n            </tbody>'
)

# Change 5: Update render - bảng phải (skip deleted rows)  
print("5. Updating right table render...")
# Tìm pattern: {tableData.map((row, rowIndex) => (
# Thay bằng: {tableData.map((row, rowIndex) => { if (deletedRows[rowIndex]) return null; return (
content = re.sub(
    r'\{tableData\.map\(\(row, rowIndex\) => \(',
    '{tableData.map((row, rowIndex) => {\n                        // Skip deleted rows\n                        if (deletedRows[rowIndex]) return null;\n                        \n                        return (',
    content
)

# Add closing for right table
content = re.sub(
    r'</tr>\n\s+\)\)}\n\s+</tbody>',
    '</tr>\n                        );\n                      })}\n                    </tbody>',
    content
)

# Lưu file
with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Done! Soft delete changes applied.")
print("\nNext: Update handleDelete function manually (see SOFT_DELETE_CHANGES.md)")
