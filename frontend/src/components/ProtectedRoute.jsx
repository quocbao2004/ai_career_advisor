import React from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  isAuthenticated,
  getUserInfo,
  clearTokens,
  getCachedOnboardingStatus,
  hasSeenOnboardingWelcome,
} from "../api/authApi";

// Hiển thị thông báo nhắc user làm theo flow onboarding
const showOnboardingWarning = () => {
  toast.info("Xin hãy làm theo từng bước hướng dẫn.", {
    toastId: "onboarding-flow-warning",
  });
};

// Component kiểm tra quyền truy cập route
const ProtectedRoute = ({
  element,
  requiredRole = null,
  skipOnboardingCheck = false,
  requireWelcomeSeen = false,
  requireProfileCompleted = false,
  requireQuizDone = false,
}) => {
  // Chưa đăng nhập thì chuyển về trang đăng nhập
  if (!isAuthenticated()) {
    clearTokens();
    return <Navigate to="/dang-nhap" replace />;
  }

  // Không lấy được thông tin user thì xóa token và đăng nhập lại
  const userInfo = getUserInfo();
  if (!userInfo) {
    clearTokens();
    return <Navigate to="/dang-nhap" replace />;
  }

  // Kiểm tra quyền theo role (admin, user)
  if (requiredRole && userInfo.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Admin không cần làm onboarding
  if (userInfo.role === "admin") {
    return element;
  }

  // Kiểm tra trạng thái hoàn thành onboarding từ nhiều nguồn
  const cachedCompleted = getCachedOnboardingStatus();
  const userInfoCompleted = userInfo.hasCompletedOnboarding === true;
  const hasCompletedOnboarding = cachedCompleted || userInfoCompleted;

  // Đã hoàn thành onboarding thì cho phép truy cập
  if (hasCompletedOnboarding) {
    return element;
  }

  // Xác định bước tiếp theo trong flow onboarding
  const welcomeSeen = hasSeenOnboardingWelcome(userInfo.id);
  const nextOnboardingPath = welcomeSeen ? "/trac-nghiem" : "/chao-mung";

  // Route onboarding - kiểm tra thứ tự các bước
  if (skipOnboardingCheck) {
    // Phải xem trang chào mừng trước
    if (requireWelcomeSeen && !welcomeSeen) {
      showOnboardingWarning();
      return <Navigate to="/chao-mung" replace />;
    }

    // Phải hoàn thành cập nhật profile trước
    if (requireProfileCompleted) {
      const profileCompleted = localStorage.getItem(`profile_completed_${userInfo.id}`) === 'true';
      if (!profileCompleted) {
        showOnboardingWarning();
        return <Navigate to="/cap-nhat-profile" replace />;
      }
    }

    // Phải hoàn thành quiz trước
    if (requireQuizDone) {
      const quizDone = userInfo.mbti_result || userInfo.holland_result;
      if (!quizDone) {
        showOnboardingWarning();
        return <Navigate to="/trac-nghiem" replace />;
      }
    }

    return element;
  }

  // Route thường mà chưa hoàn thành onboarding - chuyển về bước tiếp theo
  showOnboardingWarning();
  return <Navigate to={nextOnboardingPath} replace />;
};

export default ProtectedRoute;
