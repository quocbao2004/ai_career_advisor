import axios from 'axios';
import { getAccessToken } from './authApi';

const API_BASE_URL = `${process.env.REACT_APP_API_BASE || 'http://localhost:8000'}/api`;

/**
 * Lấy header xác thực cho API requests
 * @returns {object} Headers object với Bearer token nếu có
 */
const getAuthHeaders = () => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Xác thực response tập trung
 * @param {object} response - Axios response object
 * @param {string} context - Error context cho logging
 * @param {array} requiredFields - Fields phải có trong response.data
 * @returns {object} Validated response data
 * @throws {Error} Nếu xác thực thất bại
 */
const validateResponse = (response, context, requiredFields = []) => {
  if (!response?.data) {
    throw new Error(`${context}: Cấu trúc không hợp lệ`);
  }

  if (response.data.success === false) {
    throw new Error(response.data.message || `${context}: Thao tác thất bại`);
  }

  // Kiểm tra required fields
  const missingFields = requiredFields.filter(field => !(field in response.data));
  if (missingFields.length > 0) {
    throw new Error(`${context}: Thiếu các trường bắt buộc - ${missingFields.join(', ')}`);
  }

  return response.data;
};

/**
 * Xử lý API errors với định dạng nhất quán
 * @param {Error} error - Error object
 * @param {string} context - Error context
 * @returns {Error} Formatted error
 */
const handleApiError = (error, context) => {
  if (error.response?.status === 401) {
    return new Error(`${context}: Vui lòng đăng nhập lại`);
  }
  
  if (error.response?.data?.message) {
    return new Error(`${context}: ${error.response.data.message}`);
  }
  
  if (error.message) {
    return new Error(`${context}: ${error.message}`);
  }
  
  return new Error(`${context}: Lỗi không xác định`);
};

const assessmentApi = {
  /**
   * Tải câu hỏi cho một bài trắc nghiệm
   * @param {string} assessmentType - 'HOLLAND' hoặc 'MBTI'
   * @returns {Promise<object>} { success, assessment_type, total_questions, questions }
   */
  getQuestions: async (assessmentType) => {
    try {
      if (!assessmentType?.trim()) {
        throw new Error('Loại trắc nghiệm là bắt buộc');
      }

      const response = await axios.get(
        `${API_BASE_URL}/assessments/questions/${assessmentType}/`,
        { headers: getAuthHeaders() }
      );

      const data = validateResponse(response, 'Tải câu hỏi', ['questions']);

      if (!Array.isArray(data.questions)) {
        throw new Error('Câu hỏi phải là một mảng');
      }

      return data;
    } catch (error) {
      const apiError = handleApiError(error, 'Tải câu hỏi');
      console.error('getQuestions error:', apiError.message);
      throw apiError;
    }
  },

  /**
   * Gửi câu trả lời trắc nghiệm và nhận kết quả
   * @param {string} assessmentType - 'HOLLAND' hoặc 'MBTI'
   * @param {object} answers - { question_id: answer_value }
   * @returns {Promise<object>} { success, message, result }
   */
  submitAssessment: async (assessmentType, answers) => {
    try {
      if (!assessmentType?.trim()) {
        throw new Error('Loại trắc nghiệm là bắt buộc');
      }

      if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
        throw new Error('Câu trả lời không được để trống');
      }

      const payload = {
        assessment_type: assessmentType,
        answers: answers,
      };

      const response = await axios.post(
        `${API_BASE_URL}/assessments/submit/`,
        payload,
        { headers: getAuthHeaders() }
      );

      const data = validateResponse(response, 'Gửi trắc nghiệm', ['result']);

      if (!data.result?.result_code) {
        throw new Error('Cấu trúc kết quả không hợp lệ: thiếu result_code');
      }

      return data;
    } catch (error) {
      const apiError = handleApiError(error, 'Gửi trắc nghiệm');
      console.error('submitAssessment error:', apiError.message);
      throw apiError;
    }
  },

  /**
   * Lấy chi tiết kết quả trắc nghiệm
   * @param {string} resultId - Result UUID
   * @returns {Promise<object>} { success, result }
   */
  getResultDetail: async (resultId) => {
    try {
      if (!resultId?.trim()) {
        throw new Error('Result ID là bắt buộc');
      }

      const response = await axios.get(
        `${API_BASE_URL}/assessments/results/${resultId}/`,
        { headers: getAuthHeaders() }
      );

      return validateResponse(response, 'Lấy chi tiết kết quả', ['result']);
    } catch (error) {
      const apiError = handleApiError(error, 'Lấy chi tiết kết quả');
      console.error('getResultDetail error:', apiError.message);
      throw apiError;
    }
  },

  /**
   * Lấy lịch sử trắc nghiệm
   * @param {string|null} type - Bộ lọc loại trắc nghiệm ('HOLLAND' hoặc 'MBTI')
   * @param {number} limit - Số lượng kết quả cần trả về
   * @returns {Promise<object>} { success, count, results }
   */
  getHistory: async (type = null, limit = 10) => {
    try {
      if (limit < 1) {
        throw new Error('Limit phải lớn hơn 0');
      }

      let url = `${API_BASE_URL}/assessments/history/?limit=${limit}`;
      if (type?.trim()) {
        url += `&type=${type}`;
      }

      const response = await axios.get(url, { headers: getAuthHeaders() });

      return validateResponse(response, 'Lấy lịch sử', ['results']);
    } catch (error) {
      const apiError = handleApiError(error, 'Lấy lịch sử');
      console.error('getHistory error:', apiError.message);
      throw apiError;
    }
  },

  /**
   * Lấy hồ sơ người dùng với tóm tắt trắc nghiệm
   * @returns {Promise<object>} { success, profile }
   */
  getProfile: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/assessments/profile/`,
        { headers: getAuthHeaders() }
      );

      return validateResponse(response, 'Lấy hồ sơ', ['profile']);
    } catch (error) {
      const apiError = handleApiError(error, 'Lấy hồ sơ');
      console.error('getProfile error:', apiError.message);
      throw apiError;
    }
  },

  /**
   * Lưu kết quả trắc nghiệm vào hồ sơ người dùng
   * @param {string} resultId - Result UUID
   * @returns {Promise<object>} { success, message, profile }
   */
  saveToProfile: async (resultId) => {
    try {
      if (!resultId?.trim()) {
        throw new Error('Result ID là bắt buộc');
      }

      const response = await axios.post(
        `${API_BASE_URL}/assessments/save-to-profile/`,
        { assessment_result_id: resultId },
        { headers: getAuthHeaders() }
      );

      return validateResponse(response, 'Lưu vào hồ sơ', ['profile']);
    } catch (error) {
      const apiError = handleApiError(error, 'Lưu vào hồ sơ');
      console.error('saveToProfile error:', apiError.message);
      throw apiError;
    }
  },
};

export default assessmentApi;
