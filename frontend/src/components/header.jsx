import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Logo from "./logo";
import {
  getUserInfo,
  clearTokens,
  logoutUser,
  getCachedOnboardingStatus,
  hasSeenOnboardingWelcome,
} from "../api/authApi";
import "../assets/css-custom/header.css";
import { toast } from "react-toastify";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    setUserInfo(getUserInfo());
  }, [location]);

  const isOnboardingLocked = useMemo(() => {
    if (!userInfo) return false;
    if (userInfo.role === "admin") return false;
    const cachedCompleted = getCachedOnboardingStatus();
    const userCompleted = userInfo.hasCompletedOnboarding === true;
    const userNeeds = userInfo.needsOnboarding === true;
    const hasCompleted = cachedCompleted || (userCompleted && !userNeeds);
    return !hasCompleted;
  }, [userInfo]);

  const allowOnboardingPath = (to) => {
    try {
      if (typeof to !== "string") return false;

      const welcomeSeen = hasSeenOnboardingWelcome(userInfo?.id);
      if (!welcomeSeen) {
        return to === "/chao-mung";
      }

      return to.startsWith("/trac-nghiem");
    } catch {
      return false;
    }
  };

  const handleLockedNav = (e, to) => {
    if (!isOnboardingLocked) return;

    if (allowOnboardingPath(to)) return;

    e.preventDefault();

    try {
      toast.info("Xin hãy làm theo từng bước hướng dẫn.", {
        toastId: "onboarding-flow-warning",
      });
    } catch {
      // ignore
    }

    const welcomeSeen = hasSeenOnboardingWelcome(userInfo?.id);
    navigate(welcomeSeen ? "/trac-nghiem" : "/chao-mung", { replace: true });
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      // Ignore error
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
              <Link
                className="nav-link"
                to="/"
                onClick={(e) => handleLockedNav(e, "/")}
              >
                Trang chủ
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className="nav-link"
                to="/ve-chung-toi"
                onClick={(e) => handleLockedNav(e, "/ve-chung-toi")}
              >
                Giới thiệu
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className="nav-link"
                to="/lien-he"
                onClick={(e) => handleLockedNav(e, "/lien-he")}
              >
                Liên hệ
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className="nav-link"
                to="/trac-nghiem"
                onClick={(e) => handleLockedNav(e, "/trac-nghiem")}
              >
                Trắc nghiệm
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className="nav-link"
                to="/chat"
                onClick={(e) => handleLockedNav(e, "/chat")}
              >
                Nhận tư vấn với AI
              </Link>
            </li>
          </ul>
        </div>

        <div className="d-flex align-items-center gap-2">
          {userInfo ? (
            <div className="dropdown">
              <a
                href="#"
                className="d-flex align-items-center text-white text-decoration-none dropdown-toggle"
                id="dropdownUserAvatar"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <img
                  src={userInfo.avatar || DEFAULT_AVATAR}
                  alt="Avatar"
                  width="40"
                  height="40"
                  className="rounded-circle border border-2 border-warning"
                  style={{ objectFit: "cover" }}
                />
                <span className="ms-2 d-none d-lg-inline fw-bold small text-dark">
                  {userInfo.fullName}
                </span>
              </a>

              <ul
                className="dropdown-menu dropdown-menu-end shadow"
                aria-labelledby="dropdownUserAvatar"
                style={{ minWidth: "200px" }}
              >
                <li className="px-3 py-2 border-bottom">
                  <div className="fw-bold text-truncate">
                    {userInfo.fullName}
                  </div>
                  <small className="text-muted">@{userInfo.role}</small>
                </li>

                {(userInfo.role === "user" || userInfo.role === "admin") && (
                  <li>
                    <Link
                      className="dropdown-item py-2"
                      to="/dashboard"
                      onClick={(e) => handleLockedNav(e, "/dashboard")}
                    >
                      <i className="bi bi-speedometer2 me-2"></i> Dashboard
                    </Link>
                  </li>
                )}

                {userInfo.role === "admin" && (
                  <li>
                    <Link className="dropdown-item py-2" to="/trang-quan-tri">
                      <i className="bi bi-gear-fill me-2"></i> Trang quản trị
                    </Link>
                  </li>
                )}

                <li>
                  <Link
                    className="dropdown-item py-2"
                    to="/learning-path"
                    onClick={(e) => handleLockedNav(e, "/learning-path")}
                  >
                    <i className="bi bi-sliders me-2"></i> Lộ trình học của tôi
                  </Link>
                </li>

                <li>
                  <hr className="dropdown-divider" />
                </li>

                {/* Nút Đăng xuất */}
                <li>
                  <button
                    className="dropdown-item text-danger py-2"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i> Đăng xuất
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <>
              <Link className="btn btn-outline-gold" to="/dang-nhap">
                Đăng nhập
              </Link>
              <Link className="btn btn-gold ms-2" to="/dang-ky">
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
