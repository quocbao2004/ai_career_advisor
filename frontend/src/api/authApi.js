
const API_BASE_URL = "http://localhost:8000/api/auths";

export const registerUser = async (email, password, full_name) => {
  try {
    const response = await fetch(`${API_BASE_URL}/dang-ky/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: "Lỗi kết nối: " + error.message };
  }
};

export const verifyOTP = async (email, otp) => {
  try {
    const response = await fetch(`${API_BASE_URL}/xac-thuc-otp/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: "Lỗi kết nối: " + error.message };
  }
};

export const resendOTP = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/gui-lai-otp/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: "Lỗi kết nối: " + error.message };
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/dang-nhap/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: "Lỗi kết nối: " + error.message };
  }
};

export const googleLogin = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/google-login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: "Lỗi kết nối: " + error.message };
  }
};

export const saveTokens = (accessToken, refreshToken) => {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
};

export const getAccessToken = () => localStorage.getItem("access_token");
export const getRefreshToken = () => localStorage.getItem("refresh_token");

export const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

export const isAuthenticated = () => !!getAccessToken();

export const getUserInfo = () => {
  const user = localStorage.getItem("user_info");
  return user ? JSON.parse(user) : null;
};

export const saveUserInfo = (user) => {
  localStorage.setItem("user_info", JSON.stringify(user));
};

export const fetchWithAuth = async (url, options = {}) => {
  const accessToken = getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      clearTokens();
      window.location.href = "/dang-nhap";
    }
    return response;
  } catch (error) {
    throw error;
  }
};