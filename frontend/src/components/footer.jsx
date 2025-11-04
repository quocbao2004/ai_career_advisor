import React from "react";
import { Link } from "react-router-dom";
import Logo from "./logo";
import "../assets/css-custom/footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-column">
            <h4 className="footer-title">
              <Logo />
            </h4>
            <p className="footer-description">
              Định hướng nghề nghiệp thông minh với công nghệ AI, giúp bạn tìm
              đúng con đường phát triển sự nghiệp.
            </p>
          </div>
          <div className="footer-column">
            <h5 className="footer-heading">Liên Kết</h5>
            <ul className="footer-links">
              <li>Giới Thiệu</li>
              <li>Tính Năng</li>
              <li>Bảng Giá</li>
              <li>Blog</li>
            </ul>
          </div>
          <div className="footer-column">
            <h5 className="footer-heading">Liên Hệ</h5>
            <p className="footer-contact">Email: support@aicareer.vn</p>
            <p className="footer-contact">Hotline: 1900 0000</p>
          </div>
        </div>
        <hr className="footer-divider" />
        <div className="footer-bottom">
          <p>© 2024 AI Career Advisor. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
