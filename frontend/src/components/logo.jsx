// Thành phần logo - Hiển thị biểu tượng và tên công ty
import React from "react";
import "../assets/css-custom/main.css";

// Thành phần Logo chính
const Logo = () => {
  return (
    <div className="logo-container">
      {/* Phần biểu tượng - Chữ AI */}
      <div className="logo-icon">AI</div>
      {/* Phần văn bản - Tên công ty */}
      <div className="logo-text">CAREER ADVISOR</div>
    </div>
  );
};

export default Logo;
