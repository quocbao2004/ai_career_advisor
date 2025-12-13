import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Camera,
  Briefcase,
  BookOpen,
  Award,
  TrendingUp,
  Clock,
  LogOut,
} from "lucide-react";
// Import Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "../assets/css-custom/user-dashboard.css";

// Đăng ký các thành phần ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const UserDashboard = () => {
  // --- STATE ---
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    full_name: "",
    phone: "",
    address: "",
    bio: "",
    avatar: null, // URL ảnh
    job_title: "Thành viên mới",
  });

  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Fake Data cho biểu đồ (Sau này thay bằng API thực)
  const chartData = {
    labels: ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4", "Tuần 5", "Tuần 6"],
    datasets: [
      {
        label: "Điểm Kỹ Năng",
        data: [12, 19, 25, 45, 60, 85],
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79, 70, 229, 0.5)",
        tension: 0.4, // Đường cong mềm mại
      },
      {
        label: "Mục tiêu ngành",
        data: [30, 40, 50, 60, 70, 80],
        borderColor: "#e5e7eb",
        borderDash: [5, 5], // Nét đứt
        pointRadius: 0,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  const API_URL = "http://127.0.0.1:8000/api/users/profile/";

  // --- 1. GET PROFILE ---
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      // Gọi API thật (nếu có)
      // const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      // setUserData(res.data);

      // --- MOCK DATA (Giả lập để bạn xem giao diện trước) ---
      setTimeout(() => {
        setUserData({
          username: "nguyenvanan",
          email: "an.nguyen@example.com",
          full_name: "Nguyễn Văn An",
          phone: "0909 123 456",
          address: "Hà Nội, Việt Nam",
          bio: "Đam mê lập trình Python và AI. Đang tìm kiếm cơ hội Junior Backend Dev.",
          avatar: "https://i.pravatar.cc/300", // Ảnh random
          job_title: "Junior Python Developer",
        });
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // --- 2. HANDLE EDIT ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Tạo URL preview để hiển thị ngay lập tức
      const url = URL.createObjectURL(file);
      setPreviewImage(url);

      // Lưu file vào state để gửi lên server (dùng FormData)
      setUserData({ ...userData, avatarFile: file });
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem("access_token");

      // Xử lý upload ảnh dùng FormData
      const formData = new FormData();
      formData.append("full_name", userData.full_name);
      formData.append("phone", userData.phone);
      formData.append("address", userData.address);
      formData.append("bio", userData.bio);
      if (userData.avatarFile) {
        formData.append("avatar", userData.avatarFile);
      }

      // const res = await axios.put(API_URL, formData, {
      //   headers: {
      //      Authorization: `Bearer ${token}`,
      //      "Content-Type": "multipart/form-data"
      //   }
      // });

      toast.success("Cập nhật thông tin thành công!");
      setShowEditModal(false);

      if (previewImage) {
        setUserData((prev) => ({ ...prev, avatar: previewImage }));
      }
    } catch (error) {
      toast.error("Lỗi khi cập nhật profile");
    }
  };

  return (
    <div className="dashboard-wrapper">
      {/* --- NAVBAR AREA (Giả lập) --- */}
      <div className="bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold text-primary mb-0">User Dashboard</h4>
        <button className="btn btn-outline-danger btn-sm d-flex align-items-center">
          <LogOut size={16} className="me-2" /> Đăng xuất
        </button>
      </div>

      <div className="container">
        {/* --- STATS CARDS --- */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="stat-card">
              <div className="icon-box bg-primary bg-opacity-10 text-primary">
                <BookOpen size={24} />
              </div>
              <div className="stat-value">12</div>
              <div className="stat-label">Khóa học đang học</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card">
              <div className="icon-box bg-success bg-opacity-10 text-success">
                <Award size={24} />
              </div>
              <div className="stat-value">5</div>
              <div className="stat-label">Chứng chỉ đạt được</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card">
              <div className="icon-box bg-warning bg-opacity-10 text-warning">
                <Briefcase size={24} />
              </div>
              <div className="stat-value">3</div>
              <div className="stat-label">Dự án hoàn thành</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card">
              <div className="icon-box bg-info bg-opacity-10 text-info">
                <Clock size={24} />
              </div>
              <div className="stat-value">128h</div>
              <div className="stat-label">Tổng giờ học tập</div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* --- LEFT COLUMN: CHART & ACTIVITIES --- */}
          <div className="col-lg-8">
            {/* Chart */}
            <div className="chart-card mb-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0 d-flex align-items-center">
                  <TrendingUp size={20} className="me-2 text-primary" />
                  Xu hướng phát triển kỹ năng
                </h5>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "120px" }}
                >
                  <option>7 ngày</option>
                  <option>30 ngày</option>
                  <option>Năm nay</option>
                </select>
              </div>
              <div style={{ height: "300px" }}>
                <Line options={chartOptions} data={chartData} />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="chart-card">
              <h5 className="fw-bold mb-3">Hoạt động gần đây</h5>
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-icon">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <div className="fw-bold">
                      Hoàn thành bài tập Python Basic
                    </div>
                    <div className="text-muted small">
                      Khóa học: Lập trình Python cho người mới • 2 giờ trước
                    </div>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon text-success">
                    <Award size={18} />
                  </div>
                  <div>
                    <div className="fw-bold">Nhận chứng chỉ SQL Database</div>
                    <div className="text-muted small">
                      Cấp bởi: HackerRank • 1 ngày trước
                    </div>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon text-warning">
                    <Edit size={18} />
                  </div>
                  <div>
                    <div className="fw-bold">Cập nhật hồ sơ CV</div>
                    <div className="text-muted small">
                      Bạn đã thêm kỹ năng mới: Docker • 3 ngày trước
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: PROFILE CARD --- */}
          <div className="col-lg-4">
            <div className="profile-card sticky-top" style={{ top: "20px" }}>
              <div className="profile-header"></div>
              <div className="profile-body">
                <div className="avatar-wrapper">
                  <img
                    src={
                      previewImage ||
                      userData.avatar ||
                      "https://via.placeholder.com/150"
                    }
                    alt="User Avatar"
                    className="profile-avatar"
                  />
                  {/* Nút đổi ảnh ẩn */}
                  <label htmlFor="avatar-upload" className="btn-upload-avatar">
                    <Camera size={16} />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>

                <h5 className="fw-bold mb-1">
                  {userData.full_name || userData.username}
                </h5>
                <p className="text-primary small mb-3">{userData.job_title}</p>

                <p className="text-muted small mb-4">
                  {userData.bio || "Chưa có giới thiệu bản thân."}
                </p>

                <div className="d-grid gap-2 mb-4">
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowEditModal(true)}
                  >
                    <Edit size={16} className="me-2" /> Chỉnh sửa hồ sơ
                  </button>
                </div>

                {/* Thông tin chi tiết */}
                <div className="text-start">
                  <div className="d-flex align-items-center mb-3 text-muted small">
                    <Mail size={16} className="me-3" /> {userData.email}
                  </div>
                  <div className="d-flex align-items-center mb-3 text-muted small">
                    <Phone size={16} className="me-3" />{" "}
                    {userData.phone || "Chưa cập nhật"}
                  </div>
                  <div className="d-flex align-items-center mb-3 text-muted small">
                    <MapPin size={16} className="me-3" />{" "}
                    {userData.address || "Chưa cập nhật"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- EDIT MODAL --- */}
      {showEditModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Cập nhật thông tin</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowEditModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Họ và tên</label>
                    <input
                      type="text"
                      className="form-control"
                      name="full_name"
                      value={userData.full_name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      Chức danh / Nghề nghiệp
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="job_title"
                      value={userData.job_title}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Số điện thoại</label>
                      <input
                        type="text"
                        className="form-control"
                        name="phone"
                        value={userData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Địa chỉ</label>
                      <input
                        type="text"
                        className="form-control"
                        name="address"
                        value={userData.address}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      Giới thiệu bản thân (Bio)
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      name="bio"
                      value={userData.bio}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveProfile}
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserDashboard;
