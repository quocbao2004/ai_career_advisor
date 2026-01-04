import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Lock,
  ArrowLeft,
  Loader2,
  Zap,
  Trophy,
} from "lucide-react";
import { fetchWithAuth } from "../api/authApi.js";
// Đảm bảo bạn đã import bootstrap css ở file index.js hoặc App.js
// import 'bootstrap/dist/css/bootstrap.min.css';

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "https://ai-career-advisor-4006.onrender.com";

const LearningPathDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pathData, setPathData] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- 1. Fetch Data ---
  useEffect(() => {
    const fetchPath = async () => {
      try {
        const res = await fetchWithAuth(
          `${API_BASE}/api/learning/paths/${id}/`
        );
        if (res.ok) {
          const data = await res.json();
          setPathData(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPath();
  }, [id]);

  // --- 2. Logic Update Status ---
  const handleToggleItem = async (itemId) => {
    setPathData((prev) => {
      const newItems = prev.items.map((item) =>
        item.id === itemId
          ? { ...item, is_completed: !item.is_completed }
          : item
      );
      const completedCount = newItems.filter((i) => i.is_completed).length;
      const newProgress = (completedCount / newItems.length) * 100;
      return { ...prev, items: newItems, progress_percentage: newProgress };
    });
    try {
      await fetchWithAuth(`${API_BASE}/api/learning/items/${itemId}/toggle/`, {
        method: "POST",
      });
    } catch (e) {
      console.error(e);
    }
  };

  // --- Styles Custom cho hiệu ứng Glass/Neon mà Bootstrap mặc định không có ---
  const styles = {
    pageWrapper: {
      minHeight: "100vh",
      backgroundColor: "#0f172a", // Slate-900
      color: "#fff",
      position: "relative",
      overflowX: "hidden",
    },
    glassCard: {
      background: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "1.5rem",
    },
    iconCircle: (isActive, isCompleted) => ({
      width: "56px",
      height: "56px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: isCompleted
        ? "3px solid #10b981" // Green
        : isActive
        ? "3px solid #6366f1" // Indigo
        : "3px solid #334155", // Slate-700
      backgroundColor: isCompleted
        ? "#10b981"
        : isActive
        ? "#4f46e5"
        : "#1e293b",
      boxShadow:
        isActive || isCompleted
          ? `0 0 20px ${
              isCompleted ? "rgba(16,185,129,0.4)" : "rgba(99,102,241,0.4)"
            }`
          : "none",
      transition: "all 0.3s ease",
      zIndex: 10,
    }),
    timelineLine: {
      position: "absolute",
      top: "20px",
      bottom: "40px",
      left: "27px", // Căn giữa icon 56px
      width: "2px",
      background: "linear-gradient(to bottom, #6366f1, #a855f7, transparent)",
      opacity: 0.3,
    },
    toggleBtn: (isCompleted) => ({
      width: "48px",
      height: "48px",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: isCompleted
        ? "1px solid #10b981"
        : "1px solid rgba(255,255,255,0.1)",
      backgroundColor: isCompleted
        ? "rgba(16,185,129,0.2)"
        : "rgba(255,255,255,0.05)",
      color: isCompleted ? "#34d399" : "#94a3b8",
      transition: "all 0.2s",
    }),
  };

  // --- Render ---
  if (loading)
    return (
      <div
        style={styles.pageWrapper}
        className="d-flex align-items-center justify-content-center"
      >
        <Loader2
          className="spinner-border text-primary"
          style={{ width: "3rem", height: "3rem" }}
        />
      </div>
    );

  if (!pathData)
    return (
      <div
        style={styles.pageWrapper}
        className="d-flex align-items-center justify-content-center"
      >
        Không tìm thấy dữ liệu
      </div>
    );

  return (
    <div style={styles.pageWrapper}>
      {/* Background Blobs (Trang trí) */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "500px",
          height: "500px",
          background: "rgba(79, 70, 229, 0.2)",
          filter: "blur(120px)",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          width: "500px",
          height: "500px",
          background: "rgba(147, 51, 234, 0.2)",
          filter: "blur(120px)",
          borderRadius: "50%",
          transform: "translate(50%, 50%)",
          pointerEvents: "none",
        }}
      />

      {/* Main Container */}
      <div
        className="container py-5"
        style={{ position: "relative", zIndex: 1 }}
      >
        {/* Top Bar */}
        <button
          onClick={() => navigate(-1)}
          className="btn btn-link text-decoration-none text-secondary d-flex align-items-center gap-2 mb-4 p-0 hover-text-white"
          style={{ boxShadow: "none" }}
        >
          <div className="bg-white bg-opacity-10 rounded-circle p-2 d-flex">
            <ArrowLeft size={18} />
          </div>
          <span className="text-light">Quay lại Dashboard</span>
        </button>

        {/* Header Card */}
        <div className="card mb-5 border-0 shadow-lg" style={styles.glassCard}>
          <div className="card-body p-4 p-md-5">
            <div className="row align-items-center g-4">
              <div className="col-md-8">
                <div className="d-flex align-items-center gap-2 text-info fw-bold text-uppercase small mb-2">
                  <Zap size={14} /> Lộ trình cá nhân hóa
                </div>
                <h1 className="display-5 fw-bold text-white mb-3">
                  {pathData.title}
                </h1>
                <p className="text-secondary fs-5 mb-0">
                  Mục tiêu:{" "}
                  <span className="text-white badge bg-light bg-opacity-10 fw-medium px-3 py-2">
                    {pathData.career_title}
                  </span>
                </p>
              </div>

              {/* Progress Circle (Sử dụng Bootstrap Flexbox) */}
              <div className="col-md-4">
                <div
                  className="d-flex align-items-center gap-3 p-3 rounded-4"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    className="position-relative"
                    style={{ width: "80px", height: "80px" }}
                  >
                    <svg
                      className="w-100 h-100"
                      style={{ transform: "rotate(-90deg)" }}
                      viewBox="0 0 36 36"
                    >
                      <path
                        className="text-secondary"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="3"
                      />
                      <path
                        style={{
                          stroke: "#6366f1",
                          filter: "drop-shadow(0 0 5px rgba(99,102,241,0.8))",
                          transition: "stroke-dasharray 1s ease",
                        }}
                        strokeDasharray={`${pathData.progress_percentage}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        strokeLinecap="round"
                        strokeWidth="3"
                      />
                    </svg>
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center fw-bold text-white">
                      {Math.round(pathData.progress_percentage)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-secondary small">Tiến độ</div>
                    <div
                      className={`fw-bold ${
                        pathData.progress_percentage === 100
                          ? "text-success"
                          : "text-white"
                      }`}
                    >
                      {pathData.progress_percentage === 100
                        ? "Hoàn thành"
                        : "Đang học"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Area */}
        <div className="position-relative ps-2 ps-md-4">
          {/* Đường kẻ dọc */}
          <div style={styles.timelineLine} />

          {pathData.items.map((item, index) => {
            const isCompleted = item.is_completed;
            const isUnlocked =
              index === 0 || pathData.items[index - 1].is_completed;

            return (
              <div
                key={item.id}
                className="d-flex gap-4 mb-5 position-relative"
              >
                {/* 1. Icon Circle */}
                <div
                  className="flex-shrink-0"
                  style={styles.iconCircle(isUnlocked, isCompleted)}
                >
                  {isCompleted ? (
                    <CheckCircle size={24} color="#fff" />
                  ) : isUnlocked ? (
                    <div
                      className="bg-white rounded-circle"
                      style={{
                        width: "12px",
                        height: "12px",
                        animation: "pulse 2s infinite",
                      }}
                    />
                  ) : (
                    <Lock size={20} className="text-secondary" />
                  )}
                </div>

                {/* 2. Content Card */}
                <div
                  className={`flex-grow-1 card border-0 ${
                    !isUnlocked ? "opacity-50" : ""
                  }`}
                  style={{
                    ...styles.glassCard,
                    background: isUnlocked
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.2)",
                    pointerEvents: isUnlocked ? "auto" : "none",
                    transition: "transform 0.3s ease, background 0.3s",
                  }}
                  onMouseEnter={(e) =>
                    isUnlocked &&
                    (e.currentTarget.style.transform = "translateY(-5px)")
                  }
                  onMouseLeave={(e) =>
                    isUnlocked &&
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  <div className="card-body p-4">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                      <div>
                        <span
                          className={`d-block text-uppercase fw-bold small mb-2 ${
                            isUnlocked ? "text-primary" : "text-secondary"
                          }`}
                        >
                          Bước {item.order_index}
                        </span>
                        <h3
                          className={`h4 fw-bold mb-2 ${
                            isCompleted
                              ? "text-success text-decoration-line-through"
                              : "text-white"
                          }`}
                        >
                          {item.custom_task_name}
                        </h3>
                        {item.description && (
                          <p
                            className="text-secondary mb-0"
                            style={{ maxWidth: "600px" }}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleToggleItem(item.id)}
                        disabled={!isUnlocked}
                        className="btn p-0"
                        style={styles.toggleBtn(isCompleted)}
                        title={
                          isCompleted
                            ? "Đánh dấu chưa xong"
                            : "Đánh dấu hoàn thành"
                        }
                      >
                        {isCompleted ? (
                          <CheckCircle size={24} />
                        ) : (
                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              border: "2px solid currentColor",
                              opacity: 0.5,
                            }}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Success Footer */}
        {pathData.progress_percentage === 100 && (
          <div
            className="card border-0 mt-5 text-center overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(6,78,59,0.8), rgba(19,78,74,0.8))",
              border: "1px solid #10b981",
              borderRadius: "1.5rem",
            }}
          >
            <div className="card-body p-5">
              <div
                className="mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle bg-success shadow"
                style={{ width: "80px", height: "80px" }}
              >
                <Trophy size={40} className="text-white" />
              </div>
              <h2 className="fw-bold text-white mb-3">
                Chúc mừng! Bạn đã hoàn thành!
              </h2>
              <p className="text-light opacity-75 fs-5">
                Bạn đã sẵn sàng để chinh phục vị trí{" "}
                <strong>{pathData.career_title}</strong>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningPathDetail;
