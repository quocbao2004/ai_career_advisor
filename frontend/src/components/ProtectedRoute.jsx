import React from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated, getUserInfo, clearTokens } from "../api/authApi";

const ProtectedRoute = ({ element, requiredRole = null }) => {

  // 1. Kiểm tra token
  if (!isAuthenticated()) {
    clearTokens();
    return <Navigate to="/dang-nhap" replace />;
  }

  // 2. Kiểm tra user_info
  const userInfo = getUserInfo();
  if (!userInfo) {
    clearTokens();
    return <Navigate to="/dang-nhap" replace />;
  }

  // 3. Kiểm tra role nếu có yêu cầu
  if (requiredRole && userInfo.role !== requiredRole) {
    console.warn(`Access denied: ${userInfo.role} required: ${requiredRole}`);
    return <Navigate to="/trang-nguoi-dung" replace />;
  }

  return element;
};

export default ProtectedRoute;
