import React, { useState, useEffect } from "react";
import axios from "axios";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "react-toastify";
const MasterSkillManagement = () => {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [skills, setSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Đổi tên thành isLoading cho khớp JSX
  const [error, setError] = useState(null);

  // --- STATE QUẢN LÝ UI ---
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // --- STATE FORM ---
  const initialFormState = {
    id: null,
    skill_name: "",
    type: "hard_skill",
    description: "",
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- CẤU HÌNH API ---
  const API_URL = "http://127.0.0.1:8000/api/admin/master-skills/";

  // Hàm helper để lấy Header chứa Token (đảm bảo token luôn mới nhất)
  const getAuthConfig = () => {
    const token = localStorage.getItem("access_token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // --- 1. LẤY DỮ LIỆU (GET) ---
  const fetchMasterSkills = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL, getAuthConfig());
      // Xử lý linh hoạt: nếu backend trả về { data: [...] } hoặc trả về mảng trực tiếp [...]
      setSkills(response.data.data || response.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Không thể kết nối đến server hoặc bạn không có quyền Admin.");
    } finally {
      setIsLoading(false);
    }
  };

  // Gọi API khi component mount
  useEffect(() => {
    fetchMasterSkills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 2. XỬ LÝ FORM (INPUT CHANGE) ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // --- 3. MỞ MODAL (ADD / EDIT) ---
  const handleOpenModal = (skill = null) => {
    if (skill) {
      setIsEditing(true);
      setFormData(skill);
    } else {
      setIsEditing(false);
      setFormData(initialFormState);
    }
    setShowModal(true);
  };

  // --- 4. LƯU DỮ LIỆU (POST / PUT) ---
  const handleSave = async () => {
    // Validate đơn giản
    if (!formData.skill_name.trim()) {
      alert("Vui lòng nhập tên kỹ năng!");
      return;
    }

    setIsLoading(true); // Bật loading khi đang lưu
    try {
      const config = getAuthConfig();

      if (isEditing) {
        // --- PUT (Update) ---
        // axios.put(url, data, config)
        await axios.put(`${API_URL}${formData.id}/`, formData, config);

        // Cập nhật UI ngay lập tức
        setSkills((prev) =>
          prev.map((item) => (item.id === formData.id ? formData : item))
        );
        toast.success("Cập nhật thành công!");
      } else {
        // --- POST (Create) ---
        // axios.post(url, data, config)
        const response = await axios.post(API_URL, formData, config);

        // Thêm item mới vào đầu danh sách
        setSkills([response.data.data, ...skills]);
        toast.success("Thêm mới thành công!");
      }

      setShowModal(false);
    } catch (err) {
      console.error("Save Error:", err);
      // Lấy message lỗi từ backend nếu có
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message;
      toast.error(`Lỗi khi lưu: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 5. XÓA DỮ LIỆU (DELETE) ---
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa kỹ năng này?")) {
      return;
    }

    try {
      // axios.delete(url, config)
      await axios.delete(`${API_URL}${id}/`, getAuthConfig());

      // Cập nhật UI: lọc bỏ item đã xóa
      setSkills((prevSkills) => prevSkills.filter((s) => s.id !== id));
      toast.success("OK");
    } catch (err) {
      console.error("Delete Error:", err);
      const message = err.response?.data?.error || "Có lỗi khi xóa kỹ năng.";
      toast.error(message);
    }
  };

  // --- FILTER CLIENT-SIDE ---
  const filteredSkills = skills.filter(
    (skill) =>
      skill.skill_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (skill.description &&
        skill.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Cắt danh sách
  const currentSkills = filteredSkills.slice(indexOfFirstItem, indexOfLastItem);
  // Tong so trang
  const totalPages = Math.ceil(filteredSkills.length / itemsPerPage);
  // chuyen trang
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  // reset khi tim kiem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h3 mb-0 text-gray-800">Quản Lý Master Skills</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <i className="bi bi-plus-lg me-2"></i> Thêm Kỹ Năng
        </button>
      </div>

      {/* Thanh Tìm Kiếm & Thông báo Lỗi */}
      <div className="card shadow mb-4">
        <div className="card-header py-3 bg-white">
          <div className="input-group">
            <span className="input-group-text bg-light border-0">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control border-0 bg-light"
              placeholder="Tìm kiếm kỹ năng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="card-body p-0">
          {error && <div className="alert alert-danger m-3">{error}</div>}

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4" style={{ width: "50px" }}>
                    #
                  </th>
                  <th>Tên Kỹ Năng</th>
                  <th>Loại</th>
                  <th>Mô Tả</th>
                  <th className="text-end pe-4">Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && currentSkills.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      ></div>
                      <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                    </td>
                  </tr>
                ) : currentSkills.length > 0 ? (
                  currentSkills.map((skill, index) => (
                    <tr key={skill.id}>
                      <td className="ps-4">{index + 1}</td>
                      <td>
                        <span className="fw-medium">{skill.skill_name}</span>
                      </td>
                      <td>
                        {skill.type === "hard_skill" ? (
                          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10 rounded-pill px-3">
                            Hard Skill
                          </span>
                        ) : (
                          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-10 rounded-pill px-3">
                            Soft Skill
                          </span>
                        )}
                      </td>
                      <td className="text-muted small">
                        {skill.description || "-"}
                      </td>
                      <td className="text-end pe-4">
                        <button
                          className="btn btn-sm btn-link text-primary text-decoration-none"
                          onClick={() => handleOpenModal(skill)}
                        >
                          Sửa
                        </button>
                        <button
                          className="btn btn-sm btn-link text-danger text-decoration-none ms-2"
                          onClick={() => handleDelete(skill.id)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">
                      {!isLoading && "Không tìm thấy dữ liệu nào."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {filteredSkills.length > 0 && (
              <div className="card-footer bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                <div className="text-muted small">
                  Hiển thị <strong>{indexOfFirstItem + 1}</strong> -{" "}
                  <strong>
                    {Math.min(indexOfLastItem, filteredSkills.length)}
                  </strong>{" "}
                  trong tổng số <strong>{filteredSkills.length}</strong> khóa
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
        </div>
      </div>

      {/* Modal Popup */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content text-dark">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {isEditing ? "Cập nhật Kỹ Năng" : "Thêm Mới Kỹ Năng"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <form>
                    <div className="mb-3">
                      <label className="form-label">
                        Tên Kỹ Năng <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="skill_name"
                        value={formData.skill_name}
                        onChange={handleInputChange}
                        autoFocus
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Loại Kỹ Năng</label>
                      <select
                        className="form-select"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                      >
                        <option value="hard_skill">
                          Hard Skill (Chuyên môn)
                        </option>
                        <option value="soft_skill">
                          Soft Skill (Kỹ năng mềm)
                        </option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Mô Tả</label>
                      <textarea
                        className="form-control"
                        name="description"
                        rows="3"
                        value={formData.description}
                        onChange={handleInputChange}
                      ></textarea>
                    </div>
                  </form>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setShowModal(false)}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={isLoading}
                  >
                    {isLoading
                      ? "Đang lưu..."
                      : isEditing
                      ? "Cập nhật"
                      : "Thêm mới"}
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

export default MasterSkillManagement;
