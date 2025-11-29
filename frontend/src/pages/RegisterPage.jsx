import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import GlassCard from "../components/common/GlassCard";
import Logo from "../components/logo";
import { registerUser, verifyOTP, resendOTP, saveTokens, saveUserInfo, googleLogin } from "../api/authApi";
import "../assets/css-custom/loginpage.css";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("register");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [otpData, setOtpData] = useState({ otp: "" });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const handleOtpChange = (e) => {
    setOtpData({ otp: e.target.value });
    setError("");
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      setLoading(false);
      return;
    }

    if (!formData.agreeTerms) {
      setError("Bạn phải đồng ý với điều khoản sử dụng!");
      setLoading(false);
      return;
    }

    try {
      const result = await registerUser(
        formData.email,
        formData.password,
        formData.fullname
      );

      if (result.success) {
        setRegisteredEmail(formData.email);
        setStep("verify-otp");
      } else {
        setError(result.message || "Đăng ký thất bại");
      }
    } catch (err) {
      setError("Lỗi kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!otpData.otp || otpData.otp.length !== 6) {
      setError("Vui lòng nhập mã OTP 6 chữ số");
      setLoading(false);
      return;
    }

    try {
      const result = await verifyOTP(registeredEmail, otpData.otp);

      if (result.success) {
        saveTokens(result.access, result.refresh);
        saveUserInfo(result.user);
        navigate("/");
      } else {
        setError(result.message || "Xác nhận OTP thất bại");
      }
    } catch (err) {
      setError("Lỗi kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await resendOTP(registeredEmail);

      if (result.success) {
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(result.message || "Gửi lại OTP thất bại");
      }
    } catch (err) {
      setError("Lỗi kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const result = await googleLogin(credentialResponse.credential);
      
      if (result.success) {
        saveTokens(result.access, result.refresh);
        saveUserInfo(result.user);
        navigate("/");
      } else {
        setError(result.message || "Lỗi đăng ký Google");
      }
    } catch (err) {
      setError("Lỗi đăng ký Google");
    } finally {
      setLoading(false);
    }
  };

  const goBackToRegister = () => {
    setStep("register");
    setOtpData({ otp: "" });
    setError("");
  };

  if (step === "register") {
    return (
      <div className="auth-wrapper">
        <GlassCard className="auth-card-container">
          <div className="text-center mb-4">
            <div className="d-flex justify-content-center mb-3">
              <Logo />
            </div>
            <h2 className="fw-bold text-white">Tạo tài khoản mới</h2>
            <p className="text-white-50 small">
              Bắt đầu hành trình sự nghiệp của bạn ngay hôm nay.
            </p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} style={{ width: "100%" }}>
            <div className="auth-input-group">
              <div className="input-icon">
                <i className="bi bi-person-vcard-fill"></i>
              </div>
              <input
                type="text"
                name="fullname"
                className="auth-input"
                placeholder="Họ và tên"
                value={formData.fullname}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="auth-input-group">
              <div className="input-icon">
                <i className="bi bi-envelope-fill"></i>
              </div>
              <input
                type="email"
                name="email"
                className="auth-input"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="auth-input-group">
              <div className="input-icon">
                <i className="bi bi-lock-fill"></i>
              </div>
              <input
                type="password"
                name="password"
                className="auth-input"
                placeholder="Mật khẩu"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="auth-input-group">
              <div className="input-icon">
                <i className="bi bi-shield-lock-fill"></i>
              </div>
              <input
                type="password"
                name="confirmPassword"
                className="auth-input"
                placeholder="Xác nhận mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="options-row mb-4">
              <label
                className="remember-box"
                style={{ alignItems: "flex-start" }}
              >
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  style={{ marginTop: "4px" }}
                  disabled={loading}
                />
                <span
                  className="ms-2 small text-white-50"
                  style={{ lineHeight: "1.4" }}
                >
                  Tôi đồng ý với{" "}
                  <Link to="/terms" className="link-highlight">
                    Điều khoản sử dụng
                  </Link>{" "}
                  và{" "}
                  <Link to="/privacy" className="link-highlight">
                    Chính sách bảo mật
                  </Link>
                </span>
              </label>
            </div>

            <button 
              type="submit" 
              className="btn-auth-primary"
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Đăng ký tài khoản"}
            </button>

            <div className="auth-divider">
              <span>Hoặc đăng ký với</span>
            </div>

            <div className="social-buttons-box" style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Lỗi đăng ký Google")}
                size="large"
                text="signup"
              />
            </div>

            <div className="text-center mt-4 small text-white-50">
              Đã có tài khoản?{" "}
              <Link to="/dang-nhap" className="link-highlight">
                Đăng nhập ngay
              </Link>
            </div>
          </form>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <GlassCard className="auth-card-container">
        <div className="text-center mb-4">
          <div className="d-flex justify-content-center mb-3">
            <Logo />
          </div>
          <h2 className="fw-bold text-white">Xác nhận OTP</h2>
          <p className="text-white-50 small">
            Chúng tôi đã gửi mã xác nhận đến <strong>{registeredEmail}</strong>
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleVerifyOTP} style={{ width: "100%" }}>
          <div className="auth-input-group">
            <div className="input-icon">
              <i className="bi bi-shield-check"></i>
            </div>
            <input
              type="text"
              className="auth-input"
              placeholder="Nhập mã OTP 6 chữ số"
              value={otpData.otp}
              onChange={handleOtpChange}
              maxLength="6"
              inputMode="numeric"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn-auth-primary"
            disabled={loading}
          >
            {loading ? "Đang xác nhận..." : "Xác nhận OTP"}
          </button>

          <div className="text-center mt-4 small text-white-50">
            Không nhận được mã?{" "}
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading || resendCooldown > 0}
              style={{
                background: "none",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                textDecoration: "underline",
              }}
              className="link-highlight"
            >
              {resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : "Gửi lại"}
            </button>
          </div>

          <div className="text-center mt-3">
            <button
              type="button"
              onClick={goBackToRegister}
              disabled={loading}
              style={{
                background: "none",
                border: "none",
                color: "var(--primary-color)",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              ← Quay lại đăng ký
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default RegisterPage;
