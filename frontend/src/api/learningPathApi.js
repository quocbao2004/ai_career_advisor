import { fetchWithAuth } from "./authApi";

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "https://ai-career-advisor-4006.onrender.com";

/**
 * Lấy danh sách tất cả lộ trình của user
 * Endpoint: GET /api/learning/paths/
 */
export const getUserLearningPaths = async () => {
  try {
    const response = await fetchWithAuth(`${API_BASE}/api/learning/paths/`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data?.error || data?.message || "Không thể tải danh sách lộ trình.",
      };
    }

    return { success: true, data: data.data || [], count: data.count || 0 };
  } catch (error) {
    console.error("Get Learning Paths Error:", error);
    return { success: false, message: "Lỗi kết nối server." };
  }
};

/**
 * Gọi AI để sinh lộ trình học tập cho một nghề nghiệp
 * Endpoint: POST /api/learning/generate/
 * Body: { "career_id": 123 }
 */
export const generateLearningPath = async (careerId) => {
  try {
    const response = await fetchWithAuth(`${API_BASE}/api/learning/generate/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ career_id: careerId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data?.error || data?.message || "Không thể tạo lộ trình.",
      };
    }

    return { success: true, path_id: data.path_id };
  } catch (error) {
    console.error("Generate Path Error:", error);
    return { success: false, message: "Lỗi kết nối server." };
  }
};

/**
 * Lấy chi tiết lộ trình theo ID
 * Endpoint: GET /api/learning/paths/:id/
 */
export const getLearningPathDetail = async (pathId) => {
  try {
    const response = await fetchWithAuth(`${API_BASE}/api/learning/paths/${pathId}/`);
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        success: false,
        message: data?.error || data?.message || "Không thể tải chi tiết lộ trình.",
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Get Learning Path Detail Error:", error);
    return { success: false, message: "Lỗi kết nối server." };
  }
};

/**
 * Toggle trạng thái hoàn thành của một item trong lộ trình
 * Endpoint: POST /api/learning/items/:itemId/toggle/
 */
export const toggleLearningPathItem = async (itemId) => {
  try {
    const response = await fetchWithAuth(`${API_BASE}/api/learning/items/${itemId}/toggle/`, {
      method: "POST",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        success: false,
        message: data?.error || data?.message || "Không thể cập nhật trạng thái.",
      };
    }

    const data = await response.json();
    return { 
      success: true, 
      is_completed: data.is_completed,
      new_progress: data.new_progress 
    };
  } catch (error) {
    console.error("Toggle Item Error:", error);
    return { success: false, message: "Lỗi kết nối server." };
  }
};
