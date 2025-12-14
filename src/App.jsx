import { useState, useEffect } from 'react';
import './App.css';
import { savePageData, loadPageData, deletePageData, migrateFromLocalStorage } from './dataService';

function App() {
  const [t1, setT1] = useState('');
  const [t2, setT2] = useState('');
  const [t3, setT3] = useState('');
  
  const TOTAL_TABLES = 60;
  const ROWS = 300; // Tăng từ 150 lên 300 dòng
  
  // Lấy pageId từ URL (vd: /q1 -> pageId = 'q1')
  const pageId = window.location.pathname.slice(1) || 'q1'; // Default là 'q1'
  
  // State cho tất cả 60 bảng
  const [allTableData, setAllTableData] = useState(Array(TOTAL_TABLES).fill(null).map(() => []));
  const [allTValues, setAllTValues] = useState(Array(TOTAL_TABLES).fill(null).map(() => Array(ROWS).fill('')));
  const [dateValues, setDateValues] = useState(Array(ROWS).fill('')); // Lưu ngày tháng cho mỗi row
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false); // Loading khi tính toán
  const [error, setError] = useState('');
  
  // State cho highlight cells và rows
  const [highlightedCells, setHighlightedCells] = useState({}); // {tableIndex: {rowIndex: {colIndex: true}}}
  const [highlightedRows, setHighlightedRows] = useState({}); // {tableIndex: {rowIndex: true}}

  // Load dữ liệu từ Firestore khi component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // Thử load từ Firestore trước
        const result = await loadPageData(pageId);
        
        if (result.success && result.data) {
          // Có dữ liệu từ Firestore
          const newAllTValues = [...allTValues];
          newAllTValues[0] = result.data.t1Values;
          newAllTValues[1] = result.data.t2Values;
          
          setAllTValues(newAllTValues);
          setDateValues(result.data.dateValues || Array(ROWS).fill('')); // Load dateValues
          setIsDataLoaded(true);
          
          // Tự động generate bảng
          setTimeout(() => {
            generateTableWithValues(newAllTValues);
          }, 100);
        } else if (!result.success) {
          // Lỗi khi load từ Firestore, thử localStorage
          console.warn('Không thể load từ Firestore, thử localStorage...');
          await tryLoadFromLocalStorage();
        } else {
          // Không có dữ liệu, thử migrate từ localStorage
          console.log('Không có dữ liệu trên Firestore, thử migrate từ localStorage...');
          const migrateResult = await migrateFromLocalStorage(pageId);
          if (migrateResult.success) {
            // Load lại sau khi migrate
            loadData();
          }
        }
      } catch (err) {
        console.error('Lỗi:', err);
        setError('Không thể kết nối Firebase. Dữ liệu chỉ lưu local.');
        await tryLoadFromLocalStorage();
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [pageId]);

  // Fallback: Load từ localStorage
  const tryLoadFromLocalStorage = async () => {
    const savedData = localStorage.getItem('tableData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.allTValues && parsed.allTValues.length === TOTAL_TABLES) {
          setAllTValues(parsed.allTValues);
          setIsDataLoaded(true);
          console.log('✅ Đã tải dữ liệu từ localStorage');
          
          setTimeout(() => {
            generateTableWithValues(parsed.allTValues);
          }, 100);
        }
      } catch (error) {
        console.error('Lỗi khi load từ localStorage:', error);
      }
    }
  };

  // Lưu dữ liệu (T1, T2, dateValues) lên Firestore mỗi khi thay đổi
  useEffect(() => {
    const saveData = async () => {
      if (isDataLoaded || allTValues[0].some(val => val !== '') || allTValues[1].some(val => val !== '')) {
        // Lưu vào localStorage (backup)
        const dataToSave = {
          allTValues: allTValues,
          dateValues: dateValues,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('tableData', JSON.stringify(dataToSave));
        
        // Lưu lên Firestore (T1, T2, dateValues)
        setSaveStatus('💾 Đang lưu...');
        const result = await savePageData(pageId, allTValues[0], allTValues[1], dateValues);
        
        if (result.success) {
          setSaveStatus('✅ Đã lưu lên cloud');
        } else {
          setSaveStatus('⚠️ Lưu local (lỗi Firebase)');
          setError(result.error);
        }
        
        setTimeout(() => setSaveStatus(''), 2000);
      }
    };
    
    // Debounce để không lưu quá nhiều lần
    const timeoutId = setTimeout(saveData, 500);
    return () => clearTimeout(timeoutId);
  }, [allTValues, dateValues, isDataLoaded, pageId]);

  // Thuật toán sinh bảng (dùng chung cho cả 2 toa)
  const generateTableData = (tValues, toaName) => {
    const COLS = 10;
    
    // Tính số rows thực tế dựa trên dữ liệu đã nhập
    let actualRows = 0;
    for (let i = tValues.length - 1; i >= 0; i--) {
      if (tValues[i] !== '' && tValues[i] !== null && tValues[i] !== undefined) {
        actualRows = i + 1;
        break;
      }
    }
    
    // Nếu không có dữ liệu, return empty
    if (actualRows === 0) {
      return [];
    }
    
    const table = Array(actualRows).fill(null).map(() => Array(COLS).fill(null));
    
    console.log(`\n=== GENERATE ${toaName} ===`);
    console.log(`Giá trị ${toaName}:`, tValues.slice(0, actualRows));
    console.log(`Số rows thực tế: ${actualRows}`);
    
    // Duyệt qua từng cột (trái sang phải)
    for (let col = 0; col < COLS; col++) {
      let y = 1; // Reset y về 1 khi bắt đầu cột mới
      
      // Duyệt qua từng hàng trong cột (trên xuống dưới)
      for (let row = 0; row < actualRows; row++) {
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

  // Generate bảng từ giá trị T đã có
  const generateTableWithValues = (tValuesArray) => {
    console.log('=== GENERATING 60 TABLES FROM SAVED DATA ===');
    
    // Tính actualRows từ T1 hoặc T2
    let actualRows = 0;
    for (let i = tValuesArray[0].length - 1; i >= 0; i--) {
      if ((tValuesArray[0][i] !== '' && tValuesArray[0][i] !== null && tValuesArray[0][i] !== undefined) ||
          (tValuesArray[1][i] !== '' && tValuesArray[1][i] !== null && tValuesArray[1][i] !== undefined)) {
        actualRows = i + 1;
        break;
      }
    }
    
    console.log(`Số rows thực tế từ T1, T2: ${actualRows}`);
    
    const newAllTValues = [...tValuesArray];
    const newAllTableData = [];
    
    // Tính toán giá trị T cho tất cả các bảng
    for (let tableIndex = 0; tableIndex < TOTAL_TABLES; tableIndex++) {
      if (tableIndex === 0) {
        // T1: Giữ nguyên giá trị nhập
      } else if (tableIndex === 1) {
        // T2: Giữ nguyên giá trị nhập
      } else {
        // T3 trở đi: Tính tổng T(n-2) + T(n-1), lấy chữ số cuối
        const prevPrevValues = newAllTValues[tableIndex - 2];
        const prevValues = newAllTValues[tableIndex - 1];
        
        // Chỉ tính đến actualRows, không phải toàn bộ array
        newAllTValues[tableIndex] = Array(ROWS).fill('');
        for (let rowIdx = 0; rowIdx < actualRows; rowIdx++) {
          const num1 = parseInt(prevPrevValues[rowIdx]) || 0;
          const num2 = parseInt(prevValues[rowIdx]) || 0;
          const sum = num1 + num2;
          newAllTValues[tableIndex][rowIdx] = String(sum % 10); // Lấy chữ số cuối
        }
        
        console.log(`T${tableIndex + 1} = T${tableIndex - 1} + T${tableIndex} (${actualRows} rows):`, newAllTValues[tableIndex].slice(0, actualRows));
      }
      
      // Gen bảng dữ liệu cho table này
      const tableData = generateTableData(newAllTValues[tableIndex], `T${tableIndex + 1}`);
      newAllTableData.push(tableData);
    }
    
    setAllTValues(newAllTValues);
    setAllTableData(newAllTableData);
    
    console.log('Hoàn tất gen 60 bảng!');
  };

  const generateTable = () => {
    generateTableWithValues(allTValues);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    
    // Dùng setTimeout để UI có thời gian hiển thị loading
    setTimeout(() => {
      generateTable();
      setIsGenerating(false);
    }, 100);
  };

  // Handle click vào cell - bôi xanh 1 ô
  const handleCellClick = (tableIndex, rowIndex, colIndex) => {
    setHighlightedCells(prev => {
      const newState = {...prev};
      if (!newState[tableIndex]) newState[tableIndex] = {};
      if (!newState[tableIndex][rowIndex]) newState[tableIndex][rowIndex] = {};
      
      // Toggle highlight
      if (newState[tableIndex][rowIndex][colIndex]) {
        delete newState[tableIndex][rowIndex][colIndex];
      } else {
        newState[tableIndex][rowIndex][colIndex] = true;
      }
      
      return newState;
    });
  };

  // Handle double click vào cell - bôi xanh cả hàng
  const handleCellDoubleClick = (tableIndex, rowIndex) => {
    setHighlightedRows(prev => {
      const newState = {...prev};
      if (!newState[tableIndex]) newState[tableIndex] = {};
      
      // Toggle highlight row
      if (newState[tableIndex][rowIndex]) {
        delete newState[tableIndex][rowIndex];
      } else {
        newState[tableIndex][rowIndex] = true;
      }
      
      return newState;
    });
  };

  const handleTValueChange = (tableIndex, rowIndex, value) => {
    const newAllTValues = [...allTValues];
    newAllTValues[tableIndex][rowIndex] = value;
    setAllTValues(newAllTValues);
  };

  const clearData = async () => {
    if (confirm('Bạn có chắc muốn xóa tất cả dữ liệu đã lưu?')) {
      // Xóa từ Firestore
      const result = await deletePageData(pageId);
      
      // Xóa từ localStorage
      localStorage.removeItem('tableData');
      
      // Reset state
      setAllTValues(Array(TOTAL_TABLES).fill(null).map(() => Array(ROWS).fill('')));
      setAllTableData(Array(TOTAL_TABLES).fill(null).map(() => []));
      setIsDataLoaded(false);
      
      if (result.success) {
        console.log('🗑️ Đã xóa tất cả dữ liệu (Firestore + localStorage)');
        setSaveStatus('✅ Đã xóa');
      } else {
        console.log('🗑️ Đã xóa localStorage (lỗi khi xóa Firestore)');
        setSaveStatus('⚠️ Đã xóa local');
      }
      
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  return (
    <div className="app-container">
      {/* Left Panel - Lịch trình và Chi tiết Toa */}
      <div className="left-panel">
        <div className="panel-header">
          <h3>Trang: /{pageId}</h3>
          {isLoading && <span style={{marginLeft: '10px', color: '#007bff', fontSize: '14px'}}>⏳ Đang tải...</span>}
          {!isLoading && saveStatus && <span style={{marginLeft: '10px', color: '#28a745', fontSize: '14px'}}>{saveStatus}</span>}
          {error && <span style={{marginLeft: '10px', color: '#dc3545', fontSize: '12px'}}>{error}</span>}
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
                <th rowSpan="2" className="header-main">STT</th>
                <th rowSpan="2" className="header-main">Ngày-tháng-năm</th>
                <th colSpan="2" className="header-group">Q1</th>
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
              {Array.from({ length: ROWS }, (_, rowIndex) => (
                <tr key={rowIndex}>
                  <td>{rowIndex + 1}</td>
                  <td>
                    <input 
                      type="text" 
                      className="cell-input" 
                      placeholder="dd/mm/yyyy"
                      value={dateValues[rowIndex] || ''}
                      onChange={(e) => {
                        const newDateValues = [...dateValues];
                        newDateValues[rowIndex] = e.target.value;
                        setDateValues(newDateValues);
                      }}
                    />
                  </td>
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
          <button 
            className="action-button" 
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? '⏳ Đang tính...' : 'Tính'}
          </button>
          <button className="action-button" onClick={clearData} style={{marginLeft: '10px', backgroundColor: '#dc3545'}}>Xóa dữ liệu</button>
        </div>
      </div>

      {/* Right Panel - Bảng dữ liệu chính */}
      <div className="right-panel">
        <div className="toolbar">
          <button className="toolbar-btn" onClick={handleGenerate}>Tính</button>
        </div>
        
        {isGenerating && (
          <div className="loading-overlay">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Đang tính toán {allTableData.length} bảng...</p>
            </div>
          </div>
        )}
        
        <div className="tables-container">
          {allTableData.map((tableData, tableIndex) => (
            <div key={tableIndex} className="table-section">
              <h4 className="table-title">T{tableIndex + 1}</h4>
              <div className="data-grid-wrapper">
                {tableData.length > 0 ? (
                  <table className="data-grid">
                    <thead>
                      <tr>
                        <th colSpan="3" className="group-header">Thông tin</th>
                        <th colSpan="1" className="group-header">Thông số</th>
                        <th colSpan="10" className="group-header">Tham số</th>
                      </tr>
                      <tr>
                        <th className="col-header fixed">STT</th>
                        <th className="col-header fixed" colSpan="2">Ngày</th>
                        <th className="col-header fixed">T{tableIndex + 1}</th>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                          <th key={num} className="col-header">{num}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <td className="data-cell fixed">{rowIndex + 1}</td>
                          <td className="data-cell fixed date-col" colSpan="2">{dateValues[rowIndex] || ''}</td>
                          <td className="data-cell fixed value-col">
                            <input
                              type="text"
                              className="grid-input"
                              value={allTValues[tableIndex][rowIndex]}
                              onChange={(e) => handleTValueChange(tableIndex, rowIndex, e.target.value)}
                              disabled={tableIndex >= 2}
                            />
                          </td>
                          {row.map((cell, colIndex) => {
                            const isCellHighlighted = highlightedCells[tableIndex]?.[rowIndex]?.[colIndex];
                            const isRowHighlighted = highlightedRows[tableIndex]?.[rowIndex];
                            
                            return (
                              <td
                                key={colIndex}
                                className={`data-cell ${cell.color} ${isCellHighlighted ? 'highlighted-cell' : ''} ${isRowHighlighted ? 'highlighted-row' : ''}`}
                                onClick={() => handleCellClick(tableIndex, rowIndex, colIndex)}
                                onDoubleClick={() => handleCellDoubleClick(tableIndex, rowIndex)}
                              >
                                {cell.value}
                              </td>
                            );
                          })}
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
