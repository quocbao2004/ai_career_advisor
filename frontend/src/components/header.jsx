import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Logo from "./logo";
import { getUserInfo, clearTokens, logoutUser } from "../api/authApi";
import "../assets/css-custom/header.css";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState(null);

  // Cập nhật userInfo bất cứ khi nào location thay đổi hoặc component mount
  useEffect(() => {
    setUserInfo(getUserInfo());
  }, [location]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      // vẫn xóa token ngay cả khi logout call thất bại
    } finally {
      clearTokens();
      setUserInfo(null);
      navigate("/dang-nhap");
    }
  };

  return (
    <nav
      className="navbar navbar-expand-lg custom-navbar sticky-top px-4"
      id="header-custom"
    >
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <Logo />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div
          className="collapse navbar-collapse justify-content-center"
          id="mainNavbar"
        >
          <ul className="navbar-nav mb-2 mb-lg-0 gap-lg-3">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                Trang chủ
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/ve-chung-toi">
                Giới thiệu
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/lien-he">
                Liên hệ
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/trac-nghiem">
                Trắc nghiệm
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/chat">
                Nhận tư vấn với AI
              </Link>
            </li>
            {userInfo && userInfo.role === "user" && (
              <li className="nav-item">
                <Link className="nav-link" to="/trang-nguoi-dung">
                  Trang người dùng
                </Link>
              </li>
            )}
            {userInfo && userInfo.role === "admin" && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/trang-quan-tri">
                    Thống kê
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Nút xác thực hoặc User Menu */}
        <div className="d-flex align-items-center gap-2">
          {userInfo ? (
            <>
              <span className="text-white small">
                Xin chào, {userInfo.fullName}
              </span>
              <button
                className="btn btn-outline-gold btn-sm"
                onClick={handleLogout}
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-outline-gold" to="/dang-nhap">
                Đăng nhập
              </Link>
              <Link className="btn btn-gold" to="/dang-ky">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
