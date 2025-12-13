import { useState } from 'react';
import './App.css';

function App() {
  const [t1, setT1] = useState('');
  const [t2, setT2] = useState('');
  const [t3, setT3] = useState('');
  
  const [tableData1, setTableData1] = useState([]); // Bảng Toa 1
  const [tableData2, setTableData2] = useState([]); // Bảng Toa 2
  const [t1Values, setT1Values] = useState(Array(8).fill('')); // Giá trị T1 cho Toa 1
  const [t2Values, setT2Values] = useState(Array(8).fill('')); // Giá trị T2 cho Toa 2

  // Thuật toán sinh bảng (dùng chung cho cả 2 toa)
  const generateTableData = (tValues, toaName) => {
    const ROWS = 8;
    const COLS = 10;
    const table = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    
    console.log(`\n=== GENERATE ${toaName} ===`);
    console.log(`Giá trị ${toaName}:`, tValues);
    
    // Duyệt qua từng cột (trái sang phải)
    for (let col = 0; col < COLS; col++) {
      let y = 1; // Reset y về 1 khi bắt đầu cột mới
      
      // Duyệt qua từng hàng trong cột (trên xuống dưới)
      for (let row = 0; row < ROWS; row++) {
        let currentY = y;
        
        // Lấy giá trị T của hàng này
        const tColumnForThisRow = tValues[row] ? parseInt(tValues[row]) : -1;
        
        // Xác định màu
        let color = 'white';
        let shouldResetY = false;
        
        // Logic tô đỏ: Nếu cột hiện tại = T của hàng này
        if (col === tColumnForThisRow && tColumnForThisRow !== -1) {
          color = 'red';
          shouldResetY = true;
          console.log(`Tô ĐỎ ${toaName}: Hàng ${row}, Cột ${col}, Giá trị: ${col}-${currentY}`);
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
        }
        
        // Nếu y > 8 thì reset về 1
        if (y > 8) {
          y = 1;
        }
      }
    }
    
    return table;
  };

  const generateTable = () => {
    // Gen bảng cho Toa 1
    const table1 = generateTableData(t1Values, 'TOA 1');
    setTableData1(table1);
    
    // Gen bảng cho Toa 2
    const table2 = generateTableData(t2Values, 'TOA 2');
    setTableData2(table2);
    
    console.log('Hoàn tất gen 2 bảng!');
  };

  const handleGenerate = () => {
    generateTable();
  };

  const handleT1ValueChange = (rowIndex, value) => {
    const newValues = [...t1Values];
    newValues[rowIndex] = value;
    setT1Values(newValues);
  };

  const handleT2ValueChange = (rowIndex, value) => {
    const newValues = [...t2Values];
    newValues[rowIndex] = value;
    setT2Values(newValues);
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
                {/* <th colSpan="2" className="header-group">Toa 2</th>
                <th colSpan="2" className="header-group">Toa 3</th> */}
              </tr>
              <tr>
                <th className="header-sub">T1</th>
                <th className="header-sub">T2</th>
                {/* <th className="header-sub">T1</th>
                <th className="header-sub">T2</th>
                <th className="header-sub">T1</th>
                <th className="header-sub">T2</th> */}
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
                  <td>
                    <input 
                      type="text" 
                      className="cell-input small" 
                      value={t2Values[rowIndex] || ''}
                      onChange={(e) => handleT2ValueChange(rowIndex, e.target.value)}
                    />
                  </td>
                  {/* <td><input type="text" className="cell-input small" /></td>
                  <td><input type="text" className="cell-input small" /></td>
                  <td><input type="text" className="cell-input small" /></td>
                  <td><input type="text" className="cell-input small" /></td> */}
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
        <div className="toolbar">
          <button className="toolbar-btn">Tính</button>
        </div>
        
        <div className="tables-container">
          {/* Bảng T1 */}
          <div className="table-section">
            <h4 className="table-title">T1</h4>
            <div className="data-grid-wrapper">
              {tableData1.length > 0 ? (
                <table className="data-grid">
                  <thead>
                    <tr>
                      <th colSpan="1" className="group-header">Thông số</th>
                      <th colSpan="10" className="group-header">Tham số</th>
                    </tr>
                    <tr>
                      {/* <th className="col-header fixed">Tên</th> */}
                      <th className="col-header fixed">T1</th>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <th key={num} className="col-header">{num}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData1.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {/* <td className="data-cell fixed"></td> */}
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
                <div className="empty-message">
                  Nhập giá trị T1 và nhấn "Tính"
                </div>
              )}
            </div>
          </div>

          {/* Bảng T2 */}
          <div className="table-section">
            <h4 className="table-title">T2</h4>
            <div className="data-grid-wrapper">
              {tableData2.length > 0 ? (
                <table className="data-grid">
                  <thead>
                    <tr>
                      <th colSpan="1" className="group-header">Thông số</th>
                      <th colSpan="10" className="group-header">Tham số</th>
                    </tr>
                    <tr>
                      {/* <th className="col-header fixed">Tên</th> */}
                      <th className="col-header fixed">T2</th>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <th key={num} className="col-header">{num}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData2.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {/* <td className="data-cell fixed"></td> */}
                        <td className="data-cell fixed value-col">
                          <input
                            type="text"
                            className="grid-input"
                            value={t2Values[rowIndex]}
                            onChange={(e) => handleT2ValueChange(rowIndex, e.target.value)}
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
                <div className="empty-message">
                  Nhập giá trị T2 và nhấn "Tính"
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
