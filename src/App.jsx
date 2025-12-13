import { useState } from 'react';
import './App.css';

function App() {
  const [t1, setT1] = useState('');
  const [t2, setT2] = useState('');
  const [t3, setT3] = useState('');
  
  const TOTAL_TABLES = 60;
  const ROWS = 8;
  
  // State cho tất cả 60 bảng
  const [allTableData, setAllTableData] = useState(Array(TOTAL_TABLES).fill(null).map(() => []));
  const [allTValues, setAllTValues] = useState(Array(TOTAL_TABLES).fill(null).map(() => Array(ROWS).fill('')));

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
    console.log('=== GENERATING 60 TABLES ===');
    
    const newAllTValues = [...allTValues];
    const newAllTableData = [];
    
    // Tính toán giá trị T cho tất cả các bảng
    for (let tableIndex = 0; tableIndex < TOTAL_TABLES; tableIndex++) {
      if (tableIndex === 0) {
        // T1: Giữ nguyên giá trị nhập
        // newAllTValues[0] đã được set qua handleTValueChange
      } else if (tableIndex === 1) {
        // T2: Giữ nguyên giá trị nhập
        // newAllTValues[1] đã được set qua handleTValueChange
      } else {
        // T3 trở đi: Tính tổng T(n-2) + T(n-1), lấy chữ số cuối
        const prevPrevValues = newAllTValues[tableIndex - 2];
        const prevValues = newAllTValues[tableIndex - 1];
        
        newAllTValues[tableIndex] = prevPrevValues.map((val, rowIdx) => {
          const num1 = parseInt(val) || 0;
          const num2 = parseInt(prevValues[rowIdx]) || 0;
          const sum = num1 + num2;
          return String(sum % 10); // Lấy chữ số cuối
        });
        
        console.log(`T${tableIndex + 1} = T${tableIndex - 1} + T${tableIndex}:`, newAllTValues[tableIndex]);
      }
      
      // Gen bảng dữ liệu cho table này
      const tableData = generateTableData(newAllTValues[tableIndex], `T${tableIndex + 1}`);
      newAllTableData.push(tableData);
    }
    
    setAllTValues(newAllTValues);
    setAllTableData(newAllTableData);
    
    console.log('Hoàn tất gen 60 bảng!');
  };

  const handleGenerate = () => {
    generateTable();
  };

  const handleTValueChange = (tableIndex, rowIndex, value) => {
    const newAllTValues = [...allTValues];
    newAllTValues[tableIndex][rowIndex] = value;
    setAllTValues(newAllTValues);
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
                      value={allTValues[0][rowIndex] || ''}
                      onChange={(e) => handleTValueChange(0, rowIndex, e.target.value)}
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      className="cell-input small" 
                      value={allTValues[1][rowIndex] || ''}
                      onChange={(e) => handleTValueChange(1, rowIndex, e.target.value)}
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
          <button className="toolbar-btn" onClick={handleGenerate}>Tính</button>
        </div>
        
        <div className="tables-container">
          {allTableData.map((tableData, tableIndex) => (
            <div key={tableIndex} className="table-section">
              <h4 className="table-title">T{tableIndex + 1}</h4>
              <div className="data-grid-wrapper">
                {tableData.length > 0 ? (
                  <table className="data-grid">
                    <thead>
                      <tr>
                        <th colSpan="1" className="group-header">Thông số</th>
                        <th colSpan="10" className="group-header">Tham số</th>
                      </tr>
                      <tr>
                        <th className="col-header fixed">T{tableIndex + 1}</th>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                          <th key={num} className="col-header">{num}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <td className="data-cell fixed value-col">
                            <input
                              type="text"
                              className="grid-input"
                              value={allTValues[tableIndex][rowIndex]}
                              onChange={(e) => handleTValueChange(tableIndex, rowIndex, e.target.value)}
                              disabled={tableIndex >= 2}
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
                    Nhập giá trị T{tableIndex + 1} và nhấn "Tính"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
