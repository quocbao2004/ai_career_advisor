// Thành phần Header - Thanh điều hướng chính
import React from "react";
import { Link } from "react-router-dom";
import Logo from "./logo";
import "../assets/css-custom/header.css";

// Thành phần Header với các liên kết điều hướng
const Header = () => {
  return (
    <nav className="navbar navbar-expand-lg custom-navbar sticky-top px-4">
      <div className="container-fluid">
        {/* Logo - Liên kết về trang chủ */}
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <Logo />
        </Link>

        {/* Nút toggle cho di động */}
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

        {/* Menu điều hướng chính */}
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
              <Link className="nav-link" to="/about">
                Giới thiệu
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/contact">
                Liên hệ
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/quiz">
                Trắc nghiệm
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/career">
                Nghề nghiệp phù hợp
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/admin">
                Admin
              </Link>
            </li>
          </ul>
        </div>

        {/* Các nút xác thực */}
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-gold">Đăng nhập</button>
          <button className="btn btn-gold">Đăng ký</button>
        </div>
      </div>
    </nav>
  );
};


export default Header;
