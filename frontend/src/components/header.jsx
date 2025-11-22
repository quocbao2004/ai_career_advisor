import React from "react";
import { Link } from "react-router-dom";
import Logo from "./logo";
import "../assets/css-custom/header.css";

const Header = () => {
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
              <Link className="nav-link" to="/dinh-huong-nghe-nghiep">
                Nghề nghiệp phù hợp
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/quan-tri">
                Trang quản trị
              </Link>
            </li>
            <li className="nav-item">
              <a href="http://127.0.0.1:8000/admin/">Admin</a>
            </li>
          </ul>
        </div>

        {/* Các nút xác thực */}
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-gold">
            <a href="/dang-nhap">Đăng nhập</a>
          </button>
          <button className="btn btn-gold">
            <a href="/dang-ky">Đăng ký</a>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Header;
