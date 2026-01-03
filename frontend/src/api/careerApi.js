import { fetchWithAuth } from "./authApi";

// Cấu hình Base URL.
// Lưu ý: Backend views chúng ta viết nằm trong apps/ai/urls.py,
// nên đường dẫn thường sẽ là /api/ai/... (tùy vào cách bạn include trong urls.py gốc)
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";
const AI_API_URL = `${API_BASE}/api/career`;

// Helper xử lý lỗi JSON
const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

/**
 * Lấy danh sách nghề nghiệp gợi ý dựa trên Industry ID
 * Endpoint: GET /api/ai/recommend-careers/?industry_id=1
 */
export const getCareersByIndustryId = async (industryId) => {
  try {
    const id = Number(industryId);
    if (!Number.isFinite(id) || id <= 0) {
      return { success: false, message: "Thiếu hoặc sai id lĩnh vực." };
    }

    // URL khớp với Backend view: CareerRecommendationAPI
    const url = `${AI_API_URL}/recommend-careers/?industry_id=${id}`;

    const response = await fetchWithAuth(url, { method: "GET" });

    if (!response.ok) {
      const payload = await safeJson(response);
      return {
        success: false,
        status: response.status,
        message:
          payload?.message ||
          payload?.error || // Backend trả về key "error" trong trường hợp lỗi
          "Không thể tải gợi ý nghề nghiệp.",
      };
    }

    // Backend trả về: { success: true, data: [...] }
    return await response.json();
  } catch (error) {
    return { success: false, message: "Lỗi kết nối: " + error.message };
  }
};

/**
 * User chốt chọn nghề -> Lưu vào DB -> Chuẩn bị tạo lộ trình
 * Endpoint: POST /api/ai/select-career/
 * Body: { "career_id": 123 }
 */
export const selectCareerForRoadmap = async (careerId) => {
  try {
    if (!careerId) {
      return { success: false, message: "Thiếu Career ID." };
    }

    const url = `${AI_API_URL}/select-career/`;

    const response = await fetchWithAuth(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ career_id: careerId }),
    });

    if (!response.ok) {
      const payload = await safeJson(response);
      return {
        success: false,
        status: response.status,
        message:
          payload?.message ||
          payload?.error ||
          "Không thể lưu lựa chọn nghề nghiệp.",
      };
    }

    // Backend trả về: { success: true, recommendation_id: "uuid...", message: "..." }
    return await response.json();
  } catch (error) {
    return { success: false, message: "Lỗi hệ thống: " + error.message };
  }
};
