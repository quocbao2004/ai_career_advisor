import { fetchWithAuth } from "./authApi";

const API_BASE_URL = "http://127.0.0.1:8000/api/ai";

const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const getLearningPathsForChat = async ({ paths = 3, coursesPerPath = 6 } = {}) => {
  const query = new URLSearchParams();
  query.set("paths", String(paths));
  query.set("coursesPerPath", String(coursesPerPath));

  const res = await fetchWithAuth(`${API_BASE_URL}/learning-paths/?${query.toString()}`, {
    method: "GET",
  });

  const payload = await safeJson(res);

  if (!res.ok) {
    return {
      success: false,
      status: res.status,
      message:
        payload?.message || payload?.detail || "Không thể tạo lộ trình học.",
      data: payload,
    };
  }

  return {
    success: true,
    data: payload,
  };
};