import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2"; // Import Popup xác nhận đẹp
import { toast } from "react-toastify";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Thêm state cho ô tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");

  const API_URL_USER = "https://ai-career-advisor-4006.onrender.com/api/users/";
  const API_URL_ADMIN =
    "https://ai-career-advisor-4006.onrender.com/api/admin/users";

  // Hàm lấy danh sách user
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      const response = await axios.get(API_URL_ADMIN, config);
      setUsers(response.data.data || response.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Không thể kết nối đến server hoặc bạn không có quyền Admin.");
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    const result = await Swal.fire({
      title: "Bạn có chắc chắn?",
      text: "Hành động này sẽ khóa tài khoản người dùng và không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Vâng, khóa nó!",
      cancelButtonText: "Hủy bỏ",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
        data: { id: id },
      };

      await axios.delete(API_URL_USER, config);
      toast.success("Đã khóa tài khoản thành công!");

      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
    } catch (err) {
      console.error("Lỗi chi tiết:", err);
      const message =
        err.response?.data?.message || err.message || "Lỗi không xác định";
      toast.error(`Lỗi: ${message}`);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString)
      return <span className="text-muted fst-italic">Chưa đăng nhập</span>;
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
        </div>
      </div>
    );

  return (
    <div className="container py-5">
      {/* Header Dashboard */}
      <div className="row mb-4">
        <div className="col">
          <h2 className="fw-bold text-primary">
            <i className="bi bi-people-fill me-2"></i> Quản trị người dùng
          </h2>
          <p className=" text-primary">
            Quản lý danh sách tài khoản trong hệ thống AI Career Advisor
          </p>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="card shadow border-0">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <div className="card-body p-3">
            <label className="form-label fw-bold text-secondary small">
              Tìm kiếm nhanh
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Nhập email người dùng để lọc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="btn btn-outline-secondary border-start-0"
                  type="button"
                  onClick={() => setSearchTerm("")}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col" className="ps-4">
                    UUID
                  </th>
                  <th scope="col">Thông tin cá nhân</th>
                  <th scope="col">Liên hệ</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col" className="text-end pe-4">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* 3. Thay users.map bằng filteredUsers.map */}
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="ps-4">
                        <code
                          className="text-primary fw-bold"
                          title={user.id}
                          style={{ cursor: "help" }}
                        >
                          {user.id ? user.id.substring(0, 8) + "..." : "N/A"}
                        </code>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div
                            className="rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center me-3"
                            style={{
                              width: "40px",
                              height: "40px",
                              fontSize: "18px",
                            }}
                          >
                            {user.full_name
                              ? user.full_name.charAt(0).toUpperCase()
                              : "U"}
                          </div>
                          <div>
                            <div className="fw-bold">
                              {user.full_name || "Chưa đặt tên"}
                            </div>
                            <small className="text-muted">
                              Role: {user.role || "NULL"}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          {/* Highlight từ khóa tìm kiếm trong email nếu muốn */}
                          <i className="bi bi-envelope me-1"></i> {user.email}
                        </div>
                        <div className="small text-muted">
                          <i className="bi bi-telephone me-1"></i>{" "}
                          {user.phone_number || "---"}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {formatDate(user.last_login)}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <div className="btn-group" role="group">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      <i className="bi bi-search fs-1 d-block mb-2 text-warning"></i>
                      Không tìm thấy kết quả nào phù hợp với "{searchTerm}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer bg-white text-muted small py-3">
          Hiển thị {filteredUsers.length} kết quả
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
