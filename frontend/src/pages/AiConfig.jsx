import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Save,
  RefreshCw,
  Clock,
  CheckCircle,
  RotateCcw,
  Plus,
  AlertCircle,
  Cpu,
  MessageSquare,
} from "lucide-react";

import GlassCard from "../components/common/GlassCard";

const AiConfig = () => {
  const [loading, setLoading] = useState(false);
  const [configsList, setConfigsList] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [notification, setNotification] = useState(null);

  const defaultConfig = {
    name: "Cấu hình mới...",
    temperature: 0.7,
    role_description: "",
    standard_prompt_template: "",
    missing_profile_template: "",
    is_active: false,
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(
        "http://127.0.0.1:8000/api/ai/admin/ai-configs/",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const dataArray = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];

      setConfigsList(dataArray);

      if (dataArray.length > 0 && !selectedConfig) {
        setSelectedConfig(dataArray[0]);
      } else if (dataArray.length === 0) {
        setSelectedConfig(defaultConfig);
      }
    } catch (error) {
      showNotification(
        "error",
        "Không thể tải danh sách cấu hình: " + error.message
      );
      setConfigsList([]);
    }
  };

  const handleSaveNew = async () => {
    if (!selectedConfig.name) {
      showNotification("error", "Vui lòng đặt tên cho phiên bản này!");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        "http://127.0.0.1:8000/api/ai/admin/ai-configs/",
        selectedConfig,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showNotification("success", "Đã lưu và áp dụng cấu hình mới!");
      fetchConfigs();
    } catch (error) {
      showNotification("error", "Lỗi khi lưu: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id) => {
    const confirm = window.confirm(
      "Bạn có chắc muốn quay lại sử dụng phiên bản cũ này không?"
    );
    if (!confirm) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        `http://127.0.0.1:8000/api/ai/admin/ai-configs/${id}/activate/`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showNotification("success", "Đã khôi phục phiên bản cũ thành công!");
      fetchConfigs();
    } catch (error) {
      showNotification("error", "Lỗi kích hoạt: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- HELPER FUNCTIONS ---

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateNewClick = () => {
    setSelectedConfig(defaultConfig);
  };

  if (!selectedConfig && configsList.length > 0)
    return <div className="p-5 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="container-fluid py-4 fade-in">
      {/* HEADER PAGE */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-primary mb-0 d-flex align-items-center gap-2">
            Quản lý Trí Tuệ AI
          </h2>
          <p className="text-white small m-0">
            Kiểm soát Prompt, Temperature và Logic phản hồi của Assistant.
          </p>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div
            className={`alert ${
              notification.type === "success" ? "alert-success" : "alert-danger"
            } d-flex align-items-center py-2 px-3 m-0 shadow-sm`}
            role="alert"
          >
            {notification.type === "success" ? (
              <CheckCircle size={18} className="me-2" />
            ) : (
              <AlertCircle size={18} className="me-2" />
            )}
            {notification.message}
          </div>
        )}
      </div>

      <div className="row g-4 h-100" style={{ minHeight: "80vh" }}>
        {/* --- CỘT TRÁI: SIDEBAR LỊCH SỬ --- */}
        <div className="col-lg-3 d-flex flex-column">
          <GlassCard className="p-0 h-100 d-flex flex-column overflow-hidden">
            {/* Header Sidebar */}
            <div className="p-3 border-bottom bg-dark bg-opacity-50 d-flex justify-content-between align-items-center">
              <span className="fw-bold text-white d-flex align-items-center">
                <Clock size={16} className="me-2" /> Lịch sử phiên bản
              </span>
              <button
                className="btn btn-sm btn-primary d-flex align-items-center"
                onClick={handleCreateNewClick}
                title="Tạo bản nháp mới"
              >
                <Plus size={16} /> Mới
              </button>
            </div>

            {/* List Items */}
            <div className="overflow-auto flex-grow-1 custom-scrollbar">
              {configsList.length === 0 ? (
                <div className="text-center text-white p-4 small">
                  Chưa có lịch sử nào.
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {configsList.map((cfg) => (
                    <button
                      key={cfg.id}
                      className={`list-group-item list-group-item-action py-3 px-3 border-0 border-bottom 
                                        ${
                                          selectedConfig?.id === cfg.id
                                            ? "bg-primary bg-opacity-10 text-primary border-start border-3 border-primary"
                                            : ""
                                        }
                                    `}
                      onClick={() => setSelectedConfig(cfg)}
                    >
                      <div className="d-flex w-100 justify-content-between align-items-start mb-1">
                        <strong
                          className="text-truncate"
                          style={{ maxWidth: "140px", fontSize: "0.9rem" }}
                        >
                          {cfg.name || "Không tên"}
                        </strong>
                        {cfg.is_active && (
                          <span
                            className="badge bg-success rounded-pill"
                            style={{ fontSize: "0.6rem" }}
                          >
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <small
                          className="text-muted"
                          style={{ fontSize: "0.75rem" }}
                        >
                          {new Date(cfg.created_at).toLocaleString("vi-VN")}
                        </small>
                        <small className="badge bg-light text-dark border">
                          Temp: {cfg.temperature}
                        </small>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* --- CỘT PHẢI: EDITOR --- */}
        <div className="col-lg-9">
          {selectedConfig ? (
            <GlassCard className="p-4 h-100 d-flex flex-column">
              {/* Toolbar Action */}
              <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <div>
                  <h5 className="fw-bold m-0 text-white">
                    {selectedConfig.id
                      ? `Chi tiết: ${selectedConfig.name}`
                      : "Soạn thảo phiên bản mới"}
                  </h5>
                  <small className="text-white">
                    {selectedConfig.is_active ? (
                      <span className="text-success">
                        <CheckCircle size={14} className="me-1" />
                        Phiên bản này đang chạy trên hệ thống
                      </span>
                    ) : (
                      "Phiên bản này đang lưu trữ (không hoạt động)"
                    )}
                  </small>
                </div>

                <div className="d-flex gap-2">
                  {/* Nút Restore (chỉ hiện với bản cũ) */}
                  {selectedConfig.id && !selectedConfig.is_active && (
                    <button
                      className="btn btn-outline-warning fw-bold d-flex align-items-center"
                      onClick={() => handleActivate(selectedConfig.id)}
                      disabled={loading}
                    >
                      <RotateCcw size={18} className="me-2" /> Dùng lại bản này
                    </button>
                  )}

                  {/* Nút Save */}
                  <button
                    className="btn btn-primary fw-bold d-flex align-items-center px-4"
                    onClick={handleSaveNew}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm me-2" />
                    ) : (
                      <Save size={18} className="me-2" />
                    )}
                    {selectedConfig.id ? "Lưu thành bản mới" : "Lưu cấu hình"}
                  </button>
                </div>
              </div>

              {/* FORM INPUTS */}
              <div
                className="row g-4 overflow-auto custom-scrollbar"
                style={{ maxHeight: "75vh" }}
              >
                {/* 1. General Settings */}
                <div className="col-md-5">
                  <div className="p-3 bg-light rounded-3 h-100 border">
                    <h6 className="fw-bold text-primary mb-3">
                      <Cpu size={18} className="me-2" />
                      Thiết lập Model
                    </h6>

                    <div className="mb-3">
                      <label className="form-label fw-bold small d-flex justify-content-between  text-dark">
                        Tên phiên bản
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ví dụ: Config V2 - Hài hước"
                        value={selectedConfig.name}
                        onChange={(e) =>
                          setSelectedConfig({
                            ...selectedConfig,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold small d-flex justify-content-between  text-dark">
                        <span>Temperature (Sáng tạo)</span>
                        <span className="badge bg-primary">
                          {selectedConfig.temperature}
                        </span>
                      </label>
                      <input
                        type="range"
                        className="form-range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={selectedConfig.temperature}
                        onChange={(e) =>
                          setSelectedConfig({
                            ...selectedConfig,
                            temperature: parseFloat(e.target.value),
                          })
                        }
                      />
                      <div
                        className="d-flex justify-content-between small text-muted fst-italic"
                        style={{ fontSize: "0.75rem" }}
                      >
                        <span>Logic (0.0)</span>
                        <span>Bay bổng (1.0)</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold small d-flex justify-content-between  text-dark">
                        Vai trò cốt lõi (System Role)
                      </label>
                      <textarea
                        className="form-control"
                        rows="6"
                        placeholder="Mô tả AI là ai..."
                        value={selectedConfig.role_description}
                        onChange={(e) =>
                          setSelectedConfig({
                            ...selectedConfig,
                            role_description: e.target.value,
                          })
                        }
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* 2. Prompt Templates */}
                <div className="col-md-7">
                  <div className="p-3 bg-white rounded-3 h-100 border border-success border-opacity-25">
                    <h6 className="fw-bold text-success mb-3">
                      <MessageSquare size={18} className="me-2" />
                      Kịch bản Prompt (Templates)
                    </h6>

                    {/* Standard Prompt */}
                    <div className="mb-4">
                      <label className="form-label fw-bold small text-dark">
                        1. Standard Prompt (Đầy đủ thông tin)
                      </label>
                      <textarea
                        className="form-control font-monospace"
                        rows="10"
                        style={{
                          fontSize: "0.8rem",
                          backgroundColor: "#f8fff9",
                          lineHeight: "1.5",
                        }}
                        value={selectedConfig.standard_prompt_template}
                        onChange={(e) =>
                          setSelectedConfig({
                            ...selectedConfig,
                            standard_prompt_template: e.target.value,
                          })
                        }
                      ></textarea>
                      <div
                        className="mt-1 text-muted"
                        style={{ fontSize: "0.7rem" }}
                      >
                        <strong>Biến hệ thống:</strong>{" "}
                        <code>{`{role_description}, {user_profile_context}, {rag_context}, {chat_history_text}, {prompt}, {current_job}`}</code>
                      </div>
                    </div>

                    {/* Missing Profile Prompt */}
                    <div>
                      <label className="form-label fw-bold small text-dark">
                        2. Missing Profile Prompt (Thiếu hồ sơ)
                      </label>
                      <textarea
                        className="form-control font-monospace"
                        rows="5"
                        style={{
                          fontSize: "0.8rem",
                          backgroundColor: "#fffdf0",
                          lineHeight: "1.5",
                        }}
                        value={selectedConfig.missing_profile_template}
                        onChange={(e) =>
                          setSelectedConfig({
                            ...selectedConfig,
                            missing_profile_template: e.target.value,
                          })
                        }
                      ></textarea>
                      <div
                        className="mt-1 text-muted"
                        style={{ fontSize: "0.7rem" }}
                      >
                        <strong>Biến hệ thống:</strong>{" "}
                        <code>{`{role_description}, {user_profile_context}, {chat_history_text}, {prompt}`}</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          ) : (
            // State Loading/Empty
            <GlassCard className="h-100 d-flex justify-content-center align-items-center text-muted">
              <div className="text-center">
                <RefreshCw size={40} className="mb-3 opacity-50" />
                <p>Chọn một phiên bản từ lịch sử hoặc tạo mới.</p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiConfig;
