import { fetchWithAuth } from "./authApi";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

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
