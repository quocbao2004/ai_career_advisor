// Thành phần chân trang - Hiển thị thông tin công ty, liên kết và thông tin liên hệ
import React from "react";
import { } from "react-router-dom";
import Logo from "./logo";
import "../assets/css-custom/footer.css";

// Thành phần Footer chính
const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Cột đầu tiên - Thông tin về công ty và logo */}
          <div className="footer-column">
            <h4 className="footer-title">
              <Logo />
            </h4>
            <p className="footer-description">
              Định hướng nghề nghiệp thông minh với công nghệ AI, giúp bạn tìm
              đúng con đường phát triển sự nghiệp.
            </p>
          </div>

          {/* Cột thứ hai - Các liên kết điều hướng chính */}
          <div className="footer-column">
            <h5 className="footer-heading">Liên Kết</h5>
            <ul className="footer-links">
              <li>Giới Thiệu</li>
              <li>Tính Năng</li>
              <li>Bảng Giá</li>
              <li>Blog</li>
            </ul>
          </div>

          {/* Cột thứ ba - Thông tin liên hệ và hỗ trợ khách hàng */}
          <div className="footer-column">
            <h5 className="footer-heading">Liên Hệ</h5>
            <p className="footer-contact">Email: support@aicareer.vn</p>
            <p className="footer-contact">Hotline: 1900 0000</p>
          </div>
        </div>

        {/* Đường kẻ phân cách */}
        <hr className="footer-divider" />

        {/* Phần cuối - Thông tin bản quyền */}
        <div className="footer-bottom">
          <p>© 2024 AI Career Advisor. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
