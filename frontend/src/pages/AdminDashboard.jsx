import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/css-custom/admin.css";
import { getUsers, getDashboardStats, deleteUser, updateUser } from "../api/adminApi";
import { getUserInfo } from "../api/authApi";
import {
  Users,
  Briefcase,
  BookOpen,
  Layers,
  Bot,
  TrendingUp,
  Edit,
  Trash2,
  PlusCircle,
  FileText,
  X,
} from "lucide-react";

import GlassCard from "../components/common/GlassCard";
import StatCard from "../components/StatCard";
import Sparkline from "../components/common/Sparkline";

const AdminDashboard = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    cards: {
      total_users: 0,
      new_users_7d: 0,
      total_careers: 0,
      total_industries: 0,
      total_courses: 0,
      total_cvs: 0,
    },
    chart: {
      labels: [],
      data: [], // Dữ liệu biểu đồ tháng
    },
  });
  const [loading, setLoading] = useState(true);

  // --- STATE CHO MODAL ---
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // "edit" hoặc "delete"
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    is_active: true,
    is_superuser: false,
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // --- 1. CONFIG: CÁC NÚT QUẢN LÝ (MODULES) ---
  const managementModules = [
    {
      id: "ai_config",
      title: "Cấu hình AI",
      icon: <Bot size={28} />,
      color: "#8b5cf6",
      path: "/trang-quan-tri/ai-config",
      btnText: "Config AI",
    },
    {
      id: "courses",
      title: "Quản lý Khóa học",
      icon: <BookOpen size={28} />,
      color: "#f59e0b",
      path: "/trang-quan-tri/courses",
      btnText: "Xem khóa học",
    },
    {
      id: "careers",
      title: "Quản lý Nghề nghiệp",
      icon: <Briefcase size={28} />,
      color: "#ec4899",
      path: "/trang-quan-tri/careers",
      btnText: "Xem nghề",
    },
    {
      id: "industries",
      title: "Quản lý Ngành",
      icon: <Layers size={28} />,
      color: "#b0b910ff",
      path: "/trang-quan-tri/industries",
      btnText: "Xem Ngành",
    },
    {
      id: "import",
      title: "Import File Excel",
      icon: <Layers size={28} />,
      color: "#105cb9ff",
      path: "/trang-quan-tri/import-data",
      btnText: "Import File",
    },
  ];

  // --- 2. FETCH DATA (USERS & STATS) ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Gọi song song 2 API từ adminApi.js
        const [usersData, statsData] = await Promise.all([
          getUsers(),
          getDashboardStats(),
        ]);

        // Đảm bảo usersData là mảng
        setUsers(Array.isArray(usersData) ? usersData : []);
        setStats(statsData);
      } catch (error) {
        console.error("Lỗi tải dữ liệu dashboard:", error);
        // Kiểm tra nếu là lỗi phiên đăng nhập hết hạn thì không cần set users
        if (error.message && error.message.includes("Phiên đăng nhập đã hết hạn")) {
          return; // Đã redirect về login
        }
        // Nếu lỗi, set users rỗng để không bị crash
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Lấy thông tin user đang đăng nhập
  const currentUser = getUserInfo();

  // --- MODAL HANDLERS ---
  // Mở modal sửa user
  const handleOpenEditModal = (user) => {
    // Kiểm tra nếu đang cố sửa chính mình
    const isSelf = currentUser && currentUser.id === user.id;
    
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || "",
      email: user.email || "",
      is_active: user.is_active !== false,
      is_superuser: user.is_superuser || false,
      isSelf: isSelf, // Đánh dấu để disable checkbox quyền
    });
    setModalType("edit");
    setModalError(isSelf ? "Bạn không thể thay đổi quyền của chính mình" : "");
    setShowModal(true);
  };

  // Mở modal xóa user
  const handleOpenDeleteModal = (user) => {
    setSelectedUser(user);
    setModalType("delete");
    setModalError("");
    setShowModal(true);
  };

  // Đóng modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setModalType("");
    setModalError("");
  };

  // Xử lý cập nhật user
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setModalLoading(true);
    setModalError("");
    try {
      // Loại bỏ isSelf trước khi gửi lên server
      const { isSelf, ...dataToSend } = editForm;
      const response = await updateUser(selectedUser.id, dataToSend);
      // Lấy dữ liệu user đã cập nhật từ response API
      const updatedUser = response.data || response;
      // Cập nhật danh sách users với dữ liệu mới từ server
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...updatedUser } : u));
      handleCloseModal();
    } catch (err) {
      setModalError(err.message || "Lỗi khi cập nhật user");
    } finally {
      setModalLoading(false);
    }
  };

  // Xử lý xóa user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setModalLoading(true);
    setModalError("");
    try {
      await deleteUser(selectedUser.id);
      setUsers(users.filter(u => u.id !== selectedUser.id));
      handleCloseModal();
    } catch (err) {
      setModalError(err.message || "Lỗi khi xóa user");
    } finally {
      setModalLoading(false);
    }
  };

  // --- 3. DỮ LIỆU HIỂN THỊ (Map từ state stats) ---
  const systemMetrics = [
    {
      title: "Người dùng",
      value: stats.cards.total_users.toLocaleString(),
      icon: <Users size={20} />,
      color: "#4f46e5",
      spark: [10, 15, 20, 25, 30], // Sparkline tĩnh hoặc cần API riêng
    },
    {
      title: "Thành viên mới (7 ngày)",
      value: `+${stats.cards.new_users_7d}`,
      icon: <TrendingUp size={20} />,
      color: "#10b981", // Màu xanh lá growth
      spark: [2, 5, 3, 8, 10],
    },
    {
      title: "Ngành nghề",
      value: stats.cards.total_industries.toString(),
      icon: <Layers size={20} />,
      color: "#f59e0b",
      spark: [10, 12, 11, 14, 15],
    },
    {
      title: "Nghề nghiệp (Job)",
      value: stats.cards.total_careers.toString(),
      icon: <Briefcase size={20} />,
      color: "#ec4899",
      spark: [5, 10, 8, 15, 20],
    },
    {
      title: "Khóa học",
      value: stats.cards.total_courses.toString(),
      icon: <BookOpen size={20} />,
      color: "#0891b2",
      spark: [50, 60, 55, 70, 80],
    },
    {
      title: "CV đã xử lý",
      value: stats.cards.total_cvs.toString(),
      icon: <FileText size={20} />,
      color: "#fbbf24",
      spark: [10, 20, 15, 25, 35],
    },
  ];

  // Map dữ liệu biểu đồ từ API trả về
  const chartData = useMemo(() => {
    // Nếu API trả về mảng rỗng thì dùng mảng mặc định để tránh lỗi UI
    if (!stats.chart.data || stats.chart.data.length === 0) {
      return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    return stats.chart.data;
  }, [stats]);

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="container-fluid px-2 px-sm-3 py-3 py-sm-4 fade-in">
          {/* HEADER - Chiếm toàn bộ chiều ngang */}
          <div className="row mb-3 mb-sm-4">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h2 className="fw-bold mb-1 admin-title">Admin Dashboard</h2>
                  <p className="text-white m-0 admin-subtitle">
                    Trung tâm kiểm soát hệ thống AI Career Advisor
                  </p>
                </div>
                <button className="btn btn-primary d-flex align-items-center gap-2">
                  <PlusCircle size={18} /> Báo cáo nhanh
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 1: THỐNG KÊ & BIỂU ĐỒ */}
          <div className="row g-2 g-sm-3 mb-3 mb-sm-4">
            {/* Cột phải trên mobile, cột phải trên desktop: MENU QUẢN LÝ */}
            <div className="col-12 col-xl-4 order-1 order-xl-2 mb-3 mb-xl-0">
              <h5 className="fw-bold mb-2 mb-sm-3 text-white">Chức năng quản lý</h5>
              <div className="row g-2">
                {managementModules.map((mod) => (
                  <div className="col-6 col-sm-4 col-xl-6" key={mod.id}>
                    <GlassCard
                      className="h-100 p-2 p-sm-3 text-center cursor-pointer hover-shadow"
                      style={{
                        cursor: "pointer",
                        borderTop: `3px solid ${mod.color}`,
                        transition: "transform 0.2s",
                      }}
                      onClick={() => navigate(mod.path)}
                    >
                      <div className="mb-1" style={{ color: mod.color }}>
                        {React.cloneElement(mod.icon, { size: 22 })}
                      </div>
                      <h6 className="fw-bold mb-1 management-title">{mod.title}</h6>
                      <span className="badge bg-light text-dark border management-badge">
                        {mod.btnText}
                      </span>
                    </GlassCard>
                  </div>
                ))}
              </div>
            </div>

            {/* Cột trái trên desktop: Stats Cards */}
            <div className="col-12 col-xl-8 order-2 order-xl-1">
              <div className="row g-2 mb-3">
                {systemMetrics.map((m, i) => (
                  <div className="col-6 col-md-4" key={i}>
                    <StatCard {...m} />
                  </div>
                ))}
              </div>
              {/* Biểu đồ chính */}
              <GlassCard style={{ padding: "12px" }}>
                <h5 className="fw-bold mb-2 chart-title text-white">
                  Tăng trưởng người dùng (Theo tháng)
                </h5>
                <div className="chart-container-main">
                  <Sparkline data={chartData} color="#4f46e5" height={150} />
                </div>
              </GlassCard>
            </div>
          </div>

          {/* SECTION 2: DANH SÁCH USER */}
          <div className="row">
            <div className="col-12">
              <GlassCard style={{ padding: "0" }}>
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <h5 className="fw-bold m-0 table-header-title text-white">Danh sách người dùng gần đây</h5>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => navigate("/admin/xem-danh-sach-nguoi-dung")}
                  >
                    Xem tất cả
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 admin-table">
                    <thead>
                      <tr>
                        <th className="ps-3">User</th>
                        <th>Email</th>
                        <th>Vai trò</th>
                        <th>Ngày tham gia</th>
                        <th className="text-end pe-3">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4">
                            <div className="spinner-border text-primary" role="status"></div>
                            <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id}>
                            <td className="ps-3">
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center me-2 flex-shrink-0"
                                  style={{ width: 36, height: 36 }}
                                >
                                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                                </div>
                                <span className="fw-bold">
                                  {user.full_name || "Chưa cập nhật"}
                                </span>
                              </div>
                            </td>
                            <td>{user.email}</td>
                            <td>
                              <span className={`badge ${user.role === "admin" ? "bg-danger" : "bg-primary"}`}>
                                {user.role === "admin" ? "Admin" : "User"}
                              </span>
                            </td>
                            <td>
                              {user.created_at
                                ? new Date(user.created_at).toLocaleDateString("vi-VN")
                                : "N/A"}
                            </td>
                            <td className="text-end pe-3">
                              <div className="d-flex justify-content-end gap-1">
                                <button 
                                  className="btn btn-sm btn-outline-primary"
                                  title="Sửa"
                                  onClick={() => handleOpenEditModal(user)}
                                >
                                  <Edit size={14} />
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  title="Xóa"
                                  onClick={() => handleOpenDeleteModal(user)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL SỬA / XÓA USER */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              {/* Header */}
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalType === "edit" ? "Sửa thông tin User" : "Xác nhận xóa User"}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>

              {/* Body */}
              <div className="modal-body">
                {modalError && (
                  <div className="alert alert-danger py-2">{modalError}</div>
                )}

                {modalType === "edit" ? (
                  // Form sửa user
                  <form>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Họ tên</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        placeholder="Nhập họ tên"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="Nhập email"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold d-block mb-2">Phân quyền</label>
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="isSuperuserCheck"
                          checked={editForm.is_superuser}
                          onChange={(e) => setEditForm({ ...editForm, is_superuser: e.target.checked })}
                          disabled={editForm.isSelf}
                          style={{ width: '20px', height: '20px', marginTop: 0 }}
                        />
                        <label className="form-check-label mb-0" htmlFor="isSuperuserCheck" style={{ color: editForm.isSelf ? '#999' : '#333' }}>
                          Quyền Admin {editForm.isSelf && <small className="text-warning">(Không thể tự thay đổi)</small>}
                        </label>
                      </div>
                    </div>
                  </form>
                ) : (
                  // Xác nhận xóa
                  <div className="text-center">
                    <div className="mb-3">
                      <Trash2 size={48} className="text-danger" />
                    </div>
                    <p>
                      Bạn có chắc chắn muốn xóa user <strong>{selectedUser?.full_name || selectedUser?.email}</strong>?
                    </p>
                    <p className="text-muted small">Hành động này không thể hoàn tác.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                  disabled={modalLoading}
                >
                  Hủy
                </button>
                {modalType === "edit" ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleUpdateUser}
                    disabled={modalLoading}
                  >
                    {modalLoading ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDeleteUser}
                    disabled={modalLoading}
                  >
                    {modalLoading ? "Đang xóa..." : "Xóa"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
