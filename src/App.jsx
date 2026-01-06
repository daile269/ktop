import { useState, useEffect, useRef } from "react";
import "./App.css";
import "./TopToolbar.css";
import {
  savePageData,
  loadPageData,
  deletePageData,
  migrateFromLocalStorage,
} from "./dataService";
import InputPage from "./InputPage";

function App() {
  // Check if route is /input
  const pathname = window.location.pathname.slice(1);
  if (pathname === "input") {
    return <InputPage />;
  }
  const [t1, setT1] = useState("");
  const [t2, setT2] = useState("");
  const [t3, setT3] = useState("");

  const TOTAL_TABLES = 60;
  const ROWS = 366; // Tăng từ 150 lên 300 dòng

  // Lấy pageId từ URL (vd: /q1 -> pageId = 'q1')
  const pageId = pathname || "q1"; // Default là 'q1'

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

  // State cho highlight cells, rows và T-columns
  const [highlightedCells, setHighlightedCells] = useState({}); // {tableIndex: {rowIndex: {colIndex: true}}}
  const [highlightedRows, setHighlightedRows] = useState({}); // {tableIndex: {rowIndex: true}}
  const [highlightedTColumns, setHighlightedTColumns] = useState({}); // {tableIndex: true} - Highlight cột T (Thông số)

  // State cho delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOption, setDeleteOption] = useState("all"); // 'all', 'firstRow', 'dates'
  const [deleteDateFrom, setDeleteDateFrom] = useState("");
  const [deleteDateTo, setDeleteDateTo] = useState("");

  // State cho add row modal
  const [showAddRowModal, setShowAddRowModal] = useState(false);
  const [newRowDate, setNewRowDate] = useState("");
  const [newRowT1, setNewRowT1] = useState("");
  const [newRowT2, setNewRowT2] = useState("");
  const [isAddingRow, setIsAddingRow] = useState(false);

  // State cho keep last N rows
  const [keepLastNRows, setKeepLastNRows] = useState("");

  // State cho purple range (tô màu tím)
  const [purpleRangeFrom, setPurpleRangeFrom] = useState(0);
  const [purpleRangeTo, setPurpleRangeTo] = useState(0);

  // State cho deleted rows (đánh dấu row bị xóa)
  const [deletedRows, setDeletedRows] = useState(Array(ROWS).fill(false));

  // State cho delete first row modal
  const [showDeleteFirstRowModal, setShowDeleteFirstRowModal] = useState(false);

  // State cho settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // State cho keep last N rows confirmation modal
  const [showKeepLastNRowsModal, setShowKeepLastNRowsModal] = useState(false);

  // State cho delete confirmation modals
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showDeleteByDatesModal, setShowDeleteByDatesModal] = useState(false);
  const [showDeleteLastRowModal, setShowDeleteLastRowModal] = useState(false);

  // State cho purple range settings modal
  const [showPurpleRangeModal, setShowPurpleRangeModal] = useState(false);
  const [tempPurpleRangeFrom, setTempPurpleRangeFrom] = useState("");
  const [tempPurpleRangeTo, setTempPurpleRangeTo] = useState("");
  const [isSavingPurpleRange, setIsSavingPurpleRange] = useState(false);

  // State cho keep last N rows settings modal
  const [showKeepLastNRowsSettingsModal, setShowKeepLastNRowsSettingsModal] =
    useState(false);
  const [tempKeepLastNRows, setTempKeepLastNRows] = useState("");
  const [isSavingKeepLastNRows, setIsSavingKeepLastNRows] = useState(false);

  // State để lưu thông tin các Q có ô màu vàng
  const [qPurpleInfo, setQPurpleInfo] = useState({}); // {q1: {hasPurple: true, cells: ['3-10', '4-9']}, ...}

  // State để lưu các Q đã xem (đã click vào khi có báo màu)
  const [viewedQs, setViewedQs] = useState(() => {
    const saved = localStorage.getItem("viewedQs");
    return saved ? JSON.parse(saved) : {};
  });

  // State cho Go To Table
  const [goToTableNumber, setGoToTableNumber] = useState("");

  // Refs for sync scrolling
  const tableRefs = useRef([]);
  const isScrollingRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  // Handle sync scroll
  const handleSyncScroll = (e, index) => {
    // Nếu đang scroll bởi bảng khác thì bỏ qua
    if (isScrollingRef.current !== null && isScrollingRef.current !== index) {
      return;
    }

    // Đánh dấu bảng này đang chủ động scroll
    isScrollingRef.current = index;

    const { scrollTop } = e.target;

    tableRefs.current.forEach((ref, i) => {
      if (ref && i !== index) {
        // Chỉ cập nhật nếu có sự thay đổi để tránh repaint không cần thiết
        if (Math.abs(ref.scrollTop - scrollTop) > 1) {
          ref.scrollTop = scrollTop;
        }
      }
    });

    // Reset cờ khi ngừng scroll
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = null;
    }, 50);
  };

  // Lấy thông tin các ô màu vàng trong Q hiện tại (chỉ hàng dưới cùng)
  const getPurpleCellsInfo = () => {
    const purpleCells = {};

    // Tìm hàng dưới cùng (hàng mới nhất có dữ liệu)
    let lastRowIndex = -1;
    for (let i = dateValues.length - 1; i >= 0; i--) {
      if (!deletedRows[i] && dateValues[i]) {
        lastRowIndex = i;
        break;
      }
    }

    // Nếu không có hàng nào, return empty
    if (lastRowIndex === -1) {
      return purpleCells;
    }

    // Chỉ kiểm tra hàng dưới cùng
    allTableData.forEach((tableData, tableIndex) => {
      const tablePurpleCells = [];

      if (tableData[lastRowIndex]) {
        tableData[lastRowIndex].forEach((cell, colIndex) => {
          if (cell.color === "purple" || cell.color === "purple-red") {
            tablePurpleCells.push(cell.value);
          }
        });
      }

      if (tablePurpleCells.length > 0) {
        purpleCells[`T${tableIndex + 1}`] = tablePurpleCells;
      }
    });

    return purpleCells;
  };

  // Format purple cells info thành string để hiển thị
  const formatPurpleCellsInfo = () => {
    const purpleCells = getPurpleCellsInfo();
    const entries = Object.entries(purpleCells);

    if (entries.length === 0) {
      return "Không có bảng nào được báo màu";
    }

    // Chỉ hiển thị tên các bảng T, không hiển thị chi tiết ô
    const tableNames = entries.map(([table]) => table);
    return tableNames.join(", ");
  };

  // Handle Go To Table
  const handleGoToTable = () => {
    const tableNum = parseInt(goToTableNumber);

    if (isNaN(tableNum) || tableNum < 1 || tableNum > TOTAL_TABLES) {
      alert(`⚠️ Vui lòng nhập số từ 1 đến ${TOTAL_TABLES}`);
      return;
    }

    // Tìm element của bảng T
    const tableIndex = tableNum - 1;
    const tableElement =
      document.querySelectorAll(".table-section")[tableIndex];

    if (tableElement) {
      tableElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "start",
      });
      setGoToTableNumber(""); // Reset input
    } else {
      alert(`⚠️ Không tìm thấy bảng T${tableNum}`);
    }
  };

  // Reset tất cả trạng thái "đã xem" (gọi khi thêm hàng mới)
  const resetViewedQs = () => {
    setViewedQs({});
    localStorage.setItem("viewedQs", JSON.stringify({}));
  };

  // Helper function to format date to Vietnamese
  const formatDateToVietnamese = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      return `ngày ${parseInt(day)} tháng ${parseInt(month)} năm ${year}`;
    }
    return dateString;
  };

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
          const loadedDateValues =
            result.data.dateValues || Array(ROWS).fill("");
          const loadedDeletedRows =
            result.data.deletedRows || Array(ROWS).fill(false);

          setDateValues(loadedDateValues); // Load dateValues
          setDeletedRows(loadedDeletedRows); // Load deletedRows

          // ⭐ LUÔN load purple range từ Q1 (không phải từ Q hiện tại)
          // Điều này đảm bảo tất cả Q1-Q10 đều hiển thị cùng 1 khoảng báo màu
          const q1Result = await loadPageData("q1");
          let loadedPurpleFrom = 0;
          let loadedPurpleTo = 0;

          if (q1Result.success && q1Result.data) {
            loadedPurpleFrom = q1Result.data.purpleRangeFrom || 0;
            loadedPurpleTo = q1Result.data.purpleRangeTo || 0;
          }

          setPurpleRangeFrom(loadedPurpleFrom);
          setPurpleRangeTo(loadedPurpleTo);

          // Load keepLastNRows từ DB (ưu tiên)
          if (result.data.keepLastNRows) {
            setKeepLastNRows(result.data.keepLastNRows);
          } else {
            // Nếu chưa có trong DB, tính số dòng còn lại
            let nonDeletedCount = 0;
            for (let i = 0; i < ROWS; i++) {
              if (!loadedDeletedRows[i]) {
                nonDeletedCount++;
              }
            }
            setKeepLastNRows(nonDeletedCount);
          }

          setIsDataLoaded(true);

          // useEffect sẽ tự động regenerate khi purpleRange thay đổi
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

  // Auto-regenerate bảng khi dateValues hoặc purple range thay đổi
  useEffect(() => {
    if (isDataLoaded) {
      generateTableWithValues(allTValues);
    }
  }, [dateValues, purpleRangeFrom, purpleRangeTo]);

  // Auto scroll to bottom khi mở ứng dụng
  useEffect(() => {
    if (isDataLoaded && allTableData.length > 0) {
      // Delay nhỏ để đảm bảo DOM đã render xong
      setTimeout(() => {
        // Scroll tất cả các bảng xuống cuối
        tableRefs.current.forEach((ref) => {
          if (ref) {
            ref.scrollTop = ref.scrollHeight;
          }
        });
      }, 100);
    }
  }, [isDataLoaded, allTableData]);

  // Đánh dấu Q hiện tại là đã xem khi có báo màu
  useEffect(() => {
    if (qPurpleInfo[pageId]?.hasPurple && !viewedQs[pageId]) {
      const newViewedQs = { ...viewedQs, [pageId]: true };
      setViewedQs(newViewedQs);
      localStorage.setItem("viewedQs", JSON.stringify(newViewedQs));
    }
  }, [pageId, qPurpleInfo]);

  // Load purple info cho tất cả Q1-Q10
  useEffect(() => {
    const loadAllQPurpleInfo = async () => {
      const info = {};

      for (let i = 1; i <= 10; i++) {
        const qId = `q${i}`;
        const result = await loadPageData(qId);

        if (result.success && result.data) {
          const {
            purpleRangeFrom: from,
            purpleRangeTo: to,
            dateValues,
            deletedRows,
            t1Values,
            t2Values,
          } = result.data;

          // Kiểm tra xem Q này có purple range không
          if (from && to && parseInt(from) > 0 && parseInt(to) > 0) {
            const purpleFrom = parseInt(from);
            const purpleTo = parseInt(to);

            // Tìm hàng dưới cùng (hàng mới nhất có dữ liệu)
            let lastRowIndex = -1;
            for (let rowIdx = dateValues.length - 1; rowIdx >= 0; rowIdx--) {
              if (!deletedRows[rowIdx] && dateValues[rowIdx]) {
                lastRowIndex = rowIdx;
                break;
              }
            }

            // Kiểm tra xem hàng dưới cùng có ô purple không
            let hasLastRowPurple = false;
            if (lastRowIndex !== -1 && t1Values && t2Values) {
              // Tính y counter cho từng cột ở hàng dưới cùng
              for (let col = 0; col < 10; col++) {
                let y = 1;

                // Tính y từ đầu đến hàng cuối
                for (let row = 0; row <= lastRowIndex; row++) {
                  if (deletedRows[row]) continue;

                  const currentY = y;

                  // Lấy giá trị T của hàng này
                  const tValue = (col < 5 ? t1Values : t2Values)?.[row];
                  const tCol = tValue ? parseInt(tValue) : -1;

                  // Nếu đây là hàng cuối, kiểm tra y có trong purple range không
                  if (row === lastRowIndex) {
                    if (
                      currentY >= purpleFrom &&
                      currentY <= purpleTo &&
                      col !== tCol
                    ) {
                      hasLastRowPurple = true;
                      break;
                    }
                  }

                  // Tăng y
                  y++;

                  // Reset y nếu gặp ô đỏ
                  if (col === tCol && tCol !== -1) {
                    y = 1;
                  }
                }

                if (hasLastRowPurple) break;
              }
            }

            if (hasLastRowPurple) {
              info[qId] = {
                hasPurple: true,
                from: purpleFrom,
                to: purpleTo,
                range: `${from}-${to}`,
              };
            }
          }
        }
      }

      setQPurpleInfo(info);
    };

    // Load khi component mount và khi purpleRange của Q hiện tại thay đổi
    loadAllQPurpleInfo();
  }, [purpleRangeFrom, purpleRangeTo, pageId]);

  // Thuật toán sinh bảng (dùng chung cho cả 2 toa)
  const generateTableData = (tValues, toaName) => {
    const COLS = 10;

    // Tính số rows thực tế dựa trên dateValues hoặc tValues
    let actualRows = 0;

    // Tìm row cuối cùng có ngày
    for (let i = dateValues.length - 1; i >= 0; i--) {
      if (
        dateValues[i] !== "" &&
        dateValues[i] !== null &&
        dateValues[i] !== undefined
      ) {
        actualRows = Math.max(actualRows, i + 1);
        break;
      }
    }

    // Hoặc tìm row cuối cùng có T value
    for (let i = tValues.length - 1; i >= 0; i--) {
      if (
        tValues[i] !== "" &&
        tValues[i] !== null &&
        tValues[i] !== undefined
      ) {
        actualRows = Math.max(actualRows, i + 1);
        break;
      }
    }

    // Nếu không có dữ liệu gì, return empty
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

        // Kiểm tra xem có phải ô đỏ không
        const isRed = col === tColumnForThisRow && tColumnForThisRow !== -1;

        // Kiểm tra xem có nằm trong purple range không
        const isPurple =
          currentY >= purpleRangeFrom && currentY <= purpleRangeTo;

        // Xác định màu cuối cùng
        if (isRed && isPurple) {
          color = "purple-red"; // Vừa đỏ vừa vàng: background vàng, chữ đỏ
          shouldResetY = true;
        } else if (isRed) {
          color = "red";
          shouldResetY = true;
        } else if (isPurple) {
          color = "purple";
        }

        table[row][col] = {
          value: `${col}-${currentY}`,
          color: color,
        };

        // Tăng y cho ô tiếp theo
        y++;

        // Chỉ reset y về 1 khi tô đỏ
        if (shouldResetY) {
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
        dateValues,
        deletedRows,
        purpleRangeFrom,
        purpleRangeTo,
        keepLastNRows
      );

      if (result.success) {
        // ⭐ Sync purple range sang tất cả Q1-Q10
        const syncPromises = [];
        for (let i = 1; i <= 10; i++) {
          const qId = `q${i}`;
          if (qId !== pageId) {
            const qResult = await loadPageData(qId);
            if (qResult.success && qResult.data) {
              syncPromises.push(
                savePageData(
                  qId,
                  qResult.data.t1Values,
                  qResult.data.t2Values,
                  dateValues,
                  deletedRows,
                  purpleRangeFrom, // ⭐ Sync purple range
                  purpleRangeTo, // ⭐ Sync purple range
                  keepLastNRows
                )
              );
            }
          }
        }

        await Promise.all(syncPromises);
        setSaveStatus("✅ Đã lưu và đồng bộ khoảng báo màu");
      } else {
        setSaveStatus("⚠️ Lỗi: " + result.error);
        setError(result.error);
      }

      setTimeout(() => setSaveStatus(""), 2000);
    }, 100);
  };

  // Save data without regenerating tables
  const handleSaveData = async () => {
    setSaveStatus("💾 Đang lưu...");

    // Save Q hiện tại
    const result = await savePageData(
      pageId,
      allTValues[0],
      allTValues[1],
      dateValues,
      deletedRows,
      purpleRangeFrom,
      purpleRangeTo,
      keepLastNRows
    );

    if (result.success) {
      // ⭐ Sync purple range sang tất cả Q1-Q10 (không sync T values)
      const syncPromises = [];
      for (let i = 1; i <= 10; i++) {
        const qId = `q${i}`;
        if (qId !== pageId) {
          // Load data của Q này
          const qResult = await loadPageData(qId);
          if (qResult.success && qResult.data) {
            // Chỉ update purple range, giữ nguyên T values của Q đó
            syncPromises.push(
              savePageData(
                qId,
                qResult.data.t1Values,
                qResult.data.t2Values,
                dateValues,
                deletedRows,
                purpleRangeFrom, // ⭐ Sync purple range từ Q hiện tại
                purpleRangeTo, // ⭐ Sync purple range từ Q hiện tại
                keepLastNRows
              )
            );
          }
        }
      }

      await Promise.all(syncPromises);
      setSaveStatus("✅ Đã lưu và đồng bộ khoảng báo màu");
    } else {
      setSaveStatus("⚠️ Lỗi: " + result.error);
      setError(result.error);
    }

    setTimeout(() => setSaveStatus(""), 2000);
  };

  // Handle click vào cell trong bảng dữ liệu - không làm gì
  const handleCellClick = (tableIndex, rowIndex, colIndex) => {
    // Không làm gì - chỉ double click mới highlight hàng
  };

  // Handle click vào cột T (Thông số) - highlight cả cột T
  const handleTColumnClick = (tableIndex) => {
    setHighlightedTColumns((prev) => {
      const newState = { ...prev };

      // Toggle highlight T column
      if (newState[tableIndex]) {
        delete newState[tableIndex];
      } else {
        newState[tableIndex] = true;
      }

      return newState;
    });
  };

  // Handle double click vào cell - bôi xanh cả hàng
  const handleCellDoubleClick = (tableIndex, rowIndex, colIndex) => {
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

  // Clear tất cả highlight (cột T và hàng) - KHÔNG xóa màu đỏ/tím của cells
  const clearColumnHighlights = () => {
    setHighlightedTColumns({}); // Xóa highlight cột T
    setHighlightedRows({}); // Xóa highlight hàng
  };

  // Navigate to input page
  const handleInputAllQ = () => {
    window.location.href = "/input";
  };

  const handleTValueChange = (tableIndex, rowIndex, value) => {
    const newAllTValues = [...allTValues];
    newAllTValues[tableIndex][rowIndex] = value;
    setAllTValues(newAllTValues);
  };

  // Add new row - show modal
  const handleAddRow = () => {
    setNewRowDate(""); // Reset date
    setNewRowT1(""); // Reset T1
    setNewRowT2(""); // Reset T2
    setShowAddRowModal(true);
  };

  // Confirm add row with selected date
  const confirmAddRow = async () => {
    if (!newRowDate) {
      alert("⚠️ Vui lòng chọn ngày!");
      return;
    }

    setIsAddingRow(true);

    // Find the last non-empty row
    let lastRowIndex = -1;
    for (let i = ROWS - 1; i >= 0; i--) {
      // Skip deleted rows
      if (deletedRows[i]) continue;

      // Check if row has data
      if (dateValues[i] || allTValues[0][i] || allTValues[1][i]) {
        lastRowIndex = i;
        break;
      }
    }

    const newRowIndex = lastRowIndex + 1;

    if (newRowIndex >= ROWS) {
      alert("⚠️ Đã đạt giới hạn số hàng!");
      setShowAddRowModal(false);
      return;
    }

    // Initialize new row with date
    const newDateValues = [...dateValues];
    const newAllTValues = [...allTValues];
    const newDeletedRows = [...deletedRows];

    // Set date and T values for new row
    newDateValues[newRowIndex] = newRowDate;
    newAllTValues[0][newRowIndex] = newRowT1; // T1
    newAllTValues[1][newRowIndex] = newRowT2; // T2
    newDeletedRows[newRowIndex] = false; // Đảm bảo dòng mới không bị đánh dấu deleted

    setDateValues(newDateValues);
    setAllTValues(newAllTValues);
    setDeletedRows(newDeletedRows);

    // Sync to all Q1-Q10
    setSaveStatus("💾 Đang đồng bộ...");
    const syncPromises = [];
    for (let i = 1; i <= 10; i++) {
      const qId = `q${i}`;
      const result = await loadPageData(qId);
      if (result.success && result.data) {
        // Update with new row
        const qTValues = [...result.data.t1Values];
        const qT2Values = [...result.data.t2Values];
        qTValues[newRowIndex] = newRowT1; // Use T1 from modal
        qT2Values[newRowIndex] = newRowT2; // Use T2 from modal

        syncPromises.push(
          savePageData(
            qId,
            qTValues,
            qT2Values,
            newDateValues,
            newDeletedRows, // Sync deletedRows mới
            purpleRangeFrom,
            purpleRangeTo,
            keepLastNRows
          )
        );
      }
    }

    await Promise.all(syncPromises);
    setSaveStatus("✅ Đã thêm hàng mới và đồng bộ");

    // Reset tất cả trạng thái "đã xem" khi thêm hàng mới
    resetViewedQs();

    setShowAddRowModal(false);
    setIsAddingRow(false);

    alert(`✅ Đã thêm hàng mới với ngày ${newRowDate}`);

    // Refresh trang để load lại effect
    window.location.reload();
  };

  // Keep last N rows - hide all rows except last N rows with data
  const handleKeepLastNRows = async () => {
    const n = parseInt(keepLastNRows);

    if (!n || n <= 0) {
      alert("⚠️ Vui lòng nhập số dòng hợp lệ (> 0)");
      return;
    }

    // if (n > ROWS) {
    //   alert(`⚠️ Số dòng không được vượt quá ${ROWS}`);
    //   return;
    // }

    // Find all NON-DELETED rows with data
    const nonDeletedRowsWithData = [];
    for (let i = 0; i < ROWS; i++) {
      // Chỉ xét các dòng CHƯA xóa
      if (
        !deletedRows[i] &&
        (dateValues[i] || allTValues[0][i] || allTValues[1][i])
      ) {
        nonDeletedRowsWithData.push(i);
      }
    }

    if (nonDeletedRowsWithData.length === 0) {
      alert("⚠️ Không có dòng nào có dữ liệu (chưa xóa)!");
      return;
    }

    // Keep only last N rows from non-deleted rows
    const rowsToKeep = nonDeletedRowsWithData.slice(-n);

    // Giữ nguyên deletedRows hiện tại, chỉ cập nhật các dòng chưa xóa
    const newDeletedRows = [...deletedRows];

    // Chỉ đánh dấu deleted cho các dòng CHƯA xóa mà không nằm trong rowsToKeep
    for (let i = 0; i < ROWS; i++) {
      // Chỉ tác động vào các dòng chưa xóa
      if (!deletedRows[i]) {
        // Nếu dòng này không nằm trong rowsToKeep thì đánh dấu xóa
        if (!rowsToKeep.includes(i)) {
          newDeletedRows[i] = true;
        }
      }
      // Các dòng đã xóa (deletedRows[i] = true) thì KHÔNG đụng vào
    }

    setDeletedRows(newDeletedRows);

    // Sync to all Q1-Q10
    setSaveStatus("💾 Đang đồng bộ...");
    const syncPromises = [];
    for (let i = 1; i <= 10; i++) {
      const qId = `q${i}`;
      const result = await loadPageData(qId);
      if (result.success && result.data) {
        syncPromises.push(
          savePageData(
            qId,
            result.data.t1Values,
            result.data.t2Values,
            dateValues,
            newDeletedRows,
            purpleRangeFrom,
            purpleRangeTo,
            keepLastNRows
          )
        );
      }
    }

    await Promise.all(syncPromises);
    setSaveStatus("✅ Đã giữ " + n + " dòng cuối và đồng bộ");
    setTimeout(() => setSaveStatus(""), 2000);

    alert(`✅ Đã xóa các dòng cũ, giữ lại ${n} dòng cuối cùng!`);
  };

  // Delete last visible row - XÓA THẬT SỰ khỏi DB
  const handleDeleteLastRow = async () => {
    // Tìm dòng cuối cùng (dòng không bị xóa cuối cùng)
    let lastRowIndex = -1;
    for (let i = ROWS - 1; i >= 0; i--) {
      if (!deletedRows[i]) {
        // Check if row has data
        if (dateValues[i] || allTValues[0][i] || allTValues[1][i]) {
          lastRowIndex = i;
          break;
        }
      }
    }

    if (lastRowIndex === -1) {
      alert("⚠️ Không có dòng nào để xóa!");
      setShowDeleteLastRowModal(false);
      return;
    }

    // XÓA THẬT SỰ: Xóa dòng khỏi arrays
    const newAllTValues = [...allTValues];
    const newDateValues = [...dateValues];
    const newDeletedRows = [...deletedRows];

    // Xóa phần tử tại index lastRowIndex
    newAllTValues[0].splice(lastRowIndex, 1);
    newAllTValues[1].splice(lastRowIndex, 1);
    newDateValues.splice(lastRowIndex, 1);
    newDeletedRows.splice(lastRowIndex, 1);

    // Thêm phần tử trống vào cuối để giữ đủ ROWS phần tử
    newAllTValues[0].push("");
    newAllTValues[1].push("");
    newDateValues.push("");
    newDeletedRows.push(false);

    setAllTValues(newAllTValues);
    setDateValues(newDateValues);
    setDeletedRows(newDeletedRows);

    // Sync to all Q1-Q10
    setSaveStatus("💾 Đang đồng bộ...");
    const syncPromises = [];
    for (let i = 1; i <= 10; i++) {
      const qId = `q${i}`;
      const result = await loadPageData(qId);
      if (result.success && result.data) {
        // Xóa dòng khỏi T1, T2 của Q này
        const qT1Values = [...result.data.t1Values];
        const qT2Values = [...result.data.t2Values];

        qT1Values.splice(lastRowIndex, 1);
        qT2Values.splice(lastRowIndex, 1);
        qT1Values.push("");
        qT2Values.push("");

        syncPromises.push(
          savePageData(
            qId,
            qT1Values,
            qT2Values,
            newDateValues,
            newDeletedRows,
            purpleRangeFrom,
            purpleRangeTo,
            keepLastNRows
          )
        );
      }
    }

    await Promise.all(syncPromises);
    setSaveStatus("✅ Đã xóa dòng cuối cùng và đồng bộ");
    setTimeout(() => setSaveStatus(""), 2000);

    setShowDeleteLastRowModal(false);
    alert(`✅ Đã xóa dòng mới nhất thành công!`);
  };

  const handleDeleteFirstRow = async () => {
    // Find first non-deleted row with data
    let firstRowIndex = -1;
    for (let i = 0; i < ROWS; i++) {
      // Skip deleted rows
      if (deletedRows[i]) continue;

      // Check if row has data
      if (dateValues[i] || allTValues[0][i] || allTValues[1][i]) {
        firstRowIndex = i;
        break;
      }
    }

    if (firstRowIndex === -1) {
      alert("⚠️ Không có dòng nào để xóa!");
      setShowDeleteFirstRowModal(false);
      return;
    }

    // Mark first row as deleted
    const newDeletedRows = [...deletedRows];
    newDeletedRows[firstRowIndex] = true;
    setDeletedRows(newDeletedRows);

    // Sync to all Q1-Q10
    setSaveStatus("💾 Đang đồng bộ...");
    const syncPromises = [];
    for (let i = 1; i <= 10; i++) {
      const qId = `q${i}`;
      const result = await loadPageData(qId);
      if (result.success && result.data) {
        syncPromises.push(
          savePageData(
            qId,
            result.data.t1Values,
            result.data.t2Values,
            dateValues,
            newDeletedRows,
            purpleRangeFrom,
            purpleRangeTo,
            keepLastNRows
          )
        );
      }
    }

    await Promise.all(syncPromises);
    setSaveStatus("✅ Đã xóa dòng đầu tiên và đồng bộ");
    setTimeout(() => setSaveStatus(""), 2000);

    setShowDeleteFirstRowModal(false);
    alert(`✅ Đã xóa dòng đầu tiên!`);
  };

  const clearData = () => {
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    // Hiện modal xác nhận tương ứng với option đã chọn
    if (deleteOption === "all") {
      setShowDeleteModal(false);
      setShowDeleteAllModal(true);
    } else if (deleteOption === "firstRow") {
      setShowDeleteModal(false);
      setShowDeleteFirstRowModal(true);
    } else if (deleteOption === "lastRow") {
      setShowDeleteModal(false);
      setShowDeleteLastRowModal(true);
    } else if (deleteOption === "dates") {
      if (!deleteDateFrom || !deleteDateTo) {
        alert("⚠️ Vui lòng nhập đầy đủ ngày!");
        return;
      }
      setShowDeleteModal(false);
      setShowDeleteByDatesModal(true);
    }
  };

  const confirmDeleteAll = async () => {
    try {
      // Xóa tất cả Q1-Q10
      const deletePromises = [];
      for (let i = 1; i <= 10; i++) {
        deletePromises.push(deletePageData(`q${i}`));
      }

      await Promise.all(deletePromises);

      // Xóa localStorage để tránh migrate lại data cũ
      localStorage.clear();

      setAllTValues(
        Array(TOTAL_TABLES)
          .fill(null)
          .map(() => Array(ROWS).fill(""))
      );
      setDateValues(Array(ROWS).fill(""));
      setDeletedRows(Array(ROWS).fill(false));
      setAllTableData(
        Array(TOTAL_TABLES)
          .fill(null)
          .map(() => [])
      );
      setIsDataLoaded(false);

      setShowDeleteAllModal(false);
      alert("✅ Đã xóa tất cả dữ liệu Q1-Q10!");

      // Reset form
      setDeleteOption("all");
      setDeleteDateFrom("");
      setDeleteDateTo("");
    } catch (error) {
      alert("⚠️ Lỗi: " + error.message);
    }
  };

  const confirmDeleteByDates = async () => {
    try {
      const newDeletedRows = [...deletedRows];
      let deletedCount = 0;

      // Đánh dấu deleted cho các dòng trong khoảng ngày
      for (let i = 0; i < ROWS; i++) {
        const dateStr = dateValues[i];
        const shouldDelete =
          dateStr && dateStr >= deleteDateFrom && dateStr <= deleteDateTo;

        if (shouldDelete) {
          newDeletedRows[i] = true;
          deletedCount++;
        }
      }

      setDeletedRows(newDeletedRows);

      // Lưu Q hiện tại
      setSaveStatus("💾 Đang lưu...");
      const result = await savePageData(
        pageId,
        allTValues[0],
        allTValues[1],
        dateValues,
        newDeletedRows,
        purpleRangeFrom,
        purpleRangeTo,
        keepLastNRows
      );

      // Sync deletedRows sang Q1-Q10
      for (let i = 1; i <= 10; i++) {
        const qId = `q${i}`;
        if (qId !== pageId) {
          const qResult = await loadPageData(qId);
          if (qResult.success && qResult.data) {
            await savePageData(
              qId,
              qResult.data.t1Values,
              qResult.data.t2Values,
              dateValues,
              newDeletedRows,
              purpleRangeFrom,
              purpleRangeTo,
              keepLastNRows
            );
          }
        }
      }

      if (result.success) {
        setSaveStatus("✅ Đã lưu dữ liệu thành công");
        alert(
          `✅ Đã xóa ${deletedCount} dòng từ ${deleteDateFrom} đến ${deleteDateTo} (đồng bộ Q1-Q10)!`
        );
      } else {
        setSaveStatus("⚠️ Lỗi: " + result.error);
      }

      setTimeout(() => setSaveStatus(""), 2000);
      setShowDeleteByDatesModal(false);

      // Reset form
      setDeleteOption("all");
      setDeleteDateFrom("");
      setDeleteDateTo("");
    } catch (error) {
      alert("⚠️ Lỗi: " + error.message);
    }
  };

  // Handle save purple range settings
  const handleSavePurpleRange = async () => {
    try {
      // Validate input
      const from = parseInt(tempPurpleRangeFrom) || 0;
      const to = parseInt(tempPurpleRangeTo) || 0;

      if (from < 0 || to < 0) {
        alert("⚠️ Giá trị phải lớn hơn hoặc bằng 0!");
        return;
      }

      if (from > to) {
        alert("⚠️ Giá trị 'Từ' phải nhỏ hơn hoặc bằng 'Đến'!");
        return;
      }

      // Set loading state
      setIsSavingPurpleRange(true);

      // Update state
      setPurpleRangeFrom(from);
      setPurpleRangeTo(to);

      // Sync to all Q1-Q10
      setSaveStatus("💾 Đang đồng bộ...");
      const syncPromises = [];
      for (let i = 1; i <= 10; i++) {
        const qId = `q${i}`;
        const result = await loadPageData(qId);
        if (result.success && result.data) {
          syncPromises.push(
            savePageData(
              qId,
              result.data.t1Values,
              result.data.t2Values,
              result.data.dateValues || dateValues,
              result.data.deletedRows || deletedRows,
              from,
              to,
              result.data.keepLastNRows || keepLastNRows
            )
          );
        }
      }

      await Promise.all(syncPromises);
      setSaveStatus("✅ Đã lưu cài đặt báo màu");
      setTimeout(() => setSaveStatus(""), 2000);

      // Close modal
      setShowPurpleRangeModal(false);
      alert(`✅ Đã lưu khoảng báo màu: ${from} - ${to}`);
    } catch (error) {
      console.error("Error saving purple range:", error);
      alert("⚠️ Lỗi khi lưu cài đặt: " + error.message);
      setSaveStatus("⚠️ Lỗi khi lưu");
      setTimeout(() => setSaveStatus(""), 2000);
    } finally {
      setIsSavingPurpleRange(false);
    }
  };

  // Handle save keep last N rows settings
  const handleSaveKeepLastNRows = async () => {
    try {
      // Validate input
      const n = parseInt(tempKeepLastNRows);

      if (!n || n <= 0) {
        alert("⚠️ Vui lòng nhập số dòng hợp lệ (lớn hơn 0)!");
        return;
      }

      if (n > ROWS) {
        alert(`⚠️ Số dòng không được vượt quá ${ROWS}!`);
        return;
      }

      // Set loading state
      setIsSavingKeepLastNRows(true);

      // Update state
      setKeepLastNRows(n);

      // Sync to all Q1-Q10
      setSaveStatus("💾 Đang đồng bộ...");
      const syncPromises = [];
      for (let i = 1; i <= 10; i++) {
        const qId = `q${i}`;
        const result = await loadPageData(qId);
        if (result.success && result.data) {
          syncPromises.push(
            savePageData(
              qId,
              result.data.t1Values,
              result.data.t2Values,
              result.data.dateValues || dateValues,
              result.data.deletedRows || deletedRows,
              result.data.purpleRangeFrom || purpleRangeFrom,
              result.data.purpleRangeTo || purpleRangeTo,
              n
            )
          );
        }
      }

      await Promise.all(syncPromises);
      setSaveStatus("✅ Đã lưu cài đặt dòng tồn tại");
      setTimeout(() => setSaveStatus(""), 2000);

      // Close modal
      setShowKeepLastNRowsSettingsModal(false);
      alert(`✅ Đã lưu cài đặt: ${n} dòng tồn tại`);
    } catch (error) {
      console.error("Error saving keep last N rows:", error);
      alert("⚠️ Lỗi khi lưu cài đặt: " + error.message);
      setSaveStatus("⚠️ Lỗi khi lưu");
      setTimeout(() => setSaveStatus(""), 2000);
    } finally {
      setIsSavingKeepLastNRows(false);
    }
  };

  return (
    <div className="app-container-full">
      {/* PMA Title */}
      <div
        style={{
          width: "100%",
          textAlign: "center",
          backgroundColor: "#f8f9fa",
          borderBottom: "2px solid #dee2e6",
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
          Dự án cải tạo môi trường thềm lục địa biển Việt Nam -
          <span
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: "#333",
              fontStyle: "italic",
              marginLeft: "8px",
            }}
          >
            Chủ nhiệm: Mai Kiên - SĐT: 0964636709, email:
            maikien06091966@gmail.com
          </span>
        </h1>
      </div>
      {/* Top Toolbar - Chứa tất cả controls */}
      <div className="top-toolbar">
        <div className="toolbar-section">
          {/* Action Buttons */}
          <div
            className="toolbar-group"
            style={{
              border: "3px solid #28a745",
              borderRadius: "8px",
              padding: "10px 15px",
              backgroundColor: "#e8f5e9",
            }}
          >
            {/* <button
              onClick={handleAddRow}
              className="toolbar-button success"
              style={{ marginLeft: "10px", marginRight: "18px" }}
            >
              ➕ Thêm
            </button> */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="toolbar-button danger"
            >
              🗑️ Xóa dữ liệu
            </button>
            <button onClick={clearColumnHighlights} className="toolbar-button">
              🔄 X màu d.c
            </button>
            <button onClick={handleSaveData} className="toolbar-button success">
              💾 Lưu dữ liệu
            </button>

            <button
              onClick={handleInputAllQ}
              className="toolbar-button primary"
            >
              📥 Nhập liệu
            </button>
          </div>

          {/* Báo màu Control */}
          <div
            className="toolbar-group"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "3px solid #007bff",
              borderRadius: "8px",
              padding: "10px 12px",
              backgroundColor: "#e7f3ff",
            }}
          >
            <label style={{ fontSize: "25px", fontWeight: "bold" }}>
              Báo màu:
            </label>
            <span
              style={{
                fontSize: "25px",
                fontWeight: "600",
                color: "#333",
                padding: "6px 12px",
                backgroundColor: "#fff",
                border: "2px solid #ffc107",
                borderRadius: "4px",
                minWidth: "120px",
                textAlign: "center",
              }}
            >
              {purpleRangeFrom || 0} - {purpleRangeTo || 0}
            </span>
            <button
              onClick={() => {
                setTempPurpleRangeFrom(purpleRangeFrom);
                setTempPurpleRangeTo(purpleRangeTo);
                setShowPurpleRangeModal(true);
              }}
              className="toolbar-button"
              style={{
                fontSize: "20px",
                padding: "6px 12px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              title="Cài đặt khoảng báo màu"
            >
              ⚙️
            </button>
          </div>

          {/* Dòng tồn tại Control */}
          <div
            className="toolbar-group"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "3px solid #007bff",
              borderRadius: "8px",
              padding: "10px 15px",
              backgroundColor: "#e7f3ff",
            }}
          >
            <label style={{ fontSize: "25px", fontWeight: "bold" }}>
              📊 Dòng tồn tại:
            </label>
            <span
              style={{
                fontSize: "25px",
                fontWeight: "600",
                color: "#333",
                padding: "6px 12px",
                backgroundColor: "#fff",
                border: "2px solid #007bff",
                borderRadius: "4px",
                minWidth: "80px",
                textAlign: "center",
              }}
            >
              {keepLastNRows || 0}
            </span>
            <button
              onClick={() => {
                setTempKeepLastNRows(keepLastNRows);
                setShowKeepLastNRowsSettingsModal(true);
              }}
              className="toolbar-button"
              style={{
                fontSize: "20px",
                padding: "6px 12px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              title="Cài đặt số dòng tồn tại"
            >
              ⚙️
            </button>
          </div>

          {/* Q Navigation Buttons */}
          <div
            className="toolbar-group"
            style={{ display: "flex", gap: "8px", alignItems: "center" }}
          >
            <label style={{ fontSize: "35px", fontWeight: "bold" }}>Q:</label>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
              const qId = `q${num}`;
              const hasPurple = qPurpleInfo[qId]?.hasPurple;
              const range = qPurpleInfo[qId]?.range;
              const isActive = pageId === qId;
              const isViewed = viewedQs[qId];

              // Xác định màu background
              let bgColor = "transparent"; // Mặc định: trắng (không báo màu)
              if (hasPurple && !isViewed) {
                bgColor = "#ff9800"; // cam: có báo màu mới (chưa xem)
              } else if (hasPurple && isViewed) {
                bgColor = "#f8c507bd"; // vàng: báo màu đã xem
              }

              // Nếu đang active, ưu tiên màu xanh
              if (isActive) {
                bgColor = "#4a90e2";
              }

              return (
                <button
                  key={num}
                  onClick={() => {
                    window.location.pathname = `/${qId}`;
                  }}
                  className="toolbar-button"
                  style={{
                    backgroundColor: bgColor,
                    color: isActive ? "white" : hasPurple ? "#333" : "#555",
                    fontWeight: isActive || hasPurple ? "bold" : "normal",
                    border: isActive
                      ? "2px solid #357abd"
                      : "1px solid #d0d0d0",
                    padding: "6px 12px",
                    fontSize: "30px",
                    minWidth: "50px",
                  }}
                  title={
                    hasPurple
                      ? isViewed
                        ? `Đã xem - Báo màu: ${range}`
                        : `Mới - Báo màu: ${range}`
                      : `Chuyển đến Q${num}`
                  }
                >
                  Q{num}
                  {hasPurple && !isViewed
                    ? " BM"
                    : hasPurple && isViewed
                    ? " ĐX"
                    : ""}
                </button>
              );
            })}
          </div>
          {/* Go To Table */}
          <div
            className="toolbar-group"
            style={{
              marginLeft: "12px",
              border: "3px solid #28a745",
              borderRadius: "8px",
              padding: "10px 15px",
              backgroundColor: "#e8f5e9",
            }}
          >
            <label style={{ fontSize: "18px", fontWeight: "bold" }}>
              Đi đến Thông:
            </label>
            <input
              type="number"
              value={goToTableNumber}
              onChange={(e) => setGoToTableNumber(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleGoToTable();
                }
              }}
              min="1"
              max={TOTAL_TABLES}
              style={{
                width: "80px",
                padding: "8px",
                fontSize: "18px",
                border: "2px solid #28a745",
                borderRadius: "4px",
                textAlign: "center",
              }}
            />
            <button
              onClick={handleGoToTable}
              className="toolbar-button primary"
              style={{ fontSize: "18px", padding: "8px 16px" }}
            >
              ➡️ Đến
            </button>
          </div>
          {/* Purple Cells Info Display */}
          {allTableData.length > 0 && (
            <div
              style={{
                marginLeft: "12px",
                padding: "8px 16px",
                backgroundColor: "#fff3cd",
                border: "2px solid #ffc107",
                borderRadius: "6px",
                fontSize: "30px",
                fontWeight: "bold",
                maxWidth: "1100px",
                overflow: "auto",
                whiteSpace: "nowrap",
              }}
              title="Các ô đang được báo màu vàng trong Q này"
            >
              📍 MQ{pageId.replace("q", "")}: {formatPurpleCellsInfo()}
            </div>
          )}

          {/* Status Messages */}
          <div className="toolbar-group">
            {isLoading && (
              <span className="status-loading">⏳ Đang tải...</span>
            )}
            {!isLoading && saveStatus && (
              <span className="status-success">{saveStatus}</span>
            )}
            {error && <span className="status-error">{error}</span>}
          </div>
        </div>
      </div>

      {/* Main Content - Tables */}
      <div className="main-content">
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
              <div
                className="data-grid-wrapper"
                ref={(el) => (tableRefs.current[tableIndex] = el)}
                onScroll={(e) => handleSyncScroll(e, tableIndex)}
              >
                {tableData.length > 0 ? (
                  <table className="data-grid">
                    <thead>
                      <tr>
                        <th colSpan="3" className="group-header">
                          Thông tin
                        </th>
                        <th colSpan="1" className="group-header">
                          {/* Thông {tableIndex + 1} */}
                          Thông
                        </th>
                        <th colSpan="10" className="group-header">
                          Tham số: áp suất nước-nhiệt độ- độ ph- tỷ phần sinh
                          hóa- mùa- f sinh học
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
                      {(() => {
                        let displayRowNumber = 0;
                        return tableData.map((row, rowIndex) => {
                          // Skip deleted rows
                          if (deletedRows[rowIndex]) return null;

                          displayRowNumber++;
                          return (
                            <tr key={rowIndex}>
                              <td className="data-cell fixed">
                                {String(displayRowNumber).padStart(3, "0")}
                              </td>
                              <td
                                className="data-cell fixed date-col"
                                colSpan="2"
                              >
                                <input
                                  type="date"
                                  className="date-input"
                                  value={dateValues[rowIndex] || ""}
                                  onChange={async (e) => {
                                    const newDateValues = [...dateValues];
                                    newDateValues[rowIndex] = e.target.value;
                                    setDateValues(newDateValues);

                                    // Sync sang tất cả Q1-Q10
                                    const syncPromises = [];
                                    for (let i = 1; i <= 10; i++) {
                                      const qId = `q${i}`;
                                      // Load data hiện tại của Q này
                                      const result = await loadPageData(qId);
                                      if (result.success && result.data) {
                                        // Update dateValues và save lại
                                        syncPromises.push(
                                          savePageData(
                                            qId,
                                            result.data.t1Values,
                                            result.data.t2Values,
                                            newDateValues,
                                            result.data.deletedRows || [],
                                            purpleRangeFrom,
                                            purpleRangeTo,
                                            keepLastNRows
                                          )
                                        );
                                      }
                                    }
                                    await Promise.all(syncPromises);
                                  }}
                                  style={{
                                    width: "100%",
                                    border: "none",
                                    background: "transparent",
                                    fontSize: "20px",
                                    padding: "4px",
                                  }}
                                />
                              </td>
                              <td
                                className={`data-cell fixed value-col ${
                                  highlightedTColumns[tableIndex]
                                    ? "highlighted-column"
                                    : ""
                                } ${
                                  highlightedRows[tableIndex]?.[rowIndex]
                                    ? "highlighted-row"
                                    : ""
                                }`}
                                onClick={() => handleTColumnClick(tableIndex)}
                                onDoubleClick={() =>
                                  handleCellDoubleClick(
                                    tableIndex,
                                    rowIndex,
                                    -1
                                  )
                                }
                              >
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
                                const isRowHighlighted =
                                  highlightedRows[tableIndex]?.[rowIndex];

                                return (
                                  <td
                                    key={colIndex}
                                    className={`data-cell ${cell.color} ${
                                      isRowHighlighted ? "highlighted-row" : ""
                                    }`}
                                    onClick={() =>
                                      handleCellClick(
                                        tableIndex,
                                        rowIndex,
                                        colIndex
                                      )
                                    }
                                    onDoubleClick={() =>
                                      handleCellDoubleClick(
                                        tableIndex,
                                        rowIndex,
                                        colIndex
                                      )
                                    }
                                  >
                                    {cell.value}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        });
                      })()}
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
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px", width: "90%" }}
          >
            <h3 style={{ fontSize: "24px" }}>Xóa dữ liệu</h3>

            <div className="modal-body">
              <div className="radio-group">
                <label
                  style={{
                    fontSize: "35px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <input
                    type="radio"
                    value="all"
                    checked={deleteOption === "all"}
                    onChange={(e) => setDeleteOption(e.target.value)}
                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                  />
                  Xóa tất cả dữ liệu
                </label>

                <label
                  style={{
                    fontSize: "35px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <input
                    type="radio"
                    value="firstRow"
                    checked={deleteOption === "firstRow"}
                    onChange={(e) => setDeleteOption(e.target.value)}
                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                  />
                  Xóa dòng cũ nhất
                </label>

                <label
                  style={{
                    fontSize: "35px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <input
                    type="radio"
                    value="lastRow"
                    checked={deleteOption === "lastRow"}
                    onChange={(e) => setDeleteOption(e.target.value)}
                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                  />
                  Xóa dòng mới nhất
                </label>

                {/* <label
                  style={{
                    fontSize: "35px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <input
                    type="radio"
                    value="dates"
                    checked={deleteOption === "dates"}
                    onChange={(e) => setDeleteOption(e.target.value)}
                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                  />
                  Xóa theo khoảng ngày
                </label> */}

                {deleteOption === "dates" && (
                  <div
                    className="input-row"
                    style={{
                      marginTop: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <input
                      type="date"
                      value={deleteDateFrom}
                      onChange={(e) => setDeleteDateFrom(e.target.value)}
                      style={{
                        padding: "12px",
                        fontSize: "18px",
                        border: "2px solid #ddd",
                        borderRadius: "6px",
                        flex: 1,
                      }}
                    />
                    <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                      đến
                    </span>
                    <input
                      type="date"
                      value={deleteDateTo}
                      onChange={(e) => setDeleteDateTo(e.target.value)}
                      style={{
                        padding: "12px",
                        fontSize: "18px",
                        border: "2px solid #ddd",
                        borderRadius: "6px",
                        flex: 1,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteModal(false)}
                style={{ fontSize: "18px", padding: "12px 24px" }}
              >
                Hủy
              </button>
              <button
                className="btn-delete"
                onClick={handleDelete}
                style={{ fontSize: "18px", padding: "12px 24px" }}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Row Modal */}
      {showAddRowModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ maxWidth: "600px", width: "90%" }}
          >
            <div className="modal-header">
              <h3 style={{ fontSize: "24px" }}>➕ Thêm hàng mới</h3>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Chọn ngày (ngày/tháng/năm):
                </label>
                <input
                  type="date"
                  value={newRowDate}
                  onChange={(e) => setNewRowDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "18px",
                    border: "2px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
              </div>

              <div className="form-group" style={{ marginTop: "20px" }}>
                <label
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  T1 (không bắt buộc):
                </label>
                <input
                  type="text"
                  value={newRowT1}
                  onChange={(e) => setNewRowT1(e.target.value)}
                  placeholder="Nhập T1"
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "18px",
                    border: "2px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
              </div>

              <div className="form-group" style={{ marginTop: "20px" }}>
                <label
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  T2 (không bắt buộc):
                </label>
                <input
                  type="text"
                  value={newRowT2}
                  onChange={(e) => setNewRowT2(e.target.value)}
                  placeholder="Nhập T2"
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "18px",
                    border: "2px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowAddRowModal(false)}
                style={{ fontSize: "18px", padding: "12px 24px" }}
              >
                Hủy
              </button>
              <button
                className="btn-delete"
                onClick={confirmAddRow}
                disabled={isAddingRow}
                style={{
                  background: isAddingRow ? "#6c757d" : "#28a745",
                  fontSize: "18px",
                  padding: "12px 24px",
                  cursor: isAddingRow ? "not-allowed" : "pointer",
                  opacity: isAddingRow ? 0.7 : 1,
                }}
              >
                {isAddingRow ? "Đang thêm..." : "Thêm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete First Row Confirmation Modal */}
      {showDeleteFirstRowModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>⚠️ Xác nhận xóa dòng</h3>
            </div>

            <div className="modal-body">
              <p
                style={{
                  fontSize: "18px",
                  textAlign: "center",
                  margin: "20px 0",
                }}
              >
                Bạn có chắc chắn muốn xóa dòng đầu tiên hiện tại không?
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteFirstRowModal(false)}
              >
                Hủy
              </button>
              <button className="btn-delete" onClick={handleDeleteFirstRow}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Last Row Confirmation Modal */}
      {showDeleteLastRowModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>⚠️ Xác nhận xóa dòng</h3>
            </div>

            <div className="modal-body">
              <p
                style={{
                  fontSize: "18px",
                  textAlign: "center",
                  margin: "20px 0",
                }}
              >
                Bạn có chắc chắn muốn xóa dòng cuối cùng (dòng mới nhất) hiện
                tại không?
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteLastRowModal(false)}
              >
                Hủy
              </button>
              <button className="btn-delete" onClick={handleDeleteLastRow}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keep Last N Rows Confirmation Modal */}
      {showKeepLastNRowsModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "24px" }}>⚠️ Xác nhận</h3>
            </div>

            <div className="modal-body">
              <p
                style={{
                  fontSize: "18px",
                  textAlign: "center",
                  margin: "20px 0",
                }}
              >
                Bạn có chắc chắn muốn chỉ giữ lại{" "}
                <strong>{keepLastNRows}</strong> dòng cuối cùng?
                <br />
                <br />
                Tất cả các dòng khác sẽ bị xóa!
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowKeepLastNRowsModal(false)}
                style={{ fontSize: "18px", padding: "12px 24px" }}
              >
                Hủy
              </button>
              <button
                className="btn-delete"
                onClick={() => {
                  handleKeepLastNRows();
                  setShowKeepLastNRowsModal(false);
                  setShowSettingsModal(false);
                }}
                style={{ fontSize: "18px", padding: "12px 24px" }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "24px" }}>⚠️ Xác nhận xóa tất cả</h3>
            </div>

            <div className="modal-body">
              <p
                style={{
                  fontSize: "18px",
                  textAlign: "center",
                  margin: "20px 0",
                }}
              >
                Bạn có chắc chắn muốn xóa <strong>TẤT CẢ</strong> dữ liệu
                Q1-Q10?
                <br />
                <br />
                <span style={{ color: "#dc3545", fontWeight: "bold" }}>
                  Hành động này không thể hoàn tác!
                </span>
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteAllModal(false)}
                style={{ fontSize: "18px", padding: "12px 24px" }}
              >
                Hủy
              </button>
              <button
                className="btn-delete"
                onClick={confirmDeleteAll}
                style={{ fontSize: "18px", padding: "12px 24px" }}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete By Dates Confirmation Modal */}
      {showDeleteByDatesModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "24px" }}>⚠️ Xác nhận xóa theo ngày</h3>
            </div>

            <div className="modal-body">
              <p
                style={{
                  fontSize: "18px",
                  textAlign: "center",
                  margin: "20px 0",
                }}
              >
                Bạn có chắc chắn muốn xóa các dòng từ:
                <br />
                <br />
                <strong style={{ fontSize: "20px", color: "#dc3545" }}>
                  {deleteDateFrom} đến {deleteDateTo}
                </strong>
                <br />
                <br />
                Dữ liệu sẽ được đồng bộ xóa trên tất cả Q1-Q10!
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteByDatesModal(false)}
                style={{ fontSize: "18px", padding: "12px 24px" }}
              >
                Hủy
              </button>
              <button
                className="btn-delete"
                onClick={confirmDeleteByDates}
                style={{ fontSize: "18px", padding: "12px 24px" }}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purple Range Settings Modal */}
      {showPurpleRangeModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowPurpleRangeModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px", width: "90%" }}
          >
            <div className="modal-header">
              <h3 style={{ fontSize: "35px" }}>⚙️ Cài đặt khoảng báo màu</h3>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label
                  style={{
                    fontSize: "35px",
                    fontWeight: "bold",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Từ:
                </label>
                <input
                  type="number"
                  value={tempPurpleRangeFrom}
                  onChange={(e) => setTempPurpleRangeFrom(e.target.value)}
                  placeholder="Nhập giá trị từ"
                  min="0"
                  disabled={isSavingPurpleRange}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "35px",
                    border: "2px solid #ffc107",
                    borderRadius: "6px",
                    textAlign: "center",
                    cursor: isSavingPurpleRange ? "not-allowed" : "text",
                    opacity: isSavingPurpleRange ? 0.6 : 1,
                  }}
                />
              </div>

              <div className="form-group" style={{ marginTop: "20px" }}>
                <label
                  style={{
                    fontSize: "35px",
                    fontWeight: "bold",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Đến:
                </label>
                <input
                  type="number"
                  value={tempPurpleRangeTo}
                  onChange={(e) => setTempPurpleRangeTo(e.target.value)}
                  placeholder="Nhập giá trị đến"
                  min="0"
                  disabled={isSavingPurpleRange}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "35px",
                    border: "2px solid #ffc107",
                    borderRadius: "6px",
                    textAlign: "center",
                    cursor: isSavingPurpleRange ? "not-allowed" : "text",
                    opacity: isSavingPurpleRange ? 0.6 : 1,
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: "20px",
                  padding: "12px",
                  backgroundColor: "#fff3cd",
                  border: "1px solid #ffc107",
                  borderRadius: "6px",
                  fontSize: "16px",
                  color: "#856404",
                }}
              >
                💡 <strong>Lưu ý:</strong> Các ô có giá trị trong khoảng này sẽ
                được tô màu vàng để báo hiệu.
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowPurpleRangeModal(false)}
                disabled={isSavingPurpleRange}
                style={{
                  fontSize: "18px",
                  padding: "12px 24px",
                  cursor: isSavingPurpleRange ? "not-allowed" : "pointer",
                  opacity: isSavingPurpleRange ? 0.6 : 1,
                }}
              >
                Hủy
              </button>
              <button
                className="btn-delete"
                onClick={handleSavePurpleRange}
                disabled={isSavingPurpleRange}
                style={{
                  fontSize: "18px",
                  padding: "12px 24px",
                  backgroundColor: isSavingPurpleRange ? "#6c757d" : "#28a745",
                  cursor: isSavingPurpleRange ? "not-allowed" : "pointer",
                  opacity: isSavingPurpleRange ? 0.7 : 1,
                }}
              >
                {isSavingPurpleRange ? "⏳ Đang lưu..." : "💾 Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keep Last N Rows Settings Modal */}
      {showKeepLastNRowsSettingsModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowKeepLastNRowsSettingsModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px", width: "90%" }}
          >
            <div className="modal-header">
              <h3 style={{ fontSize: "35px" }}>⚙️ Cài đặt số dòng tồn tại</h3>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label
                  style={{
                    fontSize: "35px",
                    fontWeight: "bold",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Số dòng:
                </label>
                <input
                  type="number"
                  value={tempKeepLastNRows}
                  onChange={(e) => setTempKeepLastNRows(e.target.value)}
                  placeholder="Nhập số dòng tồn tại"
                  min="1"
                  max={ROWS}
                  disabled={isSavingKeepLastNRows}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "35px",
                    border: "2px solid #007bff",
                    borderRadius: "6px",
                    textAlign: "center",
                    cursor: isSavingKeepLastNRows ? "not-allowed" : "text",
                    opacity: isSavingKeepLastNRows ? 0.6 : 1,
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: "20px",
                  padding: "12px",
                  backgroundColor: "#d1ecf1",
                  border: "1px solid #007bff",
                  borderRadius: "6px",
                  fontSize: "16px",
                  color: "#0c5460",
                }}
              >
                💡 <strong>Lưu ý:</strong> Đây là số dòng tối đa được lưu trữ
                trong hệ thống.
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowKeepLastNRowsSettingsModal(false)}
                disabled={isSavingKeepLastNRows}
                style={{
                  fontSize: "18px",
                  padding: "12px 24px",
                  cursor: isSavingKeepLastNRows ? "not-allowed" : "pointer",
                  opacity: isSavingKeepLastNRows ? 0.6 : 1,
                }}
              >
                Hủy
              </button>
              <button
                className="btn-delete"
                onClick={handleSaveKeepLastNRows}
                disabled={isSavingKeepLastNRows}
                style={{
                  fontSize: "18px",
                  padding: "12px 24px",
                  backgroundColor: isSavingKeepLastNRows
                    ? "#6c757d"
                    : "#28a745",
                  cursor: isSavingKeepLastNRows ? "not-allowed" : "pointer",
                  opacity: isSavingKeepLastNRows ? 0.7 : 1,
                }}
              >
                {isSavingKeepLastNRows ? "⏳ Đang lưu..." : "💾 Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
