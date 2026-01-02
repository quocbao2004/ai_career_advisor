import { fetchWithAuth } from './authApi';

const API_BASE_URL = `${process.env.REACT_APP_API_BASE || 'http://localhost:8000'}/api/career`;

const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const getCareersByIndustryId = async (industryId, limit = 20) => {
  try {
    const id = Number(industryId);
    if (!Number.isFinite(id) || id <= 0) {
      return { success: false, message: 'Thiếu hoặc sai id lĩnh vực.' };
    }

    const safeLimit = Math.max(1, Math.min(50, Number(limit) || 20));
    const url = `${API_BASE_URL}/industries/${id}/careers/?limit=${safeLimit}`;

    const response = await fetchWithAuth(url, { method: 'GET' });

    if (!response.ok) {
      const payload = await safeJson(response);
      return {
        success: false,
        status: response.status,
        message: payload?.message || payload?.detail || 'Không thể tải nghề nghiệp. Vui lòng thử lại.',
      };
    }

    return await response.json();
  } catch (error) {
    return { success: false, message: 'Lỗi tải nghề nghiệp: ' + error.message };
  }
};
