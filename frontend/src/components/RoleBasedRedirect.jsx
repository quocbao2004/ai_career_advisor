import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, getUserInfo } from "../api/authApi";

const RoleBasedRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/dang-nhap", { replace: true });
      return;
    }

    const userInfo = getUserInfo();

    if (!userInfo) {
      navigate("/dang-nhap", { replace: true });
      return;
    }

    // Điều hướng dựa trên role
    if (userInfo.role === "admin") {
      navigate("/trang-quan-tri", { replace: true });
    } else if (userInfo.role === "user") {
      navigate("/trang-nguoi-dung", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="spinner-border text-white" role="status">
        <span className="visually-hidden">Đang tải...</span>
      </div>
    </div>
  );
};

export default RoleBasedRedirect;
