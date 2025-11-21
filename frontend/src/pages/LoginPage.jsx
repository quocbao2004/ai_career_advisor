import React, { useState } from "react";
import { Link } from "react-router-dom";
import GlassCard from "../components/common/GlassCard";
import Logo from "../components/logo"; // Tái sử dụng Logo nếu muốn đẹp hơn
import "bootstrap-icons/font/bootstrap-icons.css";
import "../assets/css-custom/loginpage.css"; // Sẽ cập nhật file này ở bước 2

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login Data:", formData);
    // Xử lý logic đăng nhập tại đây
  };

  return (
    <div className="auth-wrapper">
      {/* Không cần Ocean Wrapper/Bubbles nữa vì MainLayout đã lo background.
         Chỉ cần căn giữa GlassCard.
      */}

      <GlassCard className="auth-card-container">
        {/* Header của Form */}
        <div className="text-center mb-4">
          {/* Optional: Thêm Logo nhỏ để nhận diện thương hiệu */}
          <div className="d-flex justify-content-center mb-3">
            <Logo />
          </div>
          <h2 className="fw-bold text-white">Chào mừng trở lại</h2>
          <p className="text-white-50 small">
            Nhập thông tin để truy cập cố vấn AI.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          {/* Email Input */}
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
              required
            />
          </div>

          {/* Password Input */}
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
            />
          </div>

          {/* Options: Remember & Forgot Password */}
          <div className="options-row">
            <label className="remember-box">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
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

          {/* Sign In Button */}
          <button type="submit" className="btn-auth-primary">
            Đăng nhập
          </button>

          {/* Divider */}
          <div className="auth-divider">
            <span>Hoặc tiếp tục với</span>
          </div>

          {/* Social Buttons */}
          <div className="social-buttons-box">
            <button type="button" className="btn-social google">
              <i className="bi bi-google"></i>
            </button>
            <button type="button" className="btn-social github">
              <i className="bi bi-github"></i>
            </button>
            <button type="button" className="btn-social facebook">
              <i className="bi bi-facebook"></i>
            </button>
          </div>

          {/* Footer Text */}
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
