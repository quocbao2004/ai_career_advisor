import { refreshAccessToken, clearTokens } from "./authApi";

// API cho Admin Dashboard
// Đổi URL tùy theo môi trường: localhost hoặc production
const API_BASE_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api/admin`
  : "http://localhost:8000/api/admin";

// Lấy token từ localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem("access_token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

// Helper function để fetch với auto refresh token
const fetchWithAuth = async (url, options = {}) => {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeader(),
      ...options.headers,
    },
  });

  // Nếu 401, thử refresh token và gọi lại
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Thử lại với token mới
      response = await fetch(url, {
        ...options,
        headers: {
          ...getAuthHeader(),
          ...options.headers,
        },
      });
    } else {
      // Refresh thất bại, clear tokens và redirect về login
      clearTokens();
      window.location.href = "/dang-nhap";
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
  }

  return response;
};

// ==================== USERS API ====================

/**
 * Lấy danh sách tất cả users
 */
export const getUsers = async () => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Lỗi khi lấy danh sách users");
    }

    const data = await response.json();
    // Trả về mảng users
    return data.data || data || [];
  } catch (error) {
    console.error("getUsers error:", error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết 1 user
 */
export const getUserById = async (userId) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/${userId}/`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Lỗi khi lấy thông tin user");
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error("getUserById error:", error);
    throw error;
  }
};

/**
 * Cập nhật thông tin user
 */
export const updateUser = async (userId, userData) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/users/${userId}/`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Lỗi khi cập nhật user");
  }

  return await response.json();
};

/**
 * Xóa user
 */
export const deleteUser = async (userId) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/users/${userId}/`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Lỗi khi xóa user");
  }

  return true;
};

// ==================== DASHBOARD STATS API ====================

/**
 * Lấy thống kê dashboard
 */
export const getDashboardStats = async () => {
  const response = await fetchWithAuth(`${API_BASE_URL}/dashboard/stats/`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Lỗi khi lấy thống kê dashboard");
  }

  return await response.json();
};
