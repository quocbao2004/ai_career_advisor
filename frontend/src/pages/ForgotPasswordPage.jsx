import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import GlassCard from "../components/common/GlassCard";
import Logo from "../components/logo";
import { forgotPassword, verifyResetOTP, resetPassword } from "../api/authApi";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../assets/css-custom/loginpage.css";

const RESEND_TIMEOUT = 60;

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  // Step states
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Message states
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer states
  const [countdown, setCountdown] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);

  const startTimer = () => {
    setCountdown(RESEND_TIMEOUT);
    setCanResend(false);
  };

  useEffect(() => {
    let timer;
    if (step >= 2 && countdown > 0 && !canResend) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    if (countdown === 0 && step >= 2) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown, canResend]);

  // Bước 1: Gửi OTP
  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage("Vui lòng nhập email");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const result = await forgotPassword(email);
      if (result.success || result.message.includes("email")) {
        setStep(2);
        setMessage(`Mã OTP đã được gửi đến ${email}`);
        setMessageType("success");
        startTimer();
      } else {
        setMessage(result.message || "Có lỗi xảy ra");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Lỗi kết nối");
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gửi lại OTP
  const handleResendOTP = async () => {
    setIsSubmitting(true);
    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setMessage("Mã OTP mới đã được gửi");
        setMessageType("success");
        startTimer();
      } else {
        setMessage(result.message || "Không thể gửi lại OTP");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Lỗi kết nối");
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bước 2: Xác nhận OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) {
      setMessage("Vui lòng nhập OTP");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const result = await verifyResetOTP(email, otp);
      if (result.success) {
        setStep(3);
        setMessage("OTP được xác nhận");
        setMessageType("success");
      } else {
        setMessage(result.message || "OTP không đúng");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Lỗi kết nối");
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bước 3: Đặt lại mật khẩu
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setMessage("Vui lòng nhập mật khẩu");
      setMessageType("error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Mật khẩu xác nhận không khớp");
      setMessageType("error");
      return;
    }

    if (newPassword.length < 8) {
      setMessage("Mật khẩu phải có ít nhất 8 ký tự");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const result = await resetPassword(email, newPassword);
      if (result.success) {
        setMessage("Mật khẩu đã được đặt lại. Đang chuyển hướng...");
        setMessageType("success");
        setTimeout(() => {
          navigate("/dang-nhap");
        }, 2000);
      } else {
        setMessage(result.message || "Có lỗi xảy ra");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Lỗi kết nối");
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="auth-wrapper">
      <GlassCard className="auth-card-container">
        <div className="text-center mb-4">
          <div className="d-flex justify-content-center mb-3">
            <Logo />
          </div>
          <h2 className="fw-bold text-white">Quên Mật Khẩu?</h2>
          <p className="text-white-50 small">
            {step === 1 && "Nhập email của bạn để nhận mã OTP"}
            {step === 2 && "Nhập mã OTP được gửi đến email"}
            {step === 3 && "Nhập mật khẩu mới của bạn"}
          </p>
        </div>

        {/* BƯỚC 1: NHẬP EMAIL */}
        {step === 1 && (
          <form onSubmit={handleRequestReset} style={{ width: "100%" }}>
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
                disabled={isSubmitting}
              />
            </div>

            {message && (
              <div className={`auth-alert ${messageType} mb-3`}>
                <i
                  className={`bi ${
                    messageType === "success"
                      ? "bi-check-circle-fill"
                      : "bi-exclamation-triangle-fill"
                  } me-2`}
                ></i>
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
                "Gửi mã OTP"
              )}
            </button>
          </form>
        )}

        {/* BƯỚC 2: NHẬP OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} style={{ width: "100%" }}>
            <div className="auth-input-group">
              <div className="input-icon">
                <i className="bi bi-shield-lock-fill"></i>
              </div>
              <input
                type="text"
                className="auth-input"
                placeholder="Nhập mã OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={isSubmitting}
                maxLength="6"
              />
            </div>

            {message && (
              <div className={`auth-alert ${messageType} mb-3`}>
                <i
                  className={`bi ${
                    messageType === "success"
                      ? "bi-check-circle-fill"
                      : "bi-exclamation-triangle-fill"
                  } me-2`}
                ></i>
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
                  Đang xác nhận...
                </>
              ) : (
                "Xác nhận OTP"
              )}
            </button>

            <div className="text-center mt-3">
              {canResend ? (
                <button
                  type="button"
                  className="btn-link text-gold"
                  onClick={handleResendOTP}
                  disabled={isSubmitting}
                >
                  Gửi lại mã OTP
                </button>
              ) : (
                <p className="text-white-50 small">
                  Gửi lại sau: <strong className="text-gold">{countdown}s</strong>
                </p>
              )}
            </div>
          </form>
        )}

        {/* BƯỚC 3: ĐẶT LẠI MẬT KHẨU */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} style={{ width: "100%" }}>
            <div className="auth-input-group">
              <div className="input-icon">
                <i className="bi bi-lock-fill"></i>
              </div>
              <input
                type="password"
                className="auth-input"
                placeholder="Mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="auth-input-group">
              <div className="input-icon">
                <i className="bi bi-lock-fill"></i>
              </div>
              <input
                type="password"
                className="auth-input"
                placeholder="Xác nhận mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {message && (
              <div className={`auth-alert ${messageType} mb-3`}>
                <i
                  className={`bi ${
                    messageType === "success"
                      ? "bi-check-circle-fill"
                      : "bi-exclamation-triangle-fill"
                  } me-2`}
                ></i>
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
                  Đang cập nhật...
                </>
              ) : (
                "Đặt lại mật khẩu"
              )}
            </button>
          </form>
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
