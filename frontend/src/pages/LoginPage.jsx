import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import GlassCard from "../components/common/GlassCard";
import Logo from "../components/logo";
import { loginUser, saveTokens, saveUserInfo, googleLogin } from "../api/authApi";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../assets/css-custom/loginpage.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.email || !formData.password) {
      setError("Email và mật khẩu là bắt buộc");
      setLoading(false);
      return;
    }

    try {
      const result = await loginUser(formData.email, formData.password);
      
      if (result.success) {
        saveTokens(result.access, result.refresh);
        saveUserInfo(result.user);
        // Điều hướng dựa trên role
        if (result.user.role === "admin") {
          navigate("/trang-quan-tri", { replace: true });
        } else if (result.user.role === "user") {
          navigate("/trang-nguoi-dung", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else {
        setError(result.message || "Đăng nhập thất bại");
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
        // Điều hướng dựa trên role
        if (result.user.role === "admin") {
          navigate("/trang-quan-tri", { replace: true });
        } else if (result.user.role === "user") {
          navigate("/trang-nguoi-dung", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else {
        setError(result.message || "Lỗi đăng nhập Google");
      }
    } catch (err) {
      setError("Lỗi đăng nhập Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <GlassCard className="auth-card-container">
        <div className="text-center mb-4">
          <div className="d-flex justify-content-center mb-3">
            <Logo />
          </div>
          <h2 className="fw-bold text-white">Chào mừng trở lại</h2>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <div className="auth-input-group">
            <div className="input-icon">
              <i className="bi bi-envelope-fill"></i>
            </div>
            <input
              type="email"
              name="email"
              className="auth-input"
              placeholder="name@gmail.com"
              value={formData.email}
              onChange={handleChange}
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
              disabled={loading}
            />
          </div>

          <div className="options-row">
            <label className="remember-box">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={loading}
              />
              <span className="custom-checkbox"></span>
              <span className="ms-2 small text-white-50">
                Ghi nhớ đăng nhập
              </span>
            </label>

            <Link to="/quen-mat-khau" className="forgot-link small">
              Quên mật khẩu?
            </Link>
          </div>

          <button 
            type="submit" 
            className="btn-auth-primary"
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          <div className="auth-divider">
            <span>Hoặc tiếp tục với</span>
          </div>

          <div className="social-buttons-box" style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Lỗi đăng nhập Google")}
              size="large"
              text="signin"
            />
          </div>

          <div className="text-center mt-4 small text-white-50">
            Chưa có tài khoản?{" "}
            <Link to="/dang-ky" className="link-highlight">
              Đăng ký ngay
            </Link>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default LoginPage;
