import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Factory, // Icon thay thế cho Briefcase để hợp với Industry
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  Filter,
  ChevronRight,
  ChevronLeft,
  FileText,
} from "lucide-react";

const IndustryManagement = () => {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // --- STATE UI ---
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // --- PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const initialFormState = {
    name: "",
    description: "",
  };
  const [formData, setFormData] = useState(initialFormState);
  const [editId, setEditId] = useState(null);
  const BASE_URL = "http://127.0.0.1:8000/api/admin";
  const INDUSTRY_API_URL = `${BASE_URL}/industries/`;

  const fetchIndustries = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const response = await axios.get(INDUSTRY_API_URL, config);
      const data = response.data.data || response.data.results || response.data;
      setIndustries(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Không thể tải danh sách ngành nghề.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [INDUSTRY_API_URL]);

  useEffect(() => {
    fetchIndustries();
  }, [fetchIndustries]);

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

  const openEditModal = (industry) => {
    setIsEditing(true);
    setEditId(industry.id);
    setFormData({
      name: industry.name,
      description: industry.description || "",
    });
    setShowModal(true);
  };

  // --- 3. SUBMIT (Create / Update) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    if (!formData.name.trim())
      return toast.warning("Vui lòng nhập tên ngành nghề");

    try {
      if (isEditing) {
        await axios.put(`${INDUSTRY_API_URL}${editId}/`, formData, config);
        toast.success("Cập nhật ngành nghề thành công!");
      } else {
        await axios.post(INDUSTRY_API_URL, formData, config);
        toast.success("Thêm ngành nghề mới thành công!");
      }

      setShowModal(false);
      fetchIndustries();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.name
        ? `Lỗi: ${error.response.data.name[0]}`
        : error.response?.data?.message || "Có lỗi xảy ra khi lưu";
      toast.error(msg);
    }
  };

  // --- 4. DELETE ---
  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn xóa ngành nghề này? Hành động này có thể ảnh hưởng đến các nghề nghiệp liên quan!"
      )
    ) {
      try {
        const token = localStorage.getItem("access_token");
        await axios.delete(`${INDUSTRY_API_URL}${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Đã xóa thành công");
        setIndustries((prev) => prev.filter((item) => item.id !== id));
      } catch (error) {
        toast.error("Xóa thất bại (Có thể do ràng buộc dữ liệu)");
        console.error(error);
      }
    }
  };

  // --- FILTER & PAGINATION ---
  const filteredIndustries = industries.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentIndustries = filteredIndustries.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredIndustries.length / itemsPerPage);

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
            {" "}
            {/* Đổi màu chữ nếu nền sáng */}
            <Factory className="me-2 text-white" size={32} /> Quản Lý Ngành Nghề
          </h2>
          <p className="mb-0 text-white">
            Quản lý danh sách các lĩnh vực/ngành nghề trong hệ thống
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary fw-bold d-flex align-items-center px-4 py-2 shadow-sm"
        >
          <Plus size={20} className="me-2" /> Thêm Ngành Mới
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
              placeholder="Tìm kiếm theo tên ngành hoặc mô tả..."
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
                    <th
                      className="py-3 ps-4 text-secondary text-uppercase small fw-bold"
                      style={{ width: "30%" }}
                    >
                      Tên Ngành
                    </th>
                    <th className="py-3 text-secondary text-uppercase small fw-bold">
                      Mô Tả Chi Tiết
                    </th>
                    <th
                      className="py-3 text-secondary text-uppercase small fw-bold"
                      style={{ width: "15%" }}
                    >
                      Ngày Tạo
                    </th>
                    <th
                      className="py-3 text-center text-secondary text-uppercase small fw-bold"
                      style={{ width: "15%" }}
                    >
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentIndustries.length > 0 ? (
                    currentIndustries.map((ind) => (
                      <tr key={ind.id}>
                        <td className="ps-4 py-3">
                          <div className="fw-bold text-dark fs-6">
                            {ind.name}
                          </div>
                          <span className="badge bg-light text-secondary border border-secondary-subtle mt-1">
                            ID: {ind.id}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="d-flex align-items-start text-muted small">
                            <FileText
                              size={16}
                              className="me-2 mt-1 flex-shrink-0"
                            />
                            <span
                              className="text-truncate-3"
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {ind.description || "Chưa có mô tả"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <small className="text-muted">
                            {ind.created_at
                              ? new Date(ind.created_at).toLocaleDateString(
                                  "vi-VN"
                                )
                              : "--"}
                          </small>
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => openEditModal(ind)}
                            className="btn btn-outline-primary btn-sm me-2 border-0"
                            title="Sửa"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(ind.id)}
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
                        Không tìm thấy ngành nghề nào phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* PAGINATION CONTROL */}
              {filteredIndustries.length > 0 && (
                <div className="card-footer bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                  <div className="text-muted small">
                    Hiển thị <strong>{indexOfFirstItem + 1}</strong> -{" "}
                    <strong>
                      {Math.min(indexOfLastItem, filteredIndustries.length)}
                    </strong>{" "}
                    trong <strong>{filteredIndustries.length}</strong> kết quả
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
                                    ? "#0d6efd" // Màu xanh Primary
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
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg">
                <div className="modal-header bg-light">
                  <h5 className="modal-title fw-bold text-dark">
                    {isEditing ? "Cập Nhật Ngành Nghề" : "Thêm Ngành Mới"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                <div className="modal-body p-4">
                  <form onSubmit={handleSubmit} id="industryForm">
                    <div className="row g-3 text-dark">
                      {/* Tên ngành */}
                      <div className="col-12">
                        <label className="form-label fw-bold">
                          Tên ngành <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="form-control"
                          placeholder="VD: Information Technology"
                          required
                        />
                      </div>

                      {/* Mô tả */}
                      <div className="col-12">
                        <label className="form-label">Mô tả</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          className="form-control"
                          rows="4"
                          placeholder="Mô tả chi tiết về lĩnh vực này..."
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
                    form="industryForm"
                    className="btn btn-primary fw-bold d-flex align-items-center"
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

export default IndustryManagement;
