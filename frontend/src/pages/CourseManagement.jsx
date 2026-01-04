import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  Clock,
  DollarSign,
  X,
  Save,
  Filter,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

const CourseManagement = () => {
  // --- STATE ---
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // hiển thị 5 khóa học mỗi trang

  // State Form
  const initialFormState = {
    title: "",
    provider: "",
    description: "",
    url: "",
    price: "",
    duration_hours: "",
    level: "beginner",
  };
  const [formData, setFormData] = useState(initialFormState);
  const [editId, setEditId] = useState(null);

  // --- API URL ---
  const API_URL =
    "https://ai-career-advisor-4006.onrender.com/api/admin/courses/";

  // --- 1. FETCH DATA ---
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(response.data.data);
    } catch (error) {
      toast.error("Không thể tải danh sách khóa học");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // --- 2. HANDLERS CHO FORM ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const openEditModal = (course) => {
    setIsEditing(true);
    setEditId(course.id);
    setFormData({
      title: course.title,
      provider: course.provider || "",
      description: course.description || "",
      url: course.url || "",
      price: course.price || 0,
      duration_hours: course.duration_hours || 0,
      level: course.level || "Beginner",
    });
    setShowModal(true);
  };

  // --- 3. SUBMIT (CREATE / UPDATE) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");

    if (!formData.title) return toast.warning("Vui lòng nhập tên khóa học");

    try {
      if (isEditing) {
        await axios.put(`${API_URL}${editId}/`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Cập nhật khóa học thành công!");
      } else {
        await axios.post(API_URL, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Thêm khóa học mới thành công!");
      }

      setShowModal(false);
      fetchCourses();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Có lỗi xảy ra";
      toast.error(msg);
    }
  };

  // --- 4. DELETE ---
  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn xóa khóa học này không? Hành động này không thể hoàn tác!"
      )
    ) {
      try {
        const token = localStorage.getItem("access_token");
        await axios.delete(`${API_URL}${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Đã xóa khóa học");
        fetchCourses();
      } catch (error) {
        toast.error("Xóa thất bại");
        console.error(error);
      }
    }
  };

  // --- FILTER & HELPER ---
  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.provider?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLevelBadgeClass = (level) => {
    switch (level) {
      case "beginner":
        return "badge bg-success";
      case "intermediate":
        return "badge bg-warning text-dark";
      case "advanced":
        return "badge bg-danger";
      default:
        return "badge bg-secondary";
    }
  };

  // logic phân trang
  // chỉ số
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Cắt danh sách
  const currentCourses = filteredCourses.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  // Tong so trang
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  // chuyen trang
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  // reset khi tim kiem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="container py-5">
      {/* HEADER */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
        <div className="mb-3 mb-md-0">
          <h2 className="fw-bold d-flex align-items-center text-white">
            <BookOpen className="me-2 text-primary" size={32} /> Quản Lý Khóa
            Học
          </h2>
          <p className=" mb-0 text-white">
            Quản lý danh mục khóa học, giá và nội dung
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary d-flex align-items-center px-4 py-2 shadow-sm"
        >
          <Plus size={20} className="me-2" /> Thêm Khóa Học
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-3">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <Search size={20} className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Tìm kiếm theo tên khóa học hoặc nhà cung cấp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ boxShadow: "none" }}
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="card shadow border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5 text-muted">
              <div
                className="spinner-border text-primary mb-2"
                role="status"
              ></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="py-3 ps-4 text-secondary text-uppercase small fw-bold">
                      Khóa học
                    </th>
                    <th className="py-3 text-secondary text-uppercase small fw-bold">
                      Thông tin
                    </th>
                    <th className="py-3 text-secondary text-uppercase small fw-bold">
                      Giá & Thời lượng
                    </th>
                    <th className="py-3 text-center text-secondary text-uppercase small fw-bold">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentCourses.length > 0 ? (
                    currentCourses.map((course) => (
                      <tr key={course.id}>
                        <td className="ps-4 py-3">
                          <div className="fw-bold text-dark">
                            {course.title}
                          </div>
                          <div className="mt-1 d-flex justify-content-center align-items-center gap-2">
                            {course.provider && (
                              <span className="badge bg-light text-dark border border-secondary-subtle">
                                {course.provider}
                              </span>
                            )}
                            <span className={getLevelBadgeClass(course.level)}>
                              {course.level}
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div
                            className="text-muted small text-truncate"
                            style={{ maxWidth: "250px" }}
                            title={course.description}
                          >
                            {course.description || "Không có mô tả"}
                          </div>
                          {course.url && (
                            <a
                              href={course.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-decoration-none small d-flex align-items-center mt-1"
                            >
                              <ExternalLink size={12} className="me-1" /> Link
                              khóa học
                            </a>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="d-flex flex-column gap-1">
                            <div className="d-flex align-items-center text-dark fw-bold small">
                              <DollarSign
                                size={14}
                                className="text-success me-1"
                              />
                              {course.price
                                ? parseFloat(course.price).toLocaleString(
                                    "vi-VN"
                                  ) + " đ"
                                : "Miễn phí"}
                            </div>
                            <div className="d-flex align-items-center text-muted small">
                              <Clock size={14} className="me-1" />
                              {course.duration_hours
                                ? `${course.duration_hours} giờ`
                                : "--"}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => openEditModal(course)}
                            className="btn btn-outline-primary btn-sm me-2 border-0"
                            title="Sửa"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(course.id)}
                            className="btn btn-outline-danger btn-sm border-0"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-5 text-muted">
                        <Filter
                          size={48}
                          className="mb-3 opacity-25 d-block mx-auto"
                        />
                        Không tìm thấy khóa học nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {/* PAGINATION CONTROL */}
              {filteredCourses.length > 0 && (
                <div className="card-footer bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                  <div className="text-muted small">
                    Hiển thị <strong>{indexOfFirstItem + 1}</strong> -{" "}
                    <strong>
                      {Math.min(indexOfLastItem, filteredCourses.length)}
                    </strong>{" "}
                    trong tổng số <strong>{filteredCourses.length}</strong> khóa
                    học
                  </div>

                  <nav>
                    <ul className="pagination mb-0">
                      {/* Nút Previous */}
                      <li
                        className={`page-item ${
                          currentPage === 1 ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link border-0"
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft size={18} />
                        </button>
                      </li>

                      {/* Số trang */}
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNum = index + 1;
                        return (
                          <li
                            key={pageNum}
                            className={`page-item ${
                              currentPage === pageNum ? "active" : ""
                            }`}
                          >
                            <button
                              className="page-link border-0 rounded-circle mx-1"
                              onClick={() => paginate(pageNum)}
                              style={{
                                width: "32px",
                                height: "32px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor:
                                  currentPage === pageNum
                                    ? "#0d6efd"
                                    : "transparent",
                                color:
                                  currentPage === pageNum ? "white" : "#6c757d",
                              }}
                            >
                              {pageNum}
                            </button>
                          </li>
                        );
                      })}

                      {/* Nút Next */}
                      <li
                        className={`page-item ${
                          currentPage === totalPages ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link border-0"
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight size={18} />
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL (Bootstrap Style) */}
      {showModal && (
        <>
          {/* Backdrop */}
          <div className="modal-backdrop fade show"></div>

          {/* Modal Dialog */}
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            style={{ backgroundColor: "rgba(0,0,0,0.1)" }} // Overlay nhẹ
          >
            <div
              className="modal-dialog modal-lg modal-dialog-centered"
              role="document"
            >
              <div className="modal-content shadow-lg">
                <div className="modal-header bg-light">
                  <h5 className="modal-title fw-bold text-dark">
                    {isEditing ? "Cập Nhật Khóa Học" : "Thêm Khóa Học Mới"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body p-4">
                  <form onSubmit={handleSubmit} id="courseForm">
                    <div className="row g-3 text-dark">
                      {/* Tên khóa học */}
                      <div className="col-12">
                        <label className="form-label fw-bold">
                          Tên khóa học <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="form-control"
                          placeholder="VD: Lập trình Python cơ bản"
                          required
                        />
                      </div>

                      {/* Nhà cung cấp & Trình độ */}
                      <div className="col-md-6">
                        <label className="form-label">Nhà cung cấp</label>
                        <input
                          type="text"
                          name="provider"
                          value={formData.provider}
                          onChange={handleInputChange}
                          className="form-control"
                          placeholder="VD: Coursera, Udemy"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Trình độ</label>
                        <select
                          name="level"
                          value={formData.level}
                          onChange={handleInputChange}
                          className="form-select"
                        >
                          <option value="beginner">Beginner (Cơ bản)</option>
                          <option value="intermediate">
                            Intermediate (Trung bình)
                          </option>
                          <option value="advanced">Advanced (Nâng cao)</option>
                        </select>
                      </div>

                      {/* Giá & Thời lượng */}
                      <div className="col-md-6">
                        <label className="form-label">Giá tiền (VNĐ)</label>
                        <input
                          type="text"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          className="form-control"
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Thời lượng (Giờ)</label>
                        <input
                          type="number"
                          name="duration_hours"
                          value={formData.duration_hours}
                          onChange={handleInputChange}
                          className="form-control"
                          placeholder="VD: 10"
                          min="0"
                        />
                      </div>

                      {/* URL */}
                      <div className="col-12">
                        <label className="form-label">
                          Link khóa học (URL)
                        </label>
                        <input
                          type="url"
                          name="url"
                          value={formData.url}
                          onChange={handleInputChange}
                          className="form-control"
                          placeholder="https://..."
                        />
                      </div>

                      {/* Mô tả */}
                      <div className="col-12">
                        <label className="form-label">Mô tả chi tiết</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          className="form-control"
                          rows="4"
                          placeholder="Nội dung khóa học..."
                        ></textarea>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    form="courseForm"
                    className="btn btn-primary d-flex align-items-center"
                  >
                    <Save size={18} className="me-2" />
                    {isEditing ? "Lưu thay đổi" : "Tạo khóa học"}
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

export default CourseManagement;
