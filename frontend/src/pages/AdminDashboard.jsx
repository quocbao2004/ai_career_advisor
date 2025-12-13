import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Users,
  Briefcase,
  BookOpen,
  Layers,
  Bot,
  TrendingUp,
  MoreHorizontal,
  PlusCircle,
} from "lucide-react";

import GlassCard from "../components/common/GlassCard";
import StatCard from "../components/StatCard";
import Sparkline from "../components/common/Sparkline";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // --- 1. CONFIG: CÁC NÚT QUẢN LÝ (MODULES) ---
  const managementModules = [
    {
      id: "ai_config",
      title: "Cấu hình AI",
      icon: <Bot size={28} />,
      color: "#8b5cf6",
      path: "/admin/ai-config",
      btnText: "Config AI",
    },
    {
      id: "courses",
      title: "Quản lý Khóa học",
      icon: <BookOpen size={28} />,
      color: "#f59e0b",
      path: "/admin/courses",
      btnText: "Xem khóa học",
    },
    {
      id: "careers",
      title: "Quản lý dữ liệu Nghề nghiệp",
      icon: <Briefcase size={28} />,
      color: "#ec4899",
      path: "/admin/careers",
      btnText: "Xem nghề",
    },
    {
      id: "skills",
      title: "Quản lý dữ liệu kỹ năng",
      icon: <Layers size={28} />,
      color: "#10b981",
      path: "/admin/skills",
      btnText: "Xem Skill",
    },
    {
      id: "import",
      title: "Import File Excel",
      icon: <Layers size={28} />,
      color: "#105cb9ff",
      path: "/admin/import-data",
      btnText: "Import File",
    },
    {
      id: "export",
      title: "Xuất Dữ Liệu Báo Cáo",
      icon: <Layers size={28} />,
      color: "#6489b6ff",
      path: "/admin/skills",
      btnText: "Xuất File",
    },
  ];

  // --- 2. DỮ LIỆU BIỂU ĐỒ GIẢ LẬP ---
  const systemMetrics = [
    {
      title: "Người dùng",
      value: users.length.toString(),
      icon: <Users size={20} />,
      color: "#4f46e5",
      spark: [10, 15, 20, 25, 30],
    },
    {
      title: "Khóa học",
      value: "1.2M",
      icon: <Bot size={20} />,
      color: "#0891b2",
      spark: [50, 60, 55, 70, 80],
    },
    {
      title: "Nghề nghiệp",
      value: "$8,200",
      icon: <TrendingUp size={20} />,
      color: "#fbbf24",
      spark: [10, 20, 15, 25, 35],
    },
  ];

  const chartData = useMemo(
    () => [12, 19, 3, 5, 2, 3, 10, 15, 20, 25, 22, 30],
    []
  );

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(
          "http://127.0.0.1:8000/api/admin/users/",
          config
        );
        const userList = response.data.data || response.data;
        setUsers(userList);
      } catch (error) {
        console.error("Lỗi tải user:", error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="container-fluid py-4 fade-in">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Admin Dashboard</h2>
          <p className="text-white m-0">
            Trung tâm kiểm soát hệ thống AI Career Advisor
          </p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2">
          <PlusCircle size={18} /> Báo cáo nhanh
        </button>
      </div>

      {/* SECTION 1: THỐNG KÊ & BIỂU ĐỒ */}
      <div className="row g-4 mb-4">
        {/* Cột trái: Stats Cards */}
        <div className="col-lg-8">
          <div className="row g-3 mb-4">
            {systemMetrics.map((m, i) => (
              <div className="col-md-4" key={i}>
                <StatCard {...m} />
              </div>
            ))}
          </div>
          {/* Biểu đồ chính */}
          <GlassCard style={{ padding: "20px" }}>
            <h5 className="fw-bold mb-3">Lưu lượng truy cập hệ thống</h5>
            <div style={{ height: "180px" }}>
              <Sparkline data={chartData} color="#4f46e5" height={180} />
            </div>
          </GlassCard>
        </div>

        {/* Cột phải: MENU QUẢN LÝ NHANH (Grid Buttons) */}
        <div className="col-lg-4">
          <h5 className="fw-bold mb-3">Chức năng quản lý</h5>
          <div className="row g-3">
            {managementModules.map((mod) => (
              <div className="col-6" key={mod.id}>
                <GlassCard
                  className="h-100 p-3 text-center cursor-pointer hover-shadow"
                  style={{
                    cursor: "pointer",
                    borderTop: `4px solid ${mod.color}`,
                    transition: "transform 0.2s",
                  }}
                  onClick={() => navigate(mod.path)}
                >
                  <div className="mb-2" style={{ color: mod.color }}>
                    {mod.icon}
                  </div>
                  <h6 className="fw-bold mb-1">{mod.title}</h6>
                  <p
                    className="text-muted small mb-2"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {mod.desc}
                  </p>
                  <span className="badge bg-light text-dark border">
                    {mod.btnText}
                  </span>
                </GlassCard>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: DANH SÁCH USER (Tích hợp trực tiếp) */}
      <div className="row">
        <div className="col-12">
          <GlassCard style={{ padding: "0" }}>
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="fw-bold m-0">Danh sách người dùng gần đây</h5>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate("/admin/xem-danh-sach-nguoi-dung")}
              >
                Xem tất cả
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="">
                  <tr>
                    <th className="ps-4">User</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Ngày tham gia</th>
                    <th className="text-end pe-4">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : (
                    users.slice(0, 5).map(
                      (
                        user // Chỉ lấy 5 user đầu tiên
                      ) => (
                        <tr key={user.id}>
                          <td className="ps-4">
                            <div className="d-flex align-items-center">
                              <div
                                className="rounded-circle text-white d-flex justify-content-center align-items-center me-2"
                                style={{ width: 32, height: 32 }}
                              >
                                {user.full_name
                                  ? user.full_name.charAt(0)
                                  : "U"}
                              </div>
                              <span className="fw-bold">
                                {user.full_name || "No Name"}
                              </span>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <span
                              className={`badge ${
                                user.is_superuser ? "bg-danger" : "bg-primary"
                              }`}
                            >
                              {user.role || "NULL"}
                            </span>
                          </td>
                          <td>
                            {user.date_joined
                              ? new Date(user.date_joined).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="text-end pe-4">
                            <button className="btn btn-sm btn-light text-secondary">
                              <MoreHorizontal size={16} />
                            </button>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
