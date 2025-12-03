
const API_BASE_URL = "http://localhost:8000/api/auth";

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

export const forgotPassword = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/quen-mat-khau/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: "Lỗi kết nối: " + error.message };
  }
};

export const verifyResetOTP = async (email, otp) => {
  try {
    const response = await fetch(`${API_BASE_URL}/xac-thuc-otp-reset/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: "Lỗi kết nối: " + error.message };
  }
};

export const resetPassword = async (email, newPassword) => {
  try {
    const response = await fetch(`${API_BASE_URL}/dat-lai-mat-khau/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, new_password: newPassword }),
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
  localStorage.removeItem("user_info");
  cachedUserInfo = null;
};

export const isAuthenticated = () => !!getAccessToken();

let cachedUserInfo = null;

const parseUserInfo = () => {
  try {
    const user = localStorage.getItem("user_info");
    if (!user || user === "undefined") {
      return null;
    }
    return JSON.parse(user);
  } catch (error) {
    localStorage.removeItem("user_info");
    return null;
  }
};

export const getUserInfo = () => {
  if (cachedUserInfo === null) {
    cachedUserInfo = parseUserInfo();
  }
  return cachedUserInfo;
};

export const saveUserInfo = (user) => {
  try {
    if (user && typeof user === "object") {
      localStorage.setItem("user_info", JSON.stringify(user));
      cachedUserInfo = user;
    }
  } catch (error) {
    // Silently fail to avoid breaking the app
  }
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

export const logoutUser = async () => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/dang-xuat/`, {
      method: "POST",
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: "Lỗi kết nối" };
  }
};