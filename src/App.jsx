import { useState, useEffect } from "react";
import "./App.css";
import {
  savePageData,
  loadPageData,
  deletePageData,
  migrateFromLocalStorage,
} from "./dataService";

function App() {
  const [t1, setT1] = useState("");
  const [t2, setT2] = useState("");
  const [t3, setT3] = useState("");

  const TOTAL_TABLES = 60;
  const ROWS = 300; // Tăng từ 150 lên 300 dòng

  // Lấy pageId từ URL (vd: /q1 -> pageId = 'q1')
  const pageId = window.location.pathname.slice(1) || "q1"; // Default là 'q1'

  // State cho tất cả 60 bảng
  const [allTableData, setAllTableData] = useState(
    Array(TOTAL_TABLES)
      .fill(null)
      .map(() => [])
  );
  const [allTValues, setAllTValues] = useState(
    Array(TOTAL_TABLES)
      .fill(null)
      .map(() => Array(ROWS).fill(""))
  );
  const [dateValues, setDateValues] = useState(Array(ROWS).fill("")); // Lưu ngày tháng cho mỗi row
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false); // Loading khi tính toán
  const [error, setError] = useState("");

  // State cho highlight cells và rows
  const [highlightedCells, setHighlightedCells] = useState({}); // {tableIndex: {rowIndex: {colIndex: true}}}
  const [highlightedRows, setHighlightedRows] = useState({}); // {tableIndex: {rowIndex: true}}

  // State cho delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOption, setDeleteOption] = useState("all"); // 'all', 'rows', 'dates'
  const [deleteRowFrom, setDeleteRowFrom] = useState("");
  const [deleteRowTo, setDeleteRowTo] = useState("");
  const [deleteDateFrom, setDeleteDateFrom] = useState("");
  const [deleteDateTo, setDeleteDateTo] = useState("");

  // Load dữ liệu từ Firestore khi component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError("");

      try {
        // Thử load từ Firestore trước
        const result = await loadPageData(pageId);

        if (result.success && result.data) {
          // Có dữ liệu từ Firestore
          const newAllTValues = [...allTValues];
          newAllTValues[0] = result.data.t1Values;
          newAllTValues[1] = result.data.t2Values;

          setAllTValues(newAllTValues);
          setDateValues(result.data.dateValues || Array(ROWS).fill("")); // Load dateValues
          setIsDataLoaded(true);

          // Tự động generate bảng
          setTimeout(() => {
            generateTableWithValues(newAllTValues);
          }, 100);
        } else if (!result.success) {
          // Lỗi khi load từ Firestore, thử localStorage
        } else {
          // Không có dữ liệu, thử migrate từ localStorage

          const migrateResult = await migrateFromLocalStorage(pageId);
          if (migrateResult.success) {
            // Load lại sau khi migrate
            loadData();
          } else {
          }
        }
      } catch (error) {
        console.error("Lỗi khi load từ Firestore:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [pageId]);

  // Thuật toán sinh bảng (dùng chung cho cả 2 toa)
  const generateTableData = (tValues, toaName) => {
    const COLS = 10;

    // Tính số rows thực tế dựa trên dữ liệu đã nhập
    let actualRows = 0;
    for (let i = tValues.length - 1; i >= 0; i--) {
      if (
        tValues[i] !== "" &&
        tValues[i] !== null &&
        tValues[i] !== undefined
      ) {
        actualRows = i + 1;
        break;
      }
    }

    // Nếu không có dữ liệu, return empty
    if (actualRows === 0) {
      return [];
    }

    const table = Array(actualRows)
      .fill(null)
      .map(() => Array(COLS).fill(null));

    // Duyệt qua từng cột (trái sang phải)
    for (let col = 0; col < COLS; col++) {
      let y = 1; // Reset y về 1 khi bắt đầu cột mới

      // Duyệt qua từng hàng trong cột (trên xuống dưới)
      for (let row = 0; row < actualRows; row++) {
        let currentY = y;

        // Lấy giá trị T của hàng này
        const tColumnForThisRow = tValues[row] ? parseInt(tValues[row]) : -1;

        // Xác định màu
        let color = "white";
        let shouldResetY = false;

        // Logic tô đỏ: Nếu cột hiện tại = T của hàng này
        if (col === tColumnForThisRow && tColumnForThisRow !== -1) {
          color = "red";
          shouldResetY = true;
        }

        // Kiểm tra điều kiện tô màu tím (giá trị = 7 hoặc 8)
        if (color === "white" && (currentY === 7 || currentY === 8)) {
          color = "purple";
        }

        table[row][col] = {
          value: `${col}-${currentY}`,
          color: color,
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
    // Tính actualRows từ T1 hoặc T2
    let actualRows = 0;
    for (let i = tValuesArray[0].length - 1; i >= 0; i--) {
      if (
        (tValuesArray[0][i] !== "" &&
          tValuesArray[0][i] !== null &&
          tValuesArray[0][i] !== undefined) ||
        (tValuesArray[1][i] !== "" &&
          tValuesArray[1][i] !== null &&
          tValuesArray[1][i] !== undefined)
      ) {
        actualRows = i + 1;
        break;
      }
    }

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
        newAllTValues[tableIndex] = Array(ROWS).fill("");
        for (let rowIdx = 0; rowIdx < actualRows; rowIdx++) {
          const num1 = parseInt(prevPrevValues[rowIdx]) || 0;
          const num2 = parseInt(prevValues[rowIdx]) || 0;
          const sum = num1 + num2;
          newAllTValues[tableIndex][rowIdx] = String(sum % 10); // Lấy chữ số cuối
        }
      }

      // Gen bảng dữ liệu cho table này
      const tableData = generateTableData(
        newAllTValues[tableIndex],
        `T${tableIndex + 1}`
      );
      newAllTableData.push(tableData);
    }

    setAllTValues(newAllTValues);
    setAllTableData(newAllTableData);

    console.log("Hoàn tất gen 60 bảng!");
  };

  const generateTable = () => {
    generateTableWithValues(allTValues);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    // Dùng setTimeout để UI có thời gian hiển thị loading
    setTimeout(async () => {
      generateTable();
      setIsGenerating(false);

      // Lưu dữ liệu lên Firebase sau khi tính xong
      setSaveStatus("💾 Đang lưu...");
      const result = await savePageData(
        pageId,
        allTValues[0],
        allTValues[1],
        dateValues
      );

      if (result.success) {
        setSaveStatus("✅ Đã lưu dữ liệu thành công");
      } else {
        setSaveStatus("⚠️ Lỗi: " + result.error);
        setError(result.error);
      }

      setTimeout(() => setSaveStatus(""), 2000);
    }, 100);
  };

  // Handle click vào cell - bôi xanh 1 ô
  const handleCellClick = (tableIndex, rowIndex, colIndex) => {
    setHighlightedCells((prev) => {
      const newState = { ...prev };
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
    setHighlightedRows((prev) => {
      const newState = { ...prev };
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

  const clearData = () => {
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      const newAllTValues = [...allTValues];
      const newDateValues = [...dateValues];

      if (deleteOption === "all") {
        // Xóa tất cả
        const result = await deletePageData(pageId);

        // Xóa localStorage để tránh migrate lại data cũ
        localStorage.clear();

        setAllTValues(
          Array(TOTAL_TABLES)
            .fill(null)
            .map(() => Array(ROWS).fill(""))
        );
        setDateValues(Array(ROWS).fill(""));
        setAllTableData(
          Array(TOTAL_TABLES)
            .fill(null)
            .map(() => [])
        );
        setIsDataLoaded(false);

        if (result.success) {
          alert("✅ Đã xóa tất cả dữ liệu!");
        } else {
          alert("⚠️ Lỗi khi xóa: " + result.error);
        }
      } else if (deleteOption === "rows") {
        // Xóa theo số dòng và shift data lên
        const from = parseInt(deleteRowFrom) - 1; // Convert to 0-indexed
        const to = parseInt(deleteRowTo) - 1;

        if (isNaN(from) || isNaN(to) || from < 0 || to >= ROWS || from > to) {
          alert("⚠️ Số dòng không hợp lệ!");
          return;
        }

        const deleteCount = to - from + 1;

        // Shift data lên (xóa và đẩy lên)
        for (let i = from; i < ROWS; i++) {
          if (i + deleteCount < ROWS) {
            // Copy data từ dòng phía dưới lên
            newAllTValues[0][i] = newAllTValues[0][i + deleteCount];
            newAllTValues[1][i] = newAllTValues[1][i + deleteCount];
            newDateValues[i] = newDateValues[i + deleteCount];
          } else {
            // Các dòng cuối set rỗng
            newAllTValues[0][i] = "";
            newAllTValues[1][i] = "";
            newDateValues[i] = "";
          }
        }

        setAllTValues(newAllTValues);
        setDateValues(newDateValues);

        // Regenerate 60 bảng với data mới
        generateTableWithValues(newAllTValues);

        // Lưu lên DB
        setSaveStatus("💾 Đang lưu...");
        const result = await savePageData(
          pageId,
          newAllTValues[0],
          newAllTValues[1],
          newDateValues
        );

        if (result.success) {
          setSaveStatus("✅ Đã lưu dữ liệu thành công");
          alert(`✅ Đã xóa và đẩy lên ${deleteCount} dòng!`);
        } else {
          setSaveStatus("⚠️ Lỗi: " + result.error);
        }

        setTimeout(() => setSaveStatus(""), 2000);
      } else if (deleteOption === "dates") {
        // Xóa theo khoảng ngày và shift data lên
        if (!deleteDateFrom || !deleteDateTo) {
          alert("⚠️ Vui lòng nhập đầy đủ ngày!");
          return;
        }

        // Helper function: Convert dd/mm/yyyy → yyyy-mm-dd
        const convertToComparable = (dateStr) => {
          if (!dateStr) return null;

          // Nếu đã là yyyy-mm-dd format (từ date picker)
          if (dateStr.includes("-")) {
            return dateStr;
          }

          // Convert dd/mm/yyyy → yyyy-mm-dd
          const parts = dateStr.split("/");
          if (parts.length === 3) {
            const [day, month, year] = parts;
            return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
          }

          return null;
        };

        // Tạo array mới chỉ chứa các dòng KHÔNG bị xóa
        const newT1 = [];
        const newT2 = [];
        const newDates = [];
        let deletedCount = 0;

        for (let i = 0; i < ROWS; i++) {
          const dateStr = newDateValues[i];
          const comparableDate = convertToComparable(dateStr);

          const shouldDelete =
            comparableDate &&
            comparableDate >= deleteDateFrom &&
            comparableDate <= deleteDateTo;

          if (!shouldDelete) {
            // Giữ lại dòng này
            newT1.push(newAllTValues[0][i]);
            newT2.push(newAllTValues[1][i]);
            newDates.push(newDateValues[i]);
          } else {
            deletedCount++;
          }
        }

        // Pad với empty strings để đủ ROWS
        while (newT1.length < ROWS) {
          newT1.push("");
          newT2.push("");
          newDates.push("");
        }

        newAllTValues[0] = newT1;
        newAllTValues[1] = newT2;

        setAllTValues(newAllTValues);
        setDateValues(newDates);

        // Regenerate 60 bảng với data mới
        generateTableWithValues(newAllTValues);

        // Lưu lên DB
        setSaveStatus("💾 Đang lưu...");
        const result = await savePageData(
          pageId,
          newAllTValues[0],
          newAllTValues[1],
          newDates
        );

        if (result.success) {
          setSaveStatus("✅ Đã lưu dữ liệu thành công");
          alert(
            `✅ Đã xóa và đẩy lên ${deletedCount} dòng từ ${deleteDateFrom} đến ${deleteDateTo}!`
          );
        } else {
          setSaveStatus("⚠️ Lỗi: " + result.error);
        }

        setTimeout(() => setSaveStatus(""), 2000);
      }

      setShowDeleteModal(false);

      // Reset form
      setDeleteOption("all");
      setDeleteRowFrom("");
      setDeleteRowTo("");
      setDeleteDateFrom("");
      setDeleteDateTo("");
    } catch (error) {
      alert("⚠️ Lỗi: " + error.message);
    }
  };

  return (
    <div className="app-container">
      {/* Left Panel - Lịch trình và Chi tiết Toa */}
      <div className="left-panel">
        <div className="panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h3>Trang:</h3>
            <select
              value={pageId}
              onChange={(e) => {
                window.location.pathname = `/${e.target.value}`;
              }}
              style={{
                padding: "6px 12px",
                fontSize: "14px",
                fontWeight: "600",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
                backgroundColor: "#fff",
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={`q${num}`}>
                  Q{num}
                </option>
              ))}
            </select>
          </div>
          {isLoading && (
            <span
              style={{ marginLeft: "10px", color: "#007bff", fontSize: "14px" }}
            >
              ⏳ Đang tải...
            </span>
          )}
          {!isLoading && saveStatus && (
            <span
              style={{ marginLeft: "10px", color: "#28a745", fontSize: "14px" }}
            >
              {saveStatus}
            </span>
          )}
          {error && (
            <span
              style={{ marginLeft: "10px", color: "#dc3545", fontSize: "12px" }}
            >
              {error}
            </span>
          )}
        </div>

        <div className="schedule-table-wrapper">
          <table className="schedule-table">
            <thead>
              <tr>
                <th rowSpan="2" className="header-main">
                  STT
                </th>
                <th rowSpan="2" className="header-main">
                  Ngày-tháng-năm
                </th>
                <th colSpan="2" className="header-group">
                  Q1
                </th>
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
                      value={dateValues[rowIndex] || ""}
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
                      value={allTValues[0][rowIndex] || ""}
                      onChange={(e) =>
                        handleTValueChange(0, rowIndex, e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="cell-input small"
                      value={allTValues[1][rowIndex] || ""}
                      onChange={(e) =>
                        handleTValueChange(1, rowIndex, e.target.value)
                      }
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
            {isGenerating ? "⏳ Đang tính..." : "Tính"}
          </button>
          <button
            className="action-button"
            onClick={clearData}
            style={{ marginTop: "10px", backgroundColor: "#dc3545" }}
          >
            Xóa dữ liệu
          </button>
        </div>
      </div>

      {/* Right Panel - Bảng dữ liệu chính */}
      <div className="right-panel">
        <div className="toolbar">
          <button className="toolbar-btn" onClick={handleGenerate}>
            Tính
          </button>
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
                        <th colSpan="3" className="group-header">
                          Thông tin
                        </th>
                        <th colSpan="1" className="group-header">
                          Thông số
                        </th>
                        <th colSpan="10" className="group-header">
                          Tham số
                        </th>
                      </tr>
                      <tr>
                        <th className="col-header fixed">STT</th>
                        <th className="col-header fixed" colSpan="2">
                          Ngày
                        </th>
                        <th className="col-header fixed">T{tableIndex + 1}</th>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                          <th key={num} className="col-header">
                            {num}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <td className="data-cell fixed">{rowIndex + 1}</td>
                          <td className="data-cell fixed date-col" colSpan="2">
                            {dateValues[rowIndex] || ""}
                          </td>
                          <td className="data-cell fixed value-col">
                            <input
                              type="text"
                              className="grid-input"
                              value={allTValues[tableIndex][rowIndex]}
                              onChange={(e) =>
                                handleTValueChange(
                                  tableIndex,
                                  rowIndex,
                                  e.target.value
                                )
                              }
                              disabled={tableIndex >= 2}
                            />
                          </td>
                          {row.map((cell, colIndex) => {
                            const isCellHighlighted =
                              highlightedCells[tableIndex]?.[rowIndex]?.[
                                colIndex
                              ];
                            const isRowHighlighted =
                              highlightedRows[tableIndex]?.[rowIndex];

                            return (
                              <td
                                key={colIndex}
                                className={`data-cell ${cell.color} ${
                                  isCellHighlighted ? "highlighted-cell" : ""
                                } ${isRowHighlighted ? "highlighted-row" : ""}`}
                                onClick={() =>
                                  handleCellClick(
                                    tableIndex,
                                    rowIndex,
                                    colIndex
                                  )
                                }
                                onDoubleClick={() =>
                                  handleCellDoubleClick(tableIndex, rowIndex)
                                }
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

      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Xóa dữ liệu - {pageId?.toUpperCase()}</h3>

            <div className="modal-body">
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    value="all"
                    checked={deleteOption === "all"}
                    onChange={(e) => setDeleteOption(e.target.value)}
                  />
                  Xóa tất cả dữ liệu {pageId?.toUpperCase()}
                </label>

                <label>
                  <input
                    type="radio"
                    value="rows"
                    checked={deleteOption === "rows"}
                    onChange={(e) => setDeleteOption(e.target.value)}
                  />
                  Xóa theo số dòng
                </label>

                {deleteOption === "rows" && (
                  <div className="input-row">
                    <input
                      type="number"
                      placeholder="Từ dòng"
                      value={deleteRowFrom}
                      onChange={(e) => setDeleteRowFrom(e.target.value)}
                      min="1"
                      max={ROWS}
                    />
                    <span>đến</span>
                    <input
                      type="number"
                      placeholder="Đến dòng"
                      value={deleteRowTo}
                      onChange={(e) => setDeleteRowTo(e.target.value)}
                      min="1"
                      max={ROWS}
                    />
                  </div>
                )}

                <label>
                  <input
                    type="radio"
                    value="dates"
                    checked={deleteOption === "dates"}
                    onChange={(e) => setDeleteOption(e.target.value)}
                  />
                  Xóa theo khoảng ngày
                </label>

                {deleteOption === "dates" && (
                  <div className="input-row">
                    <input
                      type="date"
                      value={deleteDateFrom}
                      onChange={(e) => setDeleteDateFrom(e.target.value)}
                    />
                    <span>đến</span>
                    <input
                      type="date"
                      value={deleteDateTo}
                      onChange={(e) => setDeleteDateTo(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                Hủy
              </button>
              <button className="btn-delete" onClick={handleDelete}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
