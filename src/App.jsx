import { useState } from 'react';
import './App.css';

function App() {
  const [t1, setT1] = useState('');
  const [t2, setT2] = useState('');
  const [t3, setT3] = useState('');
  
  const [tableData, setTableData] = useState([]);
  const [t1Values, setT1Values] = useState(Array(8).fill('')); // 8 giá trị cho 8 hàng

  // Thuật toán sinh bảng
  const generateTable = () => {
    const ROWS = 8;
    const COLS = 10;
    const table = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    
    console.log('=== GENERATE TABLE ===');
    console.log('Giá trị T1 (mỗi hàng):', t1Values);
    
    // Duyệt qua từng cột (trái sang phải)
    for (let col = 0; col < COLS; col++) {
      let y = 1; // Reset y về 1 khi bắt đầu cột mới
      console.log(`\n--- Cột ${col}: Bắt đầu với y = 1 ---`);
      
      // Duyệt qua từng hàng trong cột (trên xuống dưới)
      for (let row = 0; row < ROWS; row++) {
        let currentY = y;
        
        // Lấy giá trị T1 của hàng này (chỉ định cột nào là "cột đặc biệt" cho hàng này)
        const t1ColumnForThisRow = t1Values[row] ? parseInt(t1Values[row]) : -1;
        
        // Xác định màu
        let color = 'white';
        let shouldResetY = false; // Flag để reset y sau khi tô đỏ
        
        // Logic tô đỏ: Nếu cột hiện tại = T1 của hàng này
        // Thì tô đỏ ô này (bất kể giá trị y)
        if (col === t1ColumnForThisRow && t1ColumnForThisRow !== -1) {
          color = 'red';
          shouldResetY = true; // Đánh dấu cần reset y
          console.log(`Tô ĐỎ: Hàng ${row}, Cột ${col}, Giá trị: ${col}-${currentY}, T1[${row}]=${t1ColumnForThisRow} → Reset y về 1`);
        }
        
        // Kiểm tra điều kiện tô màu tím (giá trị = 7 hoặc 8)
        if (color === 'white' && (currentY === 7 || currentY === 8)) {
          color = 'purple';
        }
        
        table[row][col] = {
          value: `${col}-${currentY}`,
          color: color
        };
        
        // Tăng y cho ô tiếp theo
        y++;
        
        // Nếu vừa tô đỏ, reset y về 1
        if (shouldResetY) {
          y = 1;
          console.log(`  → Y đã reset về 1`);
        }
        
        // Nếu y > 8 thì reset về 1
        if (y > 8) {
          y = 1;
          console.log(`  → Y vượt 8, reset về 1`);
        }
      }
    }
    
    console.log('Bảng đã gen:', table);
    setTableData(table);
  };

  const handleGenerate = () => {
    generateTable();
  };

  const handleT1ValueChange = (rowIndex, value) => {
    const newValues = [...t1Values];
    newValues[rowIndex] = value;
    setT1Values(newValues);
  };

  return (
    <div className="app-container">
      {/* Left Panel - Lịch trình và Chi tiết Toa */}
      <div className="left-panel">
        <div className="panel-header">
          <h3>Lịch trình và Chi tiết Toa</h3>
        </div>
        
        <div className="panel-toolbar">
          <button className="toolbar-button primary">Thêm toa</button>
          <button className="toolbar-button">BM</button>
          <button className="toolbar-button icon-btn">⚙</button>
        </div>
        
        <div className="drag-hint">
          Kéo tiêu đề cột vào đây để nhóm theo cột đó
        </div>
        
        <div className="schedule-table-wrapper">
          <table className="schedule-table">
            <thead>
              <tr>
                <th rowSpan="2" className="header-main">Ngày tháng năm</th>
                <th rowSpan="2" className="header-main">Ngày</th>
                <th colSpan="2" className="header-group">Toa 1</th>
                <th colSpan="2" className="header-group">Toa 2</th>
                <th colSpan="2" className="header-group">Toa 3</th>
              </tr>
              <tr>
                <th className="header-sub">T1</th>
                <th className="header-sub">T2</th>
                <th className="header-sub">T1</th>
                <th className="header-sub">T2</th>
                <th className="header-sub">T1</th>
                <th className="header-sub">T2</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((rowIndex) => (
                <tr key={rowIndex}>
                  <td><input type="text" className="cell-input" /></td>
                  <td><input type="text" className="cell-input" /></td>
                  <td>
                    <input 
                      type="text" 
                      className="cell-input small" 
                      value={t1Values[rowIndex] || ''}
                      onChange={(e) => handleT1ValueChange(rowIndex, e.target.value)}
                    />
                  </td>
                  <td><input type="text" className="cell-input small" /></td>
                  <td><input type="text" className="cell-input small" /></td>
                  <td><input type="text" className="cell-input small" /></td>
                  <td><input type="text" className="cell-input small" /></td>
                  <td><input type="text" className="cell-input small" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="panel-actions">
          <button className="action-button" onClick={handleGenerate}>Tính</button>
        </div>
      </div>

      {/* Right Panel - Bảng dữ liệu chính */}
      <div className="right-panel">
        <div className="data-grid-wrapper">
          {tableData.length > 0 ? (
            <table className="data-grid">
              <thead>
                <tr>
                  <th colSpan="2" className="group-header">Thông số</th>
                  <th colSpan="10" className="group-header">Tham số</th>
                </tr>
                <tr>
                  <th className="col-header fixed">Tên</th>
                  <th className="col-header fixed">Giá trị</th>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <th key={num} className="col-header">{num}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="data-cell fixed"></td>
                    <td className="data-cell fixed value-col">
                      <input
                        type="text"
                        className="grid-input"
                        value={t1Values[rowIndex]}
                        onChange={(e) => handleT1ValueChange(rowIndex, e.target.value)}
                      />
                    </td>
                    {row.map((cell, colIndex) => (
                      <td
                        key={colIndex}
                        className={`data-cell ${cell.color}`}
                      >
                        {cell.value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-grid">
              <table className="data-grid">
                <thead>
                  <tr>
                    <th colSpan="2" className="group-header">Thông số</th>
                    <th colSpan="10" className="group-header">Tham số</th>
                  </tr>
                  <tr>
                    <th className="col-header fixed">Tên</th>
                    <th className="col-header fixed">Giá trị</th>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <th key={num} className="col-header">{num}</th>
                    ))}
                  </tr>
                </thead>
              </table>
              <div className="empty-message">
                Nhập giá trị T1 và nhấn "Tính" để hiển thị dữ liệu
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
