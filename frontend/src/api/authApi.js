const API_BASE_URL = "https://ai-career-advisor-4006.onrender.com/api/auth";

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
  localStorage.removeItem("has_completed_onboarding");
  cachedUserInfo = null;
};

const onboardingWelcomeKey = (userId) => `onboarding_welcome_seen_${userId}`;

export const hasSeenOnboardingWelcome = (userId) => {
  try {
    if (!userId) return false;
    return localStorage.getItem(onboardingWelcomeKey(userId)) === "true";
  } catch {
    return false;
  }
};

export const markOnboardingWelcomeSeen = (userId) => {
  try {
    if (!userId) return;
    localStorage.setItem(onboardingWelcomeKey(userId), "true");
  } catch {
    // ignore
  }
};

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

export const isAuthenticated = () => !!getAccessToken();

let cachedUserInfo = null;

const parseUserInfo = () => {
  try {
    const raw = localStorage.getItem("user_info");

    if (!raw || raw === "undefined" || raw === "null") {
      return null;
    }

    const user = JSON.parse(raw);

    if (typeof user !== "object" || user === null) {
      return null;
    }

    return user;
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
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const newAccessToken = getAccessToken();
        headers["Authorization"] = `Bearer ${newAccessToken}`;
        return fetch(url, { ...options, headers });
      } else {
        clearTokens();
        window.location.href = "/dang-nhap";
      }
    }
    return response;
  } catch (error) {
    throw error;
  }
};

export const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    const response = await fetch("http://localhost:8000/api/token/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("access_token", data.access);
      if (data.refresh) {
        localStorage.setItem("refresh_token", data.refresh);
      }
      return true;
    } else {
      clearTokens();
      return false;
    }
  } catch (error) {
    clearTokens();
    return false;
  }
};

export const logoutUser = async () => {
  try {
    const refreshToken = getRefreshToken();
    const response = await fetchWithAuth(`${API_BASE_URL}/dang-xuat/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (response.ok) {
      clearTokens();
    }
    let data;
    try {
      data = await response.json();
    } catch {
      data = { success: response.ok };
    }
    return data;
  } catch (error) {
    return { success: false, message: "Lỗi kết nối" };
  }
};

// Onboarding Status Check
export const checkOnboardingStatus = async () => {
  try {
    const response = await fetchWithAuth(
      "http://localhost:8000/api/users/onboarding/status/"
    );
    if (!response.ok) {
      return { success: false, needsOnboarding: true };
    }
    const data = await response.json();
    return {
      success: true,
      hasCompletedOnboarding: data.hasCompletedOnboarding,
      needsOnboarding: data.needsOnboarding,
      user: data.user,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return { success: false, needsOnboarding: true };
  }
};

// Save onboarding status to localStorage
export const saveOnboardingStatus = (hasCompleted) => {
  try {
    localStorage.setItem(
      "has_completed_onboarding",
      hasCompleted ? "true" : "false"
    );
  } catch (error) {
    console.error("Error saving onboarding status:", error);
  }
};

// Get cached onboarding status
export const getCachedOnboardingStatus = () => {
  try {
    const status = localStorage.getItem("has_completed_onboarding");
    return status === "true";
  } catch (error) {
    return false;
  }
};

// Clear onboarding status on logout
export const clearOnboardingStatus = () => {
  try {
    localStorage.removeItem("has_completed_onboarding");
  } catch (error) {
    console.error("Error clearing onboarding status:", error);
  }
};
