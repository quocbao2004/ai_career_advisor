// Trang đăng nhập cho người dùng
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import GlassCard from "../components/common/GlassCard";
import Logo from "../components/logo";
import {
  loginUser,
  saveTokens,
  saveUserInfo,
  googleLogin,
  saveOnboardingStatus,
  hasSeenOnboardingWelcome,
} from "../api/authApi";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../assets/css-custom/loginpage.css";

const LoginPage = () => {
  const navigate = useNavigate();
  // Dữ liệu form đăng nhập
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  // Trạng thái loading khi đang xử lý
  const [loading, setLoading] = useState(false);
  // Thông báo lỗi nếu có
  // Thông báo lỗi nếu có
  const [error, setError] = useState("");

  // Xử lý khi user thay đổi giá trị trong form
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      // Nếu là checkbox thì lấy checked, còn lại lấy value
      [name]: type === "checkbox" ? checked : value,
    }));
    // Xóa lỗi khi user bắt đầu nhập lại
    setError("");
  };

  // Xử lý khi user submit form đăng nhập
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Kiểm tra email và mật khẩu không được để trống
    if (!formData.email || !formData.password) {
      setError("Email và mật khẩu là bắt buộc");
      setLoading(false);
      return;
    }

    try {
      // Gọi API đăng nhập
      const result = await loginUser(formData.email, formData.password);

      if (result.success) {
        // Lưu token và thông tin user vào localStorage
        saveTokens(result.access, result.refresh);
        saveUserInfo(result.user);

        // Lưu trạng thái onboarding từ backend response
        const completed =
          result.hasCompletedOnboarding ?? result.user?.hasCompletedOnboarding;
        if (completed !== undefined) {
          saveOnboardingStatus(Boolean(completed));
        }

        // Đợi localStorage được set xong trước khi chuyển trang
        setTimeout(() => {
          // Admin thì vào trang quản trị
          if (result.user.role === "admin") {
            navigate("/trang-quan-tri", { replace: true });
          // User mới cần làm onboarding
          } else if (result.user?.hasCompletedOnboarding === false) {
            // Kiểm tra đã xem trang chào mừng chưa
            const welcomeSeen = hasSeenOnboardingWelcome(result.user?.id);
            navigate(welcomeSeen ? "/trac-nghiem" : "/chao-mung", { replace: true });
          } else {
            // User bình thường vào dashboard
            navigate("/dashboard", { replace: true });
          }
        }, 0);
      } else {
        setError(result.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      setError("Lỗi kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi đăng nhập Google thành công
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      // Gọi API đăng nhập bằng Google credential
      const result = await googleLogin(credentialResponse.credential);

      if (result.success) {
        // Lưu token và thông tin user vào localStorage
        saveTokens(result.access, result.refresh);
        saveUserInfo(result.user);
        
        // Lưu trạng thái onboarding từ backend response
        const completed =
          result.hasCompletedOnboarding ?? result.user?.hasCompletedOnboarding;
        if (completed !== undefined) {
          saveOnboardingStatus(Boolean(completed));
        }

        // Đánh dấu nếu là user Google mới tạo
        if (result.isNewGoogleUser !== undefined) {
          localStorage.setItem("is_new_google_user", result.isNewGoogleUser.toString());
        }

        // Đợi localStorage được set xong trước khi chuyển trang
        setTimeout(() => {
          // Admin thì vào trang quản trị
          if (result.user.role === "admin") {
            navigate("/trang-quan-tri", { replace: true });
          // User mới cần làm onboarding
          } else if (result.user?.hasCompletedOnboarding === false) {
            // Kiểm tra đã xem trang chào mừng chưa
            const welcomeSeen = hasSeenOnboardingWelcome(result.user?.id);
            navigate(welcomeSeen ? "/trac-nghiem" : "/chao-mung", { replace: true });
          } else {
            // User bình thường vào dashboard
            navigate("/dashboard", { replace: true });
          }
        }, 0);
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

          <div className="options-row d-flex flex-column flex-md-row justify-content-between align-items-center">
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

          <button type="submit" className="btn-auth-primary" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          <div className="auth-divider">
            <span>Hoặc tiếp tục với</span>
          </div>

          <div className="social-buttons-box d-flex gap-2 justify-content-center">
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
