import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "../api/authApi";
import "bootstrap-icons/font/bootstrap-icons.css";

const UserDashboard = () => {
  const navigate = useNavigate();
  const userInfo = getUserInfo();

  useEffect(() => {
    if (!userInfo) {
      navigate("/dang-nhap", { replace: true });
    }
  }, [userInfo, navigate]);

  return (
    <div className="dashboard-wrapper" style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-5">
        <div className="row mb-4">
          <div className="col-lg-8">
            <h1 className="text-white fw-bold">
              <i className="bi bi-speedometer2 me-3"></i>
              Dashboard Người Dùng
            </h1>
            <p className="text-white-50">
              Chào mừng, <strong>{userInfo?.fullName}</strong>!
            </p>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-lg-4">
            <div className="card bg-dark border-light">
              <div className="card-body">
                <h5 className="card-title text-white">
                  <i className="bi bi-person-circle me-2"></i>
                  Thông tin cá nhân
                </h5>
                <p className="text-white-50 mb-2">Email: {userInfo?.email}</p>
                <p className="text-white-50 mb-0">Role: {userInfo?.role}</p>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card bg-dark border-light">
              <div className="card-body">
                <h5 className="card-title text-white">
                  <i className="bi bi-book-half me-2"></i>
                  Khóa học
                </h5>
                <p className="text-white-50 mb-0">Đang học: 0 khóa</p>
                <p className="text-white-50 mb-0">Hoàn thành: 0 khóa</p>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card bg-dark border-light">
              <div className="card-body">
                <h5 className="card-title text-white">
                  <i className="bi bi-graph-up me-2"></i>
                  Tiến độ
                </h5>
                <div className="progress">
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{ width: "0%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-12">
            <div className="card bg-dark border-light">
              <div className="card-body">
                <h5 className="card-title text-white mb-4">
                  <i className="bi bi-lightning-fill me-2"></i>
                  Các hành động nhanh
                </h5>
                <div className="row g-3">
                  <div className="col-md-4">
                    <button
                      className="btn btn-outline-primary w-100"
                      onClick={() => navigate("/trac-nghiem")}
                    >
                      <i className="bi bi-pencil-square me-2"></i>
                      Bài trắc nghiệm
                    </button>
                  </div>
                  <div className="col-md-4">
                    <button className="btn btn-outline-secondary w-100">
                      <i className="bi bi-mortarboard me-2"></i>
                      Khóa học
                    </button>
                  </div>
                  <div className="col-md-4">
                    <button className="btn btn-outline-warning w-100">
                      <i className="bi bi-gear me-2"></i>
                      Cài đặt
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
