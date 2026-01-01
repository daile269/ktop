import { db } from './firebase';
import { ref, set, get, remove } from 'firebase/database';

/**
 * Lưu dữ liệu trang lên Realtime Database
 * @param {string} pageId - ID của trang (vd: 'q1', 'q2')
 * @param {Array} t1Values - Mảng giá trị T1
 * @param {Array} t2Values - Mảng giá trị T2
 * @param {Array} dateValues - Mảng giá trị ngày tháng
 * @param {Array} deletedRows - Mảng đánh dấu rows bị xóa
 * @param {number} purpleRangeFrom - Khoảng số bắt đầu tô tím
 * @param {number} purpleRangeTo - Khoảng số kết thúc tô tím
 * @param {number} keepLastNRows - Số dòng tồn tại
 */
export const savePageData = async (pageId, t1Values, t2Values, dateValues, deletedRows = [], purpleRangeFrom = 0, purpleRangeTo = 0, keepLastNRows = 366) => {
  try {
    const pageRef = ref(db, `pages/${pageId}`);
    
    // Tìm index cuối cùng có data
    let lastIndex = -1;
    for (let i = t1Values.length - 1; i >= 0; i--) {
      if (t1Values[i] || t2Values[i] || dateValues[i]) {
        lastIndex = i;
        break;
      }
    }
    
    // Chỉ lưu data đến lastIndex (trim empty values ở cuối)
    const trimmedT1 = lastIndex >= 0 ? t1Values.slice(0, lastIndex + 1) : [];
    const trimmedT2 = lastIndex >= 0 ? t2Values.slice(0, lastIndex + 1) : [];
    const trimmedDates = lastIndex >= 0 ? dateValues.slice(0, lastIndex + 1) : [];
    const trimmedDeleted = lastIndex >= 0 ? deletedRows.slice(0, lastIndex + 1) : [];
    
    await set(pageRef, {
      pageId,
      t1Values: trimmedT1,
      t2Values: trimmedT2,
      dateValues: trimmedDates,
      deletedRows: trimmedDeleted,
      purpleRangeFrom,  // Lưu purple range
      purpleRangeTo,
      keepLastNRows,    // Lưu số dòng tồn tại
      updatedAt: new Date().toISOString()
    });
    

    return { success: true };
  } catch (error) {
    console.error('Lỗi khi lưu dữ liệu:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Tải dữ liệu trang từ Realtime Database
 * @param {string} pageId - ID của trang
 */
export const loadPageData = async (pageId) => {
  try {
    const pageRef = ref(db, `pages/${pageId}`);
    const snapshot = await get(pageRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      
      // Pad data về 300 rows
      const ROWS = 300;
      const t1 = data.t1Values || [];
      const t2 = data.t2Values || [];
      const dates = data.dateValues || [];
      const deleted = data.deletedRows || [];
      
      // Pad với empty strings/false
      while (t1.length < ROWS) t1.push('');
      while (t2.length < ROWS) t2.push('');
      while (dates.length < ROWS) dates.push('');
      while (deleted.length < ROWS) deleted.push(false);

      return { 
        success: true, 
        data: {
          t1Values: t1,
          t2Values: t2,
          dateValues: dates,
          deletedRows: deleted,
          purpleRangeFrom: data.purpleRangeFrom || 0,  // Load purple range
          purpleRangeTo: data.purpleRangeTo || 0,
          keepLastNRows: data.keepLastNRows || 366     // Load số dòng tồn tại
        }
      };
    } else {

      return { success: true, data: null };
    }
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Xóa dữ liệu trang từ Realtime Database
 * @param {string} pageId - ID của trang
 */
export const deletePageData = async (pageId) => {
  try {
    const pageRef = ref(db, `pages/${pageId}`);
    await remove(pageRef);
    

    return { success: true };
  } catch (error) {
    console.error('Lỗi khi xóa dữ liệu:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Migration từ localStorage sang Realtime Database (nếu cần)
 * @param {string} pageId - ID của trang
 */
export const migrateFromLocalStorage = async (pageId) => {
  try {
    const savedData = localStorage.getItem('tableData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (parsed.allTValues && parsed.allTValues.length >= 2) {
        // Lấy T1, T2 và dateValues
        const t1Values = parsed.allTValues[0];
        const t2Values = parsed.allTValues[1];
        const dateValues = parsed.dateValues || [];
        
        await savePageData(pageId, t1Values, t2Values, dateValues);

        return { success: true };
      }
    }
    return { success: true, data: null };
  } catch (error) {
    console.error('Lỗi khi migrate:', error);
    return { success: false, error: error.message };
  }
};
