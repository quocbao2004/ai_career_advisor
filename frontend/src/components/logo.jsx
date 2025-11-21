import React from "react";
import { Link } from "react-router-dom";

const Logo = () => {
  return (
    <Link to="/" className="logo-container">
      <div className="logo-icon">AI</div>
      <div className="logo-text">CAREER ADVISOR</div>
    </Link>
  );
};

export default Logo;
