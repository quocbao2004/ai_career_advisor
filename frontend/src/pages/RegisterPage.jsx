import React, { useState } from "react";
import { Link } from "react-router-dom";
import GlassCard from "../components/common/GlassCard";
import Logo from "../components/logo"; // Thêm Logo cho đẹp

import "../assets/css-custom/loginpage.css";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
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
    if (formData.password !== formData.confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (!formData.agreeTerms) {
      alert("Bạn phải đồng ý với điều khoản sử dụng!");
      return;
    }
    console.log("Register Data:", formData);
    // Gọi API đăng ký tại đây
  };

  return (
    <div className="auth-wrapper">
      {/* Sử dụng GlassCard làm container chính */}
      <GlassCard className="auth-card-container">
        <div className="text-center mb-4">
          {/* Logo nhỏ căn giữa */}
          <div className="d-flex justify-content-center mb-3">
            <Logo />
          </div>
          <h2 className="fw-bold text-white">Tạo tài khoản mới</h2>
          <p className="text-white-50 small">
            Bắt đầu hành trình sự nghiệp của bạn ngay hôm nay.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          {/* Full Name Input */}
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
            />
          </div>

          {/* Email Input */}
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

          {/* Confirm Password Input */}
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
            />
          </div>

          {/* Terms Checkbox */}
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

          {/* Submit Button */}
          <button type="submit" className="btn-auth-primary">
            Đăng ký tài khoản
          </button>

          {/* Social Login */}
          <div className="auth-divider">
            <span>Đăng ký với</span>
          </div>

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

          {/* Link to Login */}
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
};

export default RegisterPage;
