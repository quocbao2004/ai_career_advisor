import { getAccessToken } from './authApi';
const API_BASE_URL = `${process.env.REACT_APP_API_BASE || 'http://localhost:8000'}/api/users`;

const getAuthHeaders = () => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getHollandQuestions = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/test/holland/questions/`, {
      headers: { ...getAuthHeaders() },
    });
    if (!response.ok) {
      return { success: false, message: 'Lỗi tải câu hỏi Holland: Server không phản hồi hợp lệ' };
    }
    return await response.json();
  } catch (error) {
    return { success: false, message: 'Lỗi tải câu hỏi Holland: ' + error.message };
  }
};

export const getMBTIQuestions = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/test/mbti/questions/`, {
      headers: { ...getAuthHeaders() },
    });
    if (!response.ok) {
      return { success: false, message: 'Lỗi tải câu hỏi MBTI: Server không phản hồi hợp lệ' };
    }
    return await response.json();
  } catch (error) {
    return { success: false, message: 'Lỗi tải câu hỏi MBTI: ' + error.message };
  }
};

export const submitTest = async (test_type, answers) => {
  try {
    const response = await fetch(`${API_BASE_URL}/test/submit/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ test_type, answers }),
    });
    if (!response.ok) {
      return { success: false, message: 'Lỗi gửi bài test: Server không phản hồi hợp lệ' };
    }
    return await response.json();
  } catch (error) {
    return { success: false, message: 'Lỗi gửi bài test: ' + error.message };
  }
};

export const getTestResult = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/test/result/`, {
      headers: { ...getAuthHeaders() },
    });
    if (!response.ok) {
      return { success: false, message: 'Lỗi lấy kết quả test: Server không phản hồi hợp lệ' };
    }
    return await response.json();
  } catch (error) {
    return { success: false, message: 'Lỗi lấy kết quả test: ' + error.message };
  }
};