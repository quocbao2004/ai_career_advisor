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
import { getLearningPathDetail, toggleLearningPathItem } from "../api/learningPathApi";
import "../assets/css-custom/learning-path-detail.css";

// Component hiển thị chi tiết lộ trình học tập
const LearningPathDetail = () => {
  // Lấy id lộ trình từ URL
  const { id } = useParams();
  const navigate = useNavigate();

  // Quản lý state
  const [pathData, setPathData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lấy dữ liệu lộ trình
  useEffect(() => {
    const fetchPath = async () => {
      try {
        const result = await getLearningPathDetail(id);
        if (result.success) {
          setPathData(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError("Không thể tải dữ liệu lộ trình");
      } finally {
        setLoading(false);
      }
    };
    fetchPath();
  }, [id]);

  // Chuyển đổi trạng thái hoàn thành của mục
  const handleToggleItem = async (itemId) => {
    // Cập nhật UI ngay lập tức trước khi gọi API
    setPathData((prev) => {
      // Đảo trạng thái hoàn thành của mục được chọn
      const newItems = prev.items.map((item) =>
        item.id === itemId
          ? { ...item, is_completed: !item.is_completed }
          : item
      );
      // Tính lại phần trăm tiến độ
      const completedCount = newItems.filter((i) => i.is_completed).length;
      const newProgress = (completedCount / newItems.length) * 100;
      return { ...prev, items: newItems, progress_percentage: newProgress };
    });

    // Gọi API cập nhật
    try {
      await toggleLearningPathItem(itemId);
    } catch (e) {
      console.error(e);
    }
  };

  // Trạng thái đang tải
  if (loading) {
    return (
      <div className="lpd-page-wrapper lpd-loading">
        <Loader2 size={48} className="lpd-spinner" />
      </div>
    );
  }

  // Trạng thái lỗi
  if (error || !pathData) {
    return (
      <div className="lpd-page-wrapper lpd-loading">
        <p className="text-secondary">{error || "Không tìm thấy dữ liệu"}</p>
      </div>
    );
  }

  return (
    <div className="lpd-page-wrapper">
      {/* Hiệu ứng nền */}
      <div className="lpd-blob lpd-blob-top" />
      <div className="lpd-blob lpd-blob-bottom" />

      {/* Container chính */}
      <div className="container py-4 py-md-5" style={{ position: "relative", zIndex: 1 }}>
        {/* Nút quay lại */}
        <button onClick={() => navigate(-1)} className="lpd-back-btn">
          <div className="lpd-back-btn-icon">
            <ArrowLeft size={18} />
          </div>
          <span>Quay lại</span>
        </button>

        {/* Thẻ tiêu đề */}
        <div className="lpd-glass-card lpd-header-card card border-0 shadow-lg">
          <div className="card-body p-3 p-md-4">
            <div className="row align-items-center g-3">
              <div className="col-12 col-md-8">
                <div className="lpd-header-badge">
                  <Zap size={14} /> Lộ trình cá nhân hóa
                </div>
                <h1 className="lpd-title">{pathData.title}</h1>
                <p className="lpd-career-label">
                  Mục tiêu: <span className="lpd-career-badge">{pathData.career_title}</span>
                </p>
              </div>

              {/* Vòng tròn tiến độ */}
              <div className="col-12 col-md-4">
                <div className="lpd-progress-box">
                  <div className="lpd-progress-circle">
                    <svg viewBox="0 0 36 36">
                      <path
                        className="lpd-progress-circle-bg"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="lpd-progress-circle-fill"
                        strokeDasharray={`${pathData.progress_percentage}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="lpd-progress-value">
                      {Math.round(pathData.progress_percentage)}%
                    </div>
                  </div>
                  <div className="lpd-progress-info">
                    <span className="lpd-progress-label">Tiến độ</span>
                    <span className={`lpd-progress-status ${pathData.progress_percentage === 100 ? 'completed' : 'in-progress'}`}>
                      {pathData.progress_percentage === 100 ? "Hoàn thành" : "Đang học"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dòng thời gian các bước */}
        <div className="lpd-timeline">
          <div className="lpd-timeline-line" />

          {pathData.items.map((item, index) => {
            const isCompleted = item.is_completed;
            // Mục được mở khóa nếu là mục đầu tiên hoặc mục trước đã hoàn thành
            const isUnlocked = index === 0 || pathData.items[index - 1].is_completed;

            return (
              <div key={item.id} className="lpd-timeline-item">
                {/* Biểu tượng trạng thái */}
                <div className={`lpd-icon-circle ${isCompleted ? 'completed' : isUnlocked ? 'active' : 'locked'}`}>
                  {isCompleted ? (
                    <CheckCircle size={24} color="#fff" />
                  ) : isUnlocked ? (
                    <div className="lpd-pulse-dot" />
                  ) : (
                    <Lock size={20} color="#64748b" />
                  )}
                </div>

                {/* Thẻ nội dung */}
                <div className={`lpd-glass-card lpd-content-card ${!isUnlocked ? 'locked' : ''}`}>
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                    <div>
                      <span className={`lpd-step-label ${isUnlocked ? 'active' : 'locked'}`}>
                        Bước {item.order_index}
                      </span>
                      <h3 className={`lpd-step-title ${isCompleted ? 'completed' : 'normal'}`}>
                        {item.custom_task_name}
                      </h3>
                      {item.description && (
                        <p className="lpd-step-desc">{item.description}</p>
                      )}
                    </div>

                    {/* Nút chuyển đổi trạng thái */}
                    <button
                      onClick={() => handleToggleItem(item.id)}
                      disabled={!isUnlocked}
                      className={`lpd-toggle-btn ${isCompleted ? 'completed' : ''}`}
                      title={isCompleted ? "Đánh dấu chưa xong" : "Đánh dấu hoàn thành"}
                    >
                      {isCompleted ? (
                        <CheckCircle size={24} />
                      ) : (
                        <div className="lpd-toggle-placeholder" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Thông báo hoàn thành */}
        {pathData.progress_percentage === 100 && (
          <div className="lpd-success-card card border-0">
            <div className="card-body p-4 p-md-5">
              <div className="lpd-success-icon">
                <Trophy size={40} color="#fff" />
              </div>
              <h2 className="lpd-success-title">Chúc mừng! Bạn đã hoàn thành!</h2>
              <p className="lpd-success-desc">
                Bạn đã sẵn sàng để chinh phục vị trí <strong>{pathData.career_title}</strong>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningPathDetail;