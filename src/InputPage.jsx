import { useState, useEffect } from "react";
import "./App.css";
import "./InputPage.css";
import { savePageData, loadPageData } from "./dataService";

function InputPage() {
  const MIN_ROWS = 366; // Minimum rows
  const [keepLastNRows, setKeepLastNRows] = useState(366);
  const ROWS = Math.max(MIN_ROWS, keepLastNRows); // Dynamic: min 366, or larger from DB

  // State cho T1, T2 của 10Q
  const [allQData, setAllQData] = useState(
    Array(10)
      .fill(null)
      .map(() => ({
        t1Values: Array(ROWS).fill(""),
        t2Values: Array(ROWS).fill(""),
      }))
  );

  const [dateValues, setDateValues] = useState(Array(ROWS).fill(""));
  const [deletedRows, setDeletedRows] = useState(Array(ROWS).fill(false));
  const [purpleRangeFrom, setPurpleRangeFrom] = useState(0);
  const [purpleRangeTo, setPurpleRangeTo] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("");

  // Load data từ 10Q
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      const loadPromises = [];
      for (let i = 1; i <= 10; i++) {
        loadPromises.push(loadPageData(`q${i}`));
      }

      const results = await Promise.all(loadPromises);

      const newAllQData = [];
      let sharedDateValues = [];
      let sharedDeletedRows = [];
      let sharedPurpleFrom = 0;
      let sharedPurpleTo = 0;

      results.forEach((result, index) => {
        if (result.success && result.data) {
          newAllQData.push({
            t1Values: result.data.t1Values,
            t2Values: result.data.t2Values,
          });

          // Lấy shared data từ Q1
          if (index === 0) {
            sharedDateValues = result.data.dateValues || [];
            sharedDeletedRows = result.data.deletedRows || [];
            sharedPurpleFrom = result.data.purpleRangeFrom || 0;
            sharedPurpleTo = result.data.purpleRangeTo || 0;

            // Load keepLastNRows từ Q1 DB
            const loadedKeepLastNRows = result.data.keepLastNRows || 366;
            setKeepLastNRows(loadedKeepLastNRows);

            // Tính ROWS động
            const dynamicRows = Math.max(MIN_ROWS, loadedKeepLastNRows);

            // Pad hoặc trim arrays để match dynamicRows
            while (sharedDateValues.length < dynamicRows)
              sharedDateValues.push("");
            while (sharedDeletedRows.length < dynamicRows)
              sharedDeletedRows.push(false);
          }
        } else {
          const dynamicRows = Math.max(MIN_ROWS, keepLastNRows);
          newAllQData.push({
            t1Values: Array(dynamicRows).fill(""),
            t2Values: Array(dynamicRows).fill(""),
          });
        }
      });

      setAllQData(newAllQData);
      setDateValues(sharedDateValues);
      setDeletedRows(sharedDeletedRows);
      setPurpleRangeFrom(sharedPurpleFrom);
      setPurpleRangeTo(sharedPurpleTo);
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Auto scroll to last row with data
  useEffect(() => {
    if (!isLoading && dateValues.length > 0) {
      // Đếm số dòng chưa xóa có dữ liệu
      let nonDeletedRowsCount = 0;
      for (let i = 0; i < dateValues.length; i++) {
        if (!deletedRows[i] && dateValues[i]) {
          nonDeletedRowsCount++;
        }
      }

      if (nonDeletedRowsCount > 0) {
        // Delay nhỏ để đảm bảo DOM đã render
        setTimeout(() => {
          // Scroll đến dòng cuối cùng có dữ liệu (sau khi sort)
          // Vì rows được sort nên dòng cuối = nonDeletedRowsCount
          const targetRow = Math.max(0, nonDeletedRowsCount + 2);
          // Tìm row element và scroll đến đó
          const rowElement = document.querySelector(
            `tr:nth-child(${targetRow + 2})`
          ); // +2 vì có header row
          if (rowElement) {
            rowElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);
      }
    }
  }, [isLoading, dateValues, deletedRows]);

  // Save data vào 10Q
  const handleSave = async () => {
    setSaveStatus("💾 Đang lưu...");

    const savePromises = [];

    for (let qIndex = 0; qIndex < 10; qIndex++) {
      const qId = `q${qIndex + 1}`;

      savePromises.push(
        savePageData(
          qId,
          allQData[qIndex].t1Values,
          allQData[qIndex].t2Values,
          dateValues,
          deletedRows,
          purpleRangeFrom,
          purpleRangeTo,
          keepLastNRows
        )
      );
    }

    await Promise.all(savePromises);

    setSaveStatus("✅ Đã lưu tất cả Q1-Q10!");
    alert("✅ Đã lưu thành công!");
    setTimeout(() => setSaveStatus(""), 2000);
  };

  if (isLoading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div className="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <>
      {/* PMA Title */}
      <div
        style={{
          position: "sticky",
          top: 0,
          width: "100%",
          textAlign: "center",
          backgroundColor: "#f8f9fa",
          borderBottom: "2px solid #dee2e6",
          zIndex: 100,
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            fontStyle: "italic",
            margin: "0",
            color: "#333",
          }}
        >
          Phần mềm hỗ trợ dự án cải tạo môi trường biển Việt Nam
        </h1>
      </div>
      <div className="app-container">
        <div style={{ width: "100%", padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "20px",
              marginTop: "10px",
            }}
          >
            {/* <div
              style={{
                padding: "12px 20px",
                background: "#f9f9f9",
                borderBottom: "1px solid #e0e0e0",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <label
                style={{ fontSize: "30px", fontWeight: "600", color: "#555" }}
              >
                Nhập khoảng số muốn báo màu:
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                value={purpleRangeFrom}
                onChange={(e) =>
                  setPurpleRangeFrom(parseInt(e.target.value) || 0)
                }
                style={{
                  width: "100px",
                  padding: "4px 8px",
                  fontSize: "30px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  textAlign: "center",
                }}
              />
              <span style={{ fontSize: "30px", color: "#666" }}>đến</span>
              <input
                type="number"
                min="0"
                max="1000"
                value={purpleRangeTo}
                onChange={(e) =>
                  setPurpleRangeTo(parseInt(e.target.value) || 0)
                }
                style={{
                  width: "100px",
                  padding: "4px 8px",
                  fontSize: "30px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  textAlign: "center",
                }}
              />
            </div> */}
            {/* <h2 style={{ fontSize: "30px" }}>Nhập T1, T2 cho Q1-Q10</h2> */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <button
                className="toolbar-btn"
                onClick={handleSave}
                style={{ fontSize: "20px" }}
              >
                💾Lưu dữ liệu
              </button>
              {saveStatus && (
                <span style={{ color: "#28a745" }}>{saveStatus}</span>
              )}
              <button
                className="toolbar-btn"
                onClick={() => (window.location.href = "/q1")}
                style={{
                  marginLeft: "10px",
                  background: "#28a745",
                  color: "white",
                  fontSize: "20px",
                  border: "none",
                }}
              >
                🔍 Tra cứu
              </button>
            </div>
          </div>

          <div
            style={{
              overflowX: "auto",
              overflowY: "auto",
              maxHeight: "calc(100vh - 200px)",
              border: "1px solid #ddd",
            }}
          >
            <table className="schedule-table">
              <thead>
                <tr>
                  <th rowSpan="2">STT</th>
                  <th rowSpan="2">Ngày</th>
                  {Array.from({ length: 10 }, (_, qIndex) => {
                    // Màu background khác nhau cho mỗi Q
                    const colors = [
                      "#e3f2fd", // Q1 - xanh nhạt
                      "#f3e5f5", // Q2 - tím nhạt
                      "#fff3e0", // Q3 - cam nhạt
                      "#e8f5e9", // Q4 - xanh lá nhạt
                      "#fce4ec", // Q5 - hồng nhạt
                      "#e0f2f1", // Q6 - xanh lơ nhạt
                      "#fff9c4", // Q7 - vàng nhạt
                      "#f1f8e9", // Q8 - xanh lá nhạt 2
                      "#ede7f6", // Q9 - tím nhạt 2
                      "#ffebee", // Q10 - đỏ nhạt
                    ];

                    return (
                      <th
                        key={qIndex}
                        colSpan="2"
                        style={{
                          backgroundColor: colors[qIndex],
                          borderLeft: "3px solid red",
                          borderRight: "3px solid red",
                        }}
                      >
                        Q{qIndex + 1}
                      </th>
                    );
                  })}
                </tr>
                <tr>
                  {Array.from({ length: 10 }, (_, qIndex) => {
                    const colors = [
                      "#e3f2fd",
                      "#f3e5f5",
                      "#fff3e0",
                      "#e8f5e9",
                      "#fce4ec",
                      "#e0f2f1",
                      "#fff9c4",
                      "#f1f8e9",
                      "#ede7f6",
                      "#ffebee",
                    ];

                    return (
                      <>
                        <th
                          key={`t1-${qIndex}`}
                          style={{
                            backgroundColor: colors[qIndex],
                            borderLeft: "3px solid red",
                          }}
                        >
                          T1
                        </th>
                        <th
                          key={`t2-${qIndex}`}
                          style={{
                            backgroundColor: colors[qIndex],
                            borderRight: "3px solid red",
                          }}
                        >
                          T2
                        </th>
                      </>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const sortedIndices = Array.from(
                    { length: ROWS },
                    (_, i) => i
                  ).sort((a, b) => {
                    const aDeleted = deletedRows[a] || false;
                    const bDeleted = deletedRows[b] || false;
                    if (aDeleted === bDeleted) return a - b;
                    return aDeleted ? 1 : -1;
                  });
                  let displayRowNumber = 0;
                  return sortedIndices.map((rowIndex) => {
                    const isDeleted = deletedRows[rowIndex] || false;
                    displayRowNumber++; // Đếm tất cả các dòng
                    return (
                      <tr key={rowIndex}>
                        <td>{String(displayRowNumber).padStart(3, "0")}</td>
                        <td>
                          <input
                            type="date"
                            className="cell-input"
                            value={isDeleted ? "" : dateValues[rowIndex] || ""}
                            onChange={(e) => {
                              const newDateValues = [...dateValues];
                              newDateValues[rowIndex] = e.target.value;
                              setDateValues(newDateValues);
                            }}
                            disabled={isDeleted}
                          />
                        </td>

                        {Array.from({ length: 10 }, (_, qIndex) => {
                          const colors = [
                            "#e3f2fd",
                            "#f3e5f5",
                            "#fff3e0",
                            "#e8f5e9",
                            "#fce4ec",
                            "#e0f2f1",
                            "#fff9c4",
                            "#f1f8e9",
                            "#ede7f6",
                            "#ffebee",
                          ];

                          return (
                            <>
                              <td
                                key={`t1-${qIndex}`}
                                style={{
                                  backgroundColor: colors[qIndex],
                                  borderLeft: "3px solid red",
                                }}
                              >
                                <input
                                  type="text"
                                  className="cell-input small"
                                  value={
                                    isDeleted
                                      ? ""
                                      : allQData[qIndex].t1Values[rowIndex] ||
                                        ""
                                  }
                                  onChange={(e) => {
                                    const newAllQData = [...allQData];
                                    newAllQData[qIndex].t1Values[rowIndex] =
                                      e.target.value;
                                    setAllQData(newAllQData);
                                  }}
                                  disabled={isDeleted}
                                />
                              </td>
                              <td
                                key={`t2-${qIndex}`}
                                style={{
                                  backgroundColor: colors[qIndex],
                                  borderRight: "3px solid red",
                                }}
                              >
                                <input
                                  type="text"
                                  className="cell-input small"
                                  value={
                                    isDeleted
                                      ? ""
                                      : allQData[qIndex].t2Values[rowIndex] ||
                                        ""
                                  }
                                  onChange={(e) => {
                                    const newAllQData = [...allQData];
                                    newAllQData[qIndex].t2Values[rowIndex] =
                                      e.target.value;
                                    setAllQData(newAllQData);
                                  }}
                                  disabled={isDeleted}
                                />
                              </td>
                            </>
                          );
                        })}
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default InputPage;
