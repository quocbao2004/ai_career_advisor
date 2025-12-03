import React from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated, getUserInfo } from "../api/authApi";

const ProtectedRoute = ({ element, requiredRole = null }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/dang-nhap" replace />;
  }

  if (requiredRole) {
    const userInfo = getUserInfo();
    
    if (!userInfo || userInfo.role !== requiredRole) {
      // Chuyển hướng dựa trên role thực tế của user
      console.warn(
        `Access denied for role: ${userInfo?.role}, required: ${requiredRole}`
      );
      return <Navigate to="/trang-nguoi-dung" replace />;
    }
  }

  return element;
};

export default ProtectedRoute;
