import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Briefcase,
  Plus,
  Search,
  Edit,
  Trash2,
  TrendingUp,
  Layers,
  DollarSign,
  Save,
  Filter,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

const CareerManagement = () => {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [careers, setCareers] = useState([]);
  const [industries, setIndustries] = useState([]); // State lưu danh sách ngành để chọn
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // --- STATE UI ---
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // --- PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // --- FORM STATE ---
  const initialFormState = {
    title: "",
    industry: "", // ID của ngành
    level: "",
    description: "",
    salary_min: "",
    salary_max: "",
    future_outlook: "",
  };
  const [formData, setFormData] = useState(initialFormState);
  const [editId, setEditId] = useState(null);

  // --- API CONFIG ---
  const BASE_URL = "http://127.0.0.1:8000/api/admin";
  const CAREER_API_URL = `${BASE_URL}/careers/`;
  const INDUSTRY_API_URL = `${BASE_URL}/industries/`;

  // --- 1. FETCH DATA (Careers & Industries) ---
  const fetchAllData = async () => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      // Gọi cả 2 API song song
      const [careerRes, industryRes] = await Promise.all([
        axios.get(CAREER_API_URL, config),
        axios.get(INDUSTRY_API_URL, config),
      ]);

      setCareers(careerRes.data.data || careerRes.data);
      setIndustries(industryRes.data.data || industryRes.data);
    } catch (error) {
      toast.error("Không thể tải dữ liệu.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- 2. HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const openEditModal = (career) => {
    setIsEditing(true);
    setEditId(career.id);
    setFormData({
      title: career.title,
      // Xử lý lấy ID ngành: Nếu là object thì lấy .id, nếu là số thì lấy luôn
      industry:
        typeof career.industry === "object"
          ? career.industry?.id
          : career.industry,
      level: career.level || "",
      description: career.description || "",
      salary_min: career.salary_min || "",
      salary_max: career.salary_max || "",
      future_outlook: career.future_outlook || "",
    });
    setShowModal(true);
  };

  // --- 3. SUBMIT (Create / Update) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    if (!formData.title) return toast.warning("Vui lòng nhập tên nghề nghiệp");
    if (!formData.industry) return toast.warning("Vui lòng chọn ngành nghề");

    try {
      const submitData = {
        ...formData,
        salary_min: formData.salary_min
          ? parseFloat(formData.salary_min)
          : null,
        salary_max: formData.salary_max
          ? parseFloat(formData.salary_max)
          : null,
        industry: parseInt(formData.industry), // Đảm bảo gửi lên là số nguyên (ID)
      };

      if (isEditing) {
        await axios.put(`${CAREER_API_URL}${editId}/`, submitData, config);
        toast.success("Cập nhật thành công!");
      } else {
        await axios.post(CAREER_API_URL, submitData, config);
        toast.success("Thêm mới thành công!");
      }

      setShowModal(false);
      // Chỉ cần load lại danh sách Careers, không cần load lại Industries
      const res = await axios.get(CAREER_API_URL, config);
      setCareers(res.data.data || res.data);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || "Có lỗi xảy ra khi lưu";
      toast.error(msg);
    }
  };

  // --- 4. DELETE ---
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nghề nghiệp này?")) {
      try {
        const token = localStorage.getItem("access_token");
        await axios.delete(`${CAREER_API_URL}${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Đã xóa thành công");
        // Update UI trực tiếp bằng filter để không cần gọi API lại
        setCareers((prev) => prev.filter((c) => c.id !== id));
      } catch (error) {
        toast.error("Xóa thất bại");
        console.error(error);
      }
    }
  };

  // --- HELPER FUNCTIONS ---
  const formatCurrency = (val) => {
    if (!val) return "Thỏa thuận";
    return parseFloat(val).toLocaleString("vi-VN") + " đ";
  };

  const getLevelBadgeClass = (level) => {
    if (!level) return "badge bg-secondary";
    const lvl = level.toLowerCase();
    if (lvl.includes("intern") || lvl.includes("fresher"))
      return "badge bg-info text-dark";
    if (lvl.includes("junior")) return "badge bg-success";
    if (lvl.includes("senior")) return "badge bg-warning text-dark";
    if (lvl.includes("lead") || lvl.includes("manager"))
      return "badge bg-danger";
    return "badge bg-primary";
  };

  // --- FILTER & PAGINATION ---
  const filteredCareers = careers.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.level && c.level.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCareers = filteredCareers.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredCareers.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="container py-5">
      {/* HEADER */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
        <div className="mb-3 mb-md-0">
          <h2 className="fw-bold d-flex align-items-center text-white">
            <Briefcase className="me-2 text-warning" size={32} /> Quản Lý Nghề
            Nghiệp
          </h2>
          <p className="mb-0 text-white-50">
            Quản lý danh mục nghề, mức lương và xu hướng thị trường
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-warning text-dark fw-bold d-flex align-items-center px-4 py-2 shadow-sm"
        >
          <Plus size={20} className="me-2" /> Thêm Nghề Mới
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
              placeholder="Tìm kiếm theo tên nghề hoặc cấp độ (VD: Backend, Senior)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ boxShadow: "none" }}
            />
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="card shadow border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5 text-muted">
              <div
                className="spinner-border text-warning mb-2"
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
                      Nghề nghiệp / Ngành
                    </th>
                    <th className="py-3 text-secondary text-uppercase small fw-bold">
                      Mức lương & Level
                    </th>
                    <th
                      className="py-3 text-secondary text-uppercase small fw-bold"
                      style={{ width: "30%" }}
                    >
                      Mô tả & Xu hướng
                    </th>
                    <th className="py-3 text-center text-secondary text-uppercase small fw-bold">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentCareers.length > 0 ? (
                    currentCareers.map((career) => (
                      <tr key={career.id}>
                        <td className="ps-4 py-3">
                          <div className="fw-bold text-dark fs-6">
                            {career.title}
                          </div>
                          <div className="mt-1">
                            <span className="badge bg-light text-dark border border-secondary-subtle">
                              {/* Hiển thị tên ngành từ object hoặc ID */}
                              {typeof career.industry === "object"
                                ? career.industry?.name
                                : `Industry ID: ${career.industry || "N/A"}`}
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="d-flex flex-column gap-1">
                            <div className="d-flex align-items-center text-dark fw-bold small">
                              <DollarSign
                                size={14}
                                className="text-success me-1"
                              />
                              {formatCurrency(career.salary_min)} -{" "}
                              {formatCurrency(career.salary_max)}
                            </div>
                            <div className="d-flex align-items-center">
                              <span
                                className={getLevelBadgeClass(career.level)}
                              >
                                <Layers size={12} className="me-1" />
                                {career.level || "General"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div
                            className="text-muted small text-truncate"
                            style={{ maxWidth: "250px" }}
                            title={career.description}
                          >
                            {career.description || "Chưa có mô tả"}
                          </div>
                          {career.future_outlook && (
                            <div
                              className="text-primary small mt-1 d-flex align-items-center text-truncate"
                              style={{ maxWidth: "250px" }}
                              title={career.future_outlook}
                            >
                              <TrendingUp size={12} className="me-1" />
                              {career.future_outlook}
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => openEditModal(career)}
                            className="btn btn-outline-primary btn-sm me-2 border-0"
                            title="Sửa"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(career.id)}
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
                        Không tìm thấy nghề nghiệp nào phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* PAGINATION CONTROL (Có Wrap) */}
              {filteredCareers.length > 0 && (
                <div className="card-footer bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                  <div className="text-muted small">
                    Hiển thị <strong>{indexOfFirstItem + 1}</strong> -{" "}
                    <strong>
                      {Math.min(indexOfLastItem, filteredCareers.length)}
                    </strong>{" "}
                    trong <strong>{filteredCareers.length}</strong> kết quả
                  </div>
                  <nav>
                    <ul className="pagination mb-0 flex-wrap justify-content-end gap-1">
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
                              className="page-link border-0 rounded-circle"
                              onClick={() => paginate(pageNum)}
                              style={{
                                width: "32px",
                                height: "32px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor:
                                  currentPage === pageNum
                                    ? "#ffc107"
                                    : "transparent",
                                color:
                                  currentPage === pageNum ? "black" : "#6c757d",
                                marginBottom: "4px",
                              }}
                            >
                              {pageNum}
                            </button>
                          </li>
                        );
                      })}
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

      {/* MODAL FORM */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content shadow-lg">
                <div className="modal-header bg-light">
                  <h5 className="modal-title fw-bold text-dark">
                    {isEditing ? "Cập Nhật Thông Tin" : "Thêm Nghề Mới"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                <div className="modal-body p-4">
                  <form onSubmit={handleSubmit} id="careerForm">
                    <div className="row g-3 text-dark">
                      {/* Tên nghề */}
                      <div className="col-12">
                        <label className="form-label fw-bold">
                          Tên nghề nghiệp <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="form-control"
                          placeholder="VD: Backend Developer"
                          required
                        />
                      </div>

                      {/* Ngành (Industry Select Box) */}
                      <div className="col-md-6">
                        <label className="form-label">
                          Ngành nghề <span className="text-danger">*</span>
                        </label>
                        <select
                          name="industry"
                          value={formData.industry}
                          onChange={handleInputChange}
                          className="form-select"
                          required
                        >
                          <option value="">-- Chọn ngành --</option>
                          {industries.map((ind) => (
                            <option key={ind.id} value={ind.id}>
                              {ind.name}
                            </option>
                          ))}
                        </select>
                        {industries.length === 0 && (
                          <small className="text-muted d-block mt-1">
                            Đang tải danh sách ngành...
                          </small>
                        )}
                      </div>

                      {/* Cấp độ */}
                      <div className="col-md-6">
                        <label className="form-label">Cấp độ (Level)</label>
                        <input
                          type="text"
                          name="level"
                          value={formData.level}
                          onChange={handleInputChange}
                          className="form-control"
                          placeholder="VD: Senior, Intern..."
                        />
                      </div>

                      {/* Lương */}
                      <div className="col-md-6">
                        <label className="form-label">
                          Lương tối thiểu (VNĐ)
                        </label>
                        <input
                          type="number"
                          name="salary_min"
                          value={formData.salary_min}
                          onChange={handleInputChange}
                          className="form-control"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Lương tối đa (VNĐ)</label>
                        <input
                          type="number"
                          name="salary_max"
                          value={formData.salary_max}
                          onChange={handleInputChange}
                          className="form-control"
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      {/* Mô tả */}
                      <div className="col-12">
                        <label className="form-label">Mô tả công việc</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          className="form-control"
                          rows="3"
                          placeholder="Mô tả chi tiết về nghề nghiệp..."
                        ></textarea>
                      </div>

                      {/* Xu hướng */}
                      <div className="col-12">
                        <label className="form-label text-primary">
                          <TrendingUp size={16} className="me-1" /> Xu hướng
                          tương lai
                        </label>
                        <textarea
                          name="future_outlook"
                          value={formData.future_outlook}
                          onChange={handleInputChange}
                          className="form-control"
                          rows="2"
                          placeholder="VD: Nhu cầu tăng cao trong 5 năm tới..."
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
                    form="careerForm"
                    className="btn btn-warning fw-bold d-flex align-items-center"
                  >
                    <Save size={18} className="me-2" />
                    {isEditing ? "Lưu thay đổi" : "Tạo mới"}
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

export default CareerManagement;
