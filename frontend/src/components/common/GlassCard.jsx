import React from "react";

// Đây là component bao bọc (wrapper) để tái sử dụng style kính
const GlassCard = ({ children, className = "", style = {}, ...props }) => {
  return (
    <div className={`card-glass ${className}`} style={style} {...props}>
      {children}
    </div>
  );
};

export default GlassCard;
