import React from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  isAuthenticated,
  getUserInfo,
  clearTokens,
  getCachedOnboardingStatus,
  hasSeenOnboardingWelcome,
  getIsNewGoogleUser,
} from "../api/authApi";

const ProtectedRoute = ({
  element,
  requiredRole = null,
  skipOnboardingCheck = false,
  isPublicRoute = false,
  requireWelcomeSeen = false,
  requireProfileCompleted = false,
  requireQuizDone = false,
}) => {
  const isAuth = isAuthenticated();

  if (!isAuth) {
    if (isPublicRoute) return element;
    clearTokens();
    return <Navigate to="/dang-nhap" replace />;
  }

  const userInfo = getUserInfo();
  if (!userInfo) {
    clearTokens();
    return <Navigate to="/dang-nhap" replace />;
  }

  // Role guard
  if (requiredRole && userInfo.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Admin bypass onboarding
  if (userInfo.role === "admin") {
    return element;
  }

  // Tính trạng thái onboarding theo thứ tự ưu tiên:
  // 1) localStorage cache
  // 2) user_info (được save từ login / sau submit test)
  const cachedCompleted = getCachedOnboardingStatus();
  const userInfoCompleted = userInfo.hasCompletedOnboarding === true;
  const userInfoNeedsOnboarding = userInfo.needsOnboarding === true;

  const hasCompletedOnboarding =
    cachedCompleted || (userInfoCompleted && !userInfoNeedsOnboarding);
  const needsOnboarding = !hasCompletedOnboarding;

  // Nếu người dùng không cần onboarding thì bỏ qua kiểm tra
  if (!needsOnboarding) {
    return element;
  }

  const nextOnboardingPath = hasSeenOnboardingWelcome(userInfo.id)
    ? "/trac-nghiem"
    : "/chao-mung";

  const toastFlowWarning = () => {
    try {
      toast.info("Xin hãy làm theo từng bước hướng dẫn.", {
        toastId: "onboarding-flow-warning",
      });
    } catch {
      // ignore
    }
  };

  // Nếu đang trong onboarding: bắt buộc đi theo flow
  // - Chưa xem Welcome thì không được vào các bước sau
  if (needsOnboarding && skipOnboardingCheck && requireWelcomeSeen) {
    if (!hasSeenOnboardingWelcome(userInfo.id)) {
      toastFlowWarning();
      return <Navigate to="/chao-mung" replace />;
    }
  }

  // - Chưa hoàn thành profile thì không được vào quiz
  if (needsOnboarding && skipOnboardingCheck && requireProfileCompleted) {
    const profileCompleted = localStorage.getItem(`profile_completed_${userInfo.id}`) === 'true';
    if (!profileCompleted) {
      toastFlowWarning();
      return <Navigate to="/cap-nhat-profile" replace />;
    }
  }

  // - Chưa làm quiz thì không được vào kết quả
  if (needsOnboarding && skipOnboardingCheck && requireQuizDone) {
    const quizDone = userInfo.mbti_result || userInfo.holland_result;
    if (!quizDone) {
      toastFlowWarning();
      return <Navigate to="/trac-nghiem" replace />;
    }
  }

  // Nếu chưa onboarding: chỉ cho phép vào các route onboarding
  if (needsOnboarding && !skipOnboardingCheck) {
    toastFlowWarning();
    return <Navigate to={nextOnboardingPath} replace />;
  }

  return element;
};

export default ProtectedRoute;
