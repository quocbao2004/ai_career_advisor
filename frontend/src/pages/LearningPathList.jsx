// Component hiển thị danh sách các lộ trình học tập của người dùng
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ArrowRight,
  Loader2,
  GraduationCap,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { getUserLearningPaths } from "../api/learningPathApi";
import "../assets/css-custom/learning-path-list.css";

const LearningPathList = () => {
  const navigate = useNavigate();
  // Danh sách tất cả lộ trình của user
  const [paths, setPaths] = useState([]);
  // Trạng thái loading khi fetch dữ liệu
  const [loading, setLoading] = useState(true);
  // Thông báo lỗi nếu có
  const [error, setError] = useState(null);
  // ID của lộ trình đang được chọn để xem chi tiết
  const [selectedPathId, setSelectedPathId] = useState("");

  // Lấy danh sách lộ trình từ server khi component mount
  useEffect(() => {
    const fetchPaths = async () => {
      try {
        // Gọi API lấy tất cả lộ trình của user
        const result = await getUserLearningPaths();
        if (result.success) {
          setPaths(result.data);
          // Tự động chọn lộ trình đầu tiên nếu có
          if (result.data.length > 0) {
            setSelectedPathId(result.data[0].id);
          }
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError("Không thể tải danh sách lộ trình");
      } finally {
        setLoading(false);
      }
    };
    fetchPaths();
  }, []);

  // Tạo badge hiển thị trạng thái của lộ trình dựa trên tiến độ
  const getStatusBadge = (status, progress) => {
    // Hoàn thành 100%
    if (progress === 100) {
      return (
        <span className="lp-badge completed">
          <CheckCircle size={12} /> Hoàn thành
        </span>
      );
    }
    // Đang học dở (tiến độ > 0%)
    if (status === "in_progress") {
      return (
        <span className="lp-badge in-progress">
          <Clock size={12} /> Đang học
        </span>
      );
    }
    // Các trạng thái khác
    return <span className="lp-badge default">{status}</span>;
  };

  // Định dạng ngày tháng theo kiểu Việt Nam (dd/mm/yyyy)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Xử lý khi user chọn lộ trình khác từ dropdown
  const handleSelectChange = (e) => {
    setSelectedPathId(e.target.value);
  };

  // Chuyển hướng đến trang chi tiết lộ trình đã chọn
  const handleViewPath = () => {
    if (selectedPathId) {
      navigate(`/learning-path/${selectedPathId}`);
    }
  };

  // Tìm lộ trình đang được chọn trong danh sách để hiển thị preview
  const selectedPath = paths.find((p) => p.id === selectedPathId);

  // Hiển thị loading spinner khi đang fetch dữ liệu
  if (loading) {
    return (
      <div className="lp-page-wrapper lp-loading">
        <Loader2 size={48} className="lp-loading-spinner" />
        <p className="lp-loading-text">Đang tải lộ trình học tập...</p>
      </div>
    );
  }

  // Hiển thị thông báo khi user chưa có lộ trình nào
  if (paths.length === 0) {
    return (
      <div className="lp-page-wrapper">
        <div className="lp-blob lp-blob-top" />
        
        <div className="container py-5" style={{ position: "relative", zIndex: 1 }}>
          <div className="lp-glass-card lp-empty-card card border-0 shadow-lg">
            <div className="card-body p-4 p-md-5">
              <div className="lp-empty-icon">
                <AlertCircle size={40} />
              </div>
              <h3 className="lp-empty-title">Chưa có lộ trình nào</h3>
              <p className="lp-empty-desc">
                Bạn chưa tạo lộ trình học tập nào. Hãy làm bài trắc nghiệm và chọn nghề nghiệp để tạo lộ trình phù hợp.
              </p>
              <button onClick={() => navigate("/trac-nghiem")} className="lp-empty-btn">
                <GraduationCap size={18} />
                Làm bài trắc nghiệm
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lp-page-wrapper">
      {/* Hiệu ứng nền */}
      <div className="lp-blob lp-blob-top" />
      <div className="lp-blob lp-blob-bottom" />

      <div className="container py-4 py-md-5" style={{ position: "relative", zIndex: 1 }}>
        {/* Phần tiêu đề */}
        <div className="lp-header">
          <div className="lp-header-badge">
            <BookOpen size={16} /> Lộ trình học tập
          </div>
          <h1 className="lp-header-title">Lộ trình của bạn</h1>
          <p className="lp-header-subtitle">
            Bạn có <span className="lp-header-count">{paths.length}</span> lộ trình học tập
          </p>
        </div>

        {/* Thẻ chọn lộ trình */}
        <div className="lp-glass-card lp-select-card card border-0 shadow-lg">
          <div className="card-body p-3 p-md-4">
            <label className="lp-select-label">Chọn lộ trình muốn xem:</label>
            <select
              value={selectedPathId}
              onChange={handleSelectChange}
              className="lp-select-box"
            >
              {paths.map((path) => (
                <option key={path.id} value={path.id}>
                  {path.title} - {Math.round(path.progress_percentage)}% hoàn thành
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Xem trước lộ trình đã chọn */}
        {selectedPath && (
          <div className="lp-glass-card lp-preview-card card border-0 shadow-lg">
            <div className="card-body p-3 p-md-4">
              <div className="lp-preview-header">
                <div>
                  <h4 className="lp-preview-title">{selectedPath.title}</h4>
                  <p className="lp-preview-career">
                    Mục tiêu: <span>{selectedPath.career_title}</span>
                  </p>
                </div>
                {getStatusBadge(selectedPath.status, selectedPath.progress_percentage)}
              </div>

              {/* Thanh tiến độ */}
              <div className="lp-progress-wrapper">
                <div className="lp-progress-header">
                  <span className="lp-progress-label">Tiến độ</span>
                  <span className="lp-progress-value">
                    {Math.round(selectedPath.progress_percentage)}%
                  </span>
                </div>
                <div className="lp-progress-bar">
                  <div
                    className={`lp-progress-fill ${
                      selectedPath.progress_percentage === 100 ? "completed" : "in-progress"
                    }`}
                    style={{ width: `${selectedPath.progress_percentage}%` }}
                  />
                </div>
              </div>

              {/* Thông tin bổ sung */}
              <div className="lp-meta">
                <span>Cập nhật: {formatDate(selectedPath.updated_at)}</span>
                <span>Tạo ngày: {formatDate(selectedPath.created_at)}</span>
              </div>

              {/* Nút xem chi tiết */}
              <button onClick={handleViewPath} className="lp-view-btn">
                <GraduationCap size={20} />
                Xem chi tiết lộ trình
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Danh sách tất cả lộ trình */}
        {paths.length > 1 && (
          <div className="lp-all-paths">
            <h5 className="lp-all-paths-title">Tất cả lộ trình ({paths.length})</h5>
            <div className="lp-paths-grid">
              {paths.map((path) => (
                <div
                  key={path.id}
                  className={`lp-path-card ${path.id === selectedPathId ? "selected" : ""}`}
                  onClick={() => setSelectedPathId(path.id)}
                >
                  <div className="lp-path-card-header">
                    <h6 className="lp-path-card-title">{path.title}</h6>
                    {getStatusBadge(path.status, path.progress_percentage)}
                  </div>
                  <p className="lp-path-card-career">{path.career_title}</p>
                  <div className="lp-path-card-progress">
                    <div
                      className="lp-path-card-progress-fill"
                      style={{
                        width: `${path.progress_percentage}%`,
                        background: path.progress_percentage === 100 ? "#10b981" : "#6366f1",
                      }}
                    />
                  </div>
                  <div className="lp-path-card-meta">
                    <span>{Math.round(path.progress_percentage)}%</span>
                    <span>{formatDate(path.updated_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningPathList;