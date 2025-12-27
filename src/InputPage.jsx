import { useState, useEffect } from "react";
import "./App.css";
import "./InputPage.css";
import { savePageData, loadPageData } from "./dataService";

function InputPage() {
  const ROWS = 366;

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
            sharedDateValues = result.data.dateValues || Array(ROWS).fill("");
            sharedDeletedRows =
              result.data.deletedRows || Array(ROWS).fill(false);
            sharedPurpleFrom = result.data.purpleRangeFrom || 0;
            sharedPurpleTo = result.data.purpleRangeTo || 0;
          }
        } else {
          newAllQData.push({
            t1Values: Array(ROWS).fill(""),
            t2Values: Array(ROWS).fill(""),
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
          purpleRangeTo
        )
      );
    }

    await Promise.all(savePromises);

    setSaveStatus("✅ Đã lưu tất cả Q1-Q10!");
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
    <div className="app-container">
      <div style={{ width: "100%", padding: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ fontSize: "30px" }}>Nhập T1, T2 cho Q1-Q10</h2>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              className="toolbar-btn"
              onClick={handleSave}
              style={{ fontSize: "20px" }}
            >
              Lưu dữ liệu
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
            padding: "12px 20px",
            background: "#f9f9f9",
            borderBottom: "1px solid #e0e0e0",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <label style={{ fontSize: "30px", fontWeight: "600", color: "#555" }}>
            Nhập khoảng số muốn báo màu:
          </label>
          <input
            type="number"
            min="0"
            max="1000"
            value={purpleRangeFrom}
            onChange={(e) => setPurpleRangeFrom(parseInt(e.target.value) || 0)}
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
            onChange={(e) => setPurpleRangeTo(parseInt(e.target.value) || 0)}
            style={{
              width: "100px",
              padding: "4px 8px",
              fontSize: "30px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              textAlign: "center",
            }}
          />
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
                {Array.from({ length: 10 }, (_, qIndex) => (
                  <th key={qIndex} colSpan="2">
                    Q{qIndex + 1}
                  </th>
                ))}
              </tr>
              <tr>
                {Array.from({ length: 10 }, (_, qIndex) => (
                  <>
                    <th key={`t1-${qIndex}`}>T1</th>
                    <th key={`t2-${qIndex}`}>T2</th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROWS }, (_, rowIndex) => {
                if (deletedRows[rowIndex]) return null;

                return (
                  <tr key={rowIndex}>
                    <td>{String(rowIndex).padStart(3, "0")}</td>
                    <td>
                      <input
                        type="date"
                        className="cell-input"
                        value={dateValues[rowIndex] || ""}
                        onChange={(e) => {
                          const newDateValues = [...dateValues];
                          newDateValues[rowIndex] = e.target.value;
                          setDateValues(newDateValues);
                        }}
                      />
                    </td>

                    {Array.from({ length: 10 }, (_, qIndex) => (
                      <>
                        <td key={`t1-${qIndex}`}>
                          <input
                            type="text"
                            className="cell-input small"
                            value={allQData[qIndex].t1Values[rowIndex] || ""}
                            onChange={(e) => {
                              const newAllQData = [...allQData];
                              newAllQData[qIndex].t1Values[rowIndex] =
                                e.target.value;
                              setAllQData(newAllQData);
                            }}
                          />
                        </td>
                        <td key={`t2-${qIndex}`}>
                          <input
                            type="text"
                            className="cell-input small"
                            value={allQData[qIndex].t2Values[rowIndex] || ""}
                            onChange={(e) => {
                              const newAllQData = [...allQData];
                              newAllQData[qIndex].t2Values[rowIndex] =
                                e.target.value;
                              setAllQData(newAllQData);
                            }}
                          />
                        </td>
                      </>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default InputPage;
