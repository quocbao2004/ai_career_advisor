import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import GlassCard from "../components/common/GlassCard";
import Logo from "../components/logo";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../assets/css-custom/loginpage.css";

const RESEND_TIMEOUT = 60;

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [countdown, setCountdown] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);

  const startTimer = () => {
    setCountdown(RESEND_TIMEOUT);
    setCanResend(false);
  };

  useEffect(() => {
    let timer;
    if (isSuccess && countdown > 0 && !canResend) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    if (countdown === 0 && isSuccess) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [isSuccess, countdown, canResend]);

  const sendResetRequest = async () => {
    if (!email) {
      setMessage("Vui lòng nhập địa chỉ Email của bạn.");
      setMessageType("error");
      return false;
    }

    setIsSubmitting(true);
    setMessage(""); // Clear old message

    try {
      // Giả lập gọi API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setIsSuccess(true);
      setMessage(
        `Email khôi phục đã được gửi đến ${email}. Vui lòng kiểm tra hộp thư đến (và cả mục Spam).`
      );
      setMessageType("success");
      startTimer();
      return true;
    } catch (error) {
      setMessage("Có lỗi xảy ra. Vui lòng thử lại sau.");
      setMessageType("error");
      setIsSuccess(false);
      setCanResend(true);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendResetRequest();
  };

  return (
    <div className="auth-wrapper">
      {/* Sử dụng GlassCard thay cho Card thường */}
      <GlassCard className="auth-card-container">
        <div className="text-center mb-4">
          <div className="d-flex justify-content-center mb-3">
            <Logo />
          </div>
          <h2 className="fw-bold text-white">Quên Mật Khẩu?</h2>
          <p className="text-white-50 small">
            Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
          </p>
        </div>

        {!isSuccess ? (
          // --- FORM NHẬP EMAIL ---
          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <div className="auth-input-group">
              <div className="input-icon">
                <i className="bi bi-envelope-fill"></i>
              </div>
              <input
                type="email"
                className="auth-input"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Thông báo lỗi nếu có */}
            {message && messageType === "error" && (
              <div className="auth-alert error mb-3">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {message}
              </div>
            )}

            <button
              type="submit"
              className="btn-auth-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Đang gửi...
                </>
              ) : (
                "Gửi yêu cầu"
              )}
            </button>
          </form>
        ) : (
          // --- MÀN HÌNH THÀNH CÔNG ---
          <div className="text-center fade-in-up">
            <div className="auth-alert success mb-4">
              <i className="bi bi-check-circle-fill me-2"></i>
              {message}
            </div>

            {canResend ? (
              <button
                type="button"
                className="btn-auth-outline w-100 mb-3"
                onClick={sendResetRequest}
                disabled={isSubmitting}
              >
                Gửi lại Email
              </button>
            ) : (
              <p className="text-white-50 mb-4">
                Gửi lại sau: <strong className="text-gold">{countdown}s</strong>
              </p>
            )}
          </div>
        )}

        {/* Nút Quay lại */}
        <div className="text-center mt-4 pt-3 border-top border-white-10">
          <Link
            to="/dang-nhap"
            className="back-link text-white-50 text-decoration-none hover-white"
          >
            <i className="bi bi-arrow-left me-1"></i>
            Quay lại Đăng nhập
          </Link>
        </div>
      </GlassCard>
    </div>
  );
};

export default ForgotPasswordPage;
