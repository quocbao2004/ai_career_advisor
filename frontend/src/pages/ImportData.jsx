import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  Trash2,
  AlertCircle,
  CheckCircle,
  FileText,
  Server,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function App() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [fileName, setFileName] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [libraryLoaded, setLibraryLoaded] = useState(false);

  // States cho Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  // States cho Upload
  // Mặc định trỏ về Career API như ví dụ trước
  const [serverUrl, setServerUrl] = useState(
    "http://localhost:8000/api/admin/careers"
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error' | null

  const fileInputRef = useRef(null);

  // Load thư viện SheetJS từ CDN
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
    script.async = true;
    script.onload = () => setLibraryLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // --- CÁC HÀM XỬ LÝ FILE & KÉO THẢ ---
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) processFile(e.dataTransfer.files[0]);
  };
  const handleFileInput = (e) => {
    if (e.target.files.length) processFile(e.target.files[0]);
  };

  const processFile = (file) => {
    if (!libraryLoaded) return;
    setIsLoading(true);
    setError(null);
    setUploadStatus(null);
    setFileName(file.name);
    setCurrentPage(1);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = window.XLSX.read(e.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = window.XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!jsonData.length) {
          setError("File rỗng.");
          setIsLoading(false);
          return;
        }

        const headers = jsonData[0];
        const rows = jsonData.slice(1).filter((row) => row.length > 0);

        // Map dữ liệu sang object và thêm _id nội bộ
        const formattedRows = rows.map((row, index) => {
          const rowData = {};
          headers.forEach((header, i) => (rowData[header] = row[i] || ""));
          // Thêm unique ID để dễ quản lý xóa/sửa trên UI (không gửi lên server)
          return { _id: Date.now() + index, ...rowData };
        });

        setColumns(headers);
        setData(formattedRows);
      } catch (err) {
        setError("Lỗi đọc file. Vui lòng kiểm tra định dạng.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const removeFile = () => {
    setData([]);
    setColumns([]);
    setFileName(null);
    setError(null);
    setUploadStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteRow = (idToDelete) => {
    if (window.confirm("Bạn có chắc muốn xóa dòng này?")) {
      const newData = data.filter((row) => row._id !== idToDelete);
      setData(newData);

      // Nếu xóa hết dòng ở trang cuối thì lùi về 1 trang
      const maxPage = Math.ceil(newData.length / rowsPerPage);
      if (currentPage > maxPage && maxPage > 0) {
        setCurrentPage(maxPage);
      }
    }
  };

  const handleCellChange = (id, column, newValue) => {
    const newData = data.map((row) => {
      if (row._id === id) {
        return { ...row, [column]: newValue };
      }
      return row;
    });
    setData(newData);
  };

  // --- LOGIC PHÂN TRANG ---
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = data.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(data.length / rowsPerPage);

  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  // --- XỬ LÝ GỬI SERVER (ĐÃ HOÀN THIỆN) ---
  const handleUploadToServer = async () => {
    if (!serverUrl || data.length === 0) return;

    setIsUploading(true);
    setUploadStatus(null);
    setError(null);

    try {
      // 1. Chuẩn bị dữ liệu: Loại bỏ trường _id (vì backend không cần)
      // data gửi đi sẽ là mảng các object: [{title: 'A', salary: 100}, ...]
      const payload = data.map(({ _id, ...rest }) => rest);

      // 2. Lấy token từ LocalStorage (nếu ứng dụng có login)
      // const token = localStorage.getItem("accessToken");

      // 3. Gọi API
      const response = await fetch(serverUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "Authorization": token ? `Bearer ${token}` : "", // Bỏ comment nếu cần Auth
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      // 4. Kiểm tra kết quả
      if (!response.ok) {
        // Ném lỗi nếu status code không phải 2xx
        throw new Error(
          responseData.message || JSON.stringify(responseData) || "Lỗi server"
        );
      }

      // 5. Thành công
      setUploadStatus("success");
      console.log("Success Response:", responseData);

      // Tùy chọn: Có thể xóa data sau khi upload thành công hoặc giữ lại
      // removeFile();
    } catch (err) {
      console.error("Upload Error:", err);
      setUploadStatus("error");
      setError(err.message || "Không thể kết nối đến server.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 py-5">
      <div className="container">
        <div className="card shadow-sm border-0">
          {/* HEADER */}
          <div className="card-header bg-white border-bottom p-4">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-primary bg-opacity-10 p-2 rounded">
                <FileSpreadsheet className="text-primary" size={32} />
              </div>
              <div>
                <h4 className="mb-0 fw-bold text-dark">
                  Review & Upload Dữ Liệu
                </h4>
              </div>
            </div>
          </div>

          <div className="card-body p-4">
            {/* ERROR ALERT */}
            {error && (
              <div className="alert alert-danger d-flex align-items-center mb-3">
                <AlertCircle className="me-2" size={20} /> {error}
              </div>
            )}

            {/* DRAG & DROP ZONE */}
            {data.length === 0 && (
              <div
                className={`p-5 text-center border rounded-3 mb-3 position-relative ${
                  isDragging
                    ? "bg-primary bg-opacity-10 border-primary"
                    : "bg-white"
                }`}
                style={{
                  borderStyle: "dashed",
                  borderWidth: "2px",
                  cursor: "pointer",
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="d-none"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileInput}
                />
                <div className="mb-3">
                  <div className="bg-primary bg-opacity-10 d-inline-block p-3 rounded-circle">
                    <Upload className="text-primary" size={40} />
                  </div>
                </div>
                <h5 className="fw-semibold">Chọn file Excel/CSV</h5>
                <p className="text-muted small mb-0">
                  {!libraryLoaded
                    ? "Đang tải thư viện xử lý Excel..."
                    : "Kéo thả hoặc click để chọn"}
                </p>
              </div>
            )}

            {/* LOADING SPINNER */}
            {isLoading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" />
                <p className="mt-2 text-muted">Đang đọc file...</p>
              </div>
            )}

            {/* DATA PREVIEW TABLE */}
            {data.length > 0 && !isLoading && (
              <div className="animate-fade-in">
                {/* File Info Bar */}
                <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded border mb-4">
                  <div className="d-flex align-items-center gap-3">
                    {fileName?.endsWith(".csv") ? (
                      <FileText className="text-success" />
                    ) : (
                      <FileSpreadsheet className="text-success" />
                    )}
                    <div>
                      <div className="fw-bold">{fileName}</div>
                      <small className="text-muted">
                        Tổng: {data.length} dòng
                      </small>
                    </div>
                  </div>
                  <button
                    className="btn btn-outline-danger btn-sm d-flex gap-2"
                    onClick={removeFile}
                    disabled={isUploading}
                  >
                    <Trash2 size={16} /> Hủy & Chọn lại
                  </button>
                </div>

                {/* Table */}
                <div className="border rounded mb-3 bg-white">
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover mb-0 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th className="text-center" style={{ width: "50px" }}>
                            #
                          </th>
                          <th className="text-center" style={{ width: "60px" }}>
                            Xóa
                          </th>
                          {columns.map((col, idx) => (
                            <th
                              key={idx}
                              className="text-nowrap"
                              style={{ minWidth: "150px" }}
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {currentRows.map((row, index) => (
                          <tr key={row._id}>
                            <td className="text-center text-muted small">
                              {indexOfFirstRow + index + 1}
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-link text-danger p-0"
                                onClick={() => handleDeleteRow(row._id)}
                                title="Xóa dòng này"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                            {columns.map((col, cIdx) => (
                              <td key={cIdx} className="p-1">
                                <input
                                  type="text"
                                  className="form-control form-control-sm border-0 bg-transparent shadow-none"
                                  value={row[col]}
                                  onChange={(e) =>
                                    handleCellChange(
                                      row._id,
                                      col,
                                      e.target.value
                                    )
                                  }
                                  style={{ minWidth: "100%" }}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
                    <small className="text-muted">
                      Hiển thị {indexOfFirstRow + 1} -{" "}
                      {Math.min(indexOfLastRow, data.length)} trên tổng{" "}
                      {data.length}
                    </small>
                    <div className="d-flex align-items-center gap-2">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="small fw-bold px-2">
                        Trang {currentPage} / {totalPages}
                      </span>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Upload Configuration Section */}
                <div className="card bg-white border shadow-sm p-4 mt-4">
                  <h6 className="fw-bold d-flex align-items-center gap-2 mb-3">
                    <Server size={18} className="text-primary" /> Cấu hình & Gửi
                    dữ liệu
                  </h6>

                  <div className="row g-3 align-items-end">
                    <div className="col-md-8">
                      <label className="form-label small text-muted">
                        Chọn API Endpoint (POST) để nạp data
                      </label>
                      <select
                        className="form-control"
                        name="apiEndpoint"
                        id="apiEndpoint"
                        value={serverUrl}
                        onChange={(e) => setServerUrl(e.target.value)}
                      >
                        <option value="">-- Chọn bảng cần nhập --</option>
                        {/* URL trỏ tới Django Localhost */}
                        <option value="http://localhost:8000/api/admin/careers">
                          Careers (Bulk Create)
                        </option>
                        <option value="http://localhost:8000/api/admin/courses">
                          Courses
                        </option>
                        <option value="http://localhost:8000/api/admin/industries">
                          Industries
                        </option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <button
                        className={`btn w-100 ${
                          uploadStatus === "success"
                            ? "btn-success"
                            : "btn-primary"
                        }`}
                        onClick={handleUploadToServer}
                        disabled={
                          isUploading || !serverUrl || data.length === 0
                        }
                      >
                        {isUploading ? (
                          <span className="d-flex align-items-center justify-content-center gap-2">
                            <Loader2 className="animate-spin" size={18} /> Đang
                            xử lý...
                          </span>
                        ) : uploadStatus === "success" ? (
                          <span className="d-flex align-items-center justify-content-center gap-2">
                            <CheckCircle size={18} /> Thành công!
                          </span>
                        ) : (
                          <span className="d-flex align-items-center justify-content-center gap-2">
                            <Send size={18} /> Gửi {data.length} dòng
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Status Messages */}
                  {uploadStatus === "success" && (
                    <div className="alert alert-success mt-3 mb-0 py-2 small animate-fade-in">
                      <CheckCircle size={16} className="me-2 inline" />
                      Đã gửi {data.length} dòng dữ liệu thành công!
                    </div>
                  )}
                  {uploadStatus === "error" && (
                    <div className="alert alert-danger mt-3 mb-0 py-2 small animate-fade-in">
                      <AlertCircle size={16} className="me-2 inline" />
                      Gửi thất bại. {error}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
