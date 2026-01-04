import { fetchWithAuth } from "./authApi";
const API_BASE_URL = `${
  process.env.REACT_APP_API_BASE ||
  "https://ai-career-advisor-4006.onrender.com"
}/api/users`;

const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const getHollandQuestions = async () => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/test/holland/questions/`,
      {
        method: "GET",
      }
    );
    if (!response.ok) {
      const payload = await safeJson(response);
      return {
        success: false,
        status: response.status,
        message:
          payload?.message ||
          payload?.detail ||
          "Không thể tải câu hỏi Holland. Vui lòng thử lại.",
      };
    }
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: "Lỗi tải câu hỏi Holland: " + error.message,
    };
  }
};

export const getMBTIQuestions = async () => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/test/mbti/questions/`,
      {
        method: "GET",
      }
    );
    if (!response.ok) {
      const payload = await safeJson(response);
      return {
        success: false,
        status: response.status,
        message:
          payload?.message ||
          payload?.detail ||
          "Không thể tải câu hỏi MBTI. Vui lòng thử lại.",
      };
    }
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: "Lỗi tải câu hỏi MBTI: " + error.message,
    };
  }
};

export const submitTest = async (test_type, answers) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/test/submit/`, {
      method: "POST",
      body: JSON.stringify({ test_type, answers }),
    });
    if (!response.ok) {
      const payload = await safeJson(response);
      return {
        success: false,
        status: response.status,
        message:
          payload?.message ||
          payload?.detail ||
          "Lỗi gửi bài test. Vui lòng thử lại.",
      };
    }
    return await response.json();
  } catch (error) {
    return { success: false, message: "Lỗi gửi bài test: " + error.message };
  }
};

export const getTestResult = async () => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/test/result/`, {
      method: "GET",
    });
    if (!response.ok) {
      const payload = await safeJson(response);
      return {
        success: false,
        status: response.status,
        message:
          payload?.message ||
          payload?.detail ||
          "Lỗi lấy kết quả test. Vui lòng thử lại.",
      };
    }
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: "Lỗi lấy kết quả test: " + error.message,
    };
  }
};
// The getCareersByIndustry API helper has been removed as it is obsolete.
