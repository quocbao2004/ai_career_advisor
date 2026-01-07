// Trang chào mừng user mới, hướng dẫn quy trình onboarding
import React, { useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import GlassCard from "../components/common/GlassCard";
import {
  getCachedOnboardingStatus,
  getUserInfo,
  hasSeenOnboardingWelcome,
  markOnboardingWelcomeSeen,
} from "../api/authApi";

const OnboardingWelcome = () => {
  const navigate = useNavigate();

  // Lấy thông tin user từ localStorage
  const userInfo = getUserInfo();

  // Kiểm tra xem user có cần làm onboarding không
  const needsOnboarding = useMemo(() => {
    // Chưa đăng nhập thì không cần
    if (!userInfo) return false;
    // Admin không cần làm onboarding
    if (userInfo.role === "admin") return false;

    // Kiểm tra trạng thái hoàn thành onboarding từ nhiều nguồn
    // Lấy trạng thái từ cache localStorage (nhanh, không cần gọi API)
    const cachedCompleted = getCachedOnboardingStatus();
    // Kiểm tra user đã hoàn thành onboarding từ thông tin đăng nhập
    const userInfoCompleted = userInfo.hasCompletedOnboarding === true;

    // Đã hoàn thành nếu cache hoặc userInfo xác nhận
    const hasCompleted = cachedCompleted || userInfoCompleted;
    return !hasCompleted;
  }, [userInfo]);

  // Chưa đăng nhập thì chuyển về trang đăng nhập
  if (!userInfo) {
    return <Navigate to="/dang-nhap" replace />;
  }

  // Đã hoàn thành onboarding thì vào dashboard
  if (!needsOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }

  // Đã xem trang chào mừng rồi thì đi thẳng cập nhật profile
  if (hasSeenOnboardingWelcome(userInfo.id)) {
    return <Navigate to="/cap-nhat-profile" replace />;
  }

  // Xử lý khi user nhấn nút Tiếp tục
  const handleContinue = () => {
    // Đánh dấu đã xem trang chào mừng để không hiển thị lại
    markOnboardingWelcomeSeen(userInfo.id);
    navigate("/cap-nhat-profile", { replace: true });
  };

  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 48 }}>
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <GlassCard className="p-4 p-md-5">
            <h2 className="fw-bold mb-3">Chào mừng bạn đến với AI Career Advisor</h2>
            <p className="mb-3" style={{ opacity: 0.9 }}>
              Để bắt đầu, bạn cần hoàn thành một vài bước ngắn để hệ thống hiểu rõ
              hơn về bạn và gợi ý lộ trình phù hợp.
            </p>
            <ul className="mb-4" style={{ opacity: 0.9 }}>
              <li>Chọn bài trắc nghiệm phù hợp (MBTI / Holland)</li>
              <li>Trả lời đầy đủ câu hỏi theo hướng dẫn</li>
              <li>Nhận kết quả và bắt đầu trải nghiệm dashboard</li>
            </ul>
            <div className="d-flex justify-content-end">
              <button className="btn btn-primary" onClick={handleContinue}>
                Tiếp tục
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWelcome;
