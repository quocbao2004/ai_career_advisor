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

  const userInfo = getUserInfo();

  const needsOnboarding = useMemo(() => {
    if (!userInfo) return false;
    if (userInfo.role === "admin") return false;

    const cachedCompleted = getCachedOnboardingStatus();
    const userInfoCompleted = userInfo.hasCompletedOnboarding === true;
    const userInfoNeedsOnboarding = userInfo.needsOnboarding === true;

    const hasCompleted =
      cachedCompleted || (userInfoCompleted && !userInfoNeedsOnboarding);
    return !hasCompleted;
  }, [userInfo]);

  if (!userInfo) {
    return <Navigate to="/dang-nhap" replace />;
  }

  if (!needsOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }

  // Chỉ hiển thị đúng 1 lần: nếu đã seen thì đi thẳng QuizSelection
  if (hasSeenOnboardingWelcome(userInfo.id)) {
    return <Navigate to="/trac-nghiem" replace />;
  }

  const handleContinue = () => {
    markOnboardingWelcomeSeen(userInfo.id);
    navigate("/trac-nghiem", { replace: true });
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
