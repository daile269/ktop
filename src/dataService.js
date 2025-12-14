import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Lưu dữ liệu trang (T1, T2, dateValues) lên Firestore
 * @param {string} pageId - ID của trang (vd: 'q1', 'q2')
 * @param {Array} t1Values - Mảng giá trị T1 (300 phần tử)
 * @param {Array} t2Values - Mảng giá trị T2 (300 phần tử)
 * @param {Array} dateValues - Mảng giá trị ngày tháng (300 phần tử)
 */
export const savePageData = async (pageId, t1Values, t2Values, dateValues) => {
  try {
    const pageRef = doc(db, 'pages', pageId);
    
    await setDoc(pageRef, {
      pageId,
      t1Values,
      t2Values,
      dateValues,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    console.log(`💾 Đã lưu trang ${pageId} lên Firestore`);
    return { success: true };
  } catch (error) {
    console.error('Lỗi khi lưu dữ liệu:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Tải dữ liệu trang từ Firestore
 * @param {string} pageId - ID của trang
 */
export const loadPageData = async (pageId) => {
  try {
    const pageRef = doc(db, 'pages', pageId);
    const pageSnap = await getDoc(pageRef);
    
    if (pageSnap.exists()) {
      const data = pageSnap.data();
      console.log(`✅ Đã tải trang ${pageId} từ Firestore`);
      return { 
        success: true, 
        data: {
          t1Values: data.t1Values || [],
          t2Values: data.t2Values || [],
          dateValues: data.dateValues || []
        }
      };
    } else {
      console.log(`ℹ️ Trang ${pageId} chưa có dữ liệu`);
      return { success: true, data: null };
    }
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Xóa dữ liệu trang từ Firestore
 * @param {string} pageId - ID của trang
 */
export const deletePageData = async (pageId) => {
  try {
    const pageRef = doc(db, 'pages', pageId);
    await deleteDoc(pageRef);
    
    console.log(`🗑️ Đã xóa trang ${pageId} khỏi Firestore`);
    return { success: true };
  } catch (error) {
    console.error('Lỗi khi xóa dữ liệu:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Migration từ localStorage sang Firestore
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
        console.log('✅ Đã migrate dữ liệu từ localStorage sang Firestore');
        return { success: true };
      }
    }
    return { success: true, data: null };
  } catch (error) {
    console.error('Lỗi khi migrate:', error);
    return { success: false, error: error.message };
  }
};
