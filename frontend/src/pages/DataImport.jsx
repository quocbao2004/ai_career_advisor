import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  Database,
  X,
  Trash2,
  Plus,
  Save,
  Edit3,
} from "lucide-react";

const DataImport = () => {
  const [selectedModel, setSelectedModel] = useState("industry");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // State lưu dữ liệu xem trước để chỉnh sửa
  const [previewData, setPreviewData] = useState([]);
  const [previewHeaders, setPreviewHeaders] = useState([]);

  const importOptions = [
    {
      id: "industries",
      label: "Ngành (Industries)",
      color: "#4f46e5",
    },
    {
      id: "careers",
      label: "Nghề nghiệp (Careers)",
      color: "#ec4899",
    },
    {
      id: "courses",
      label: "Khóa học (Courses)",
      color: "#f59e0b",
    },
  ];

  const readExcel = (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Đọc dưới dạng mảng 2 chiều để dễ chỉnh sửa trên UI
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (jsonData.length > 0) {
        // Hàng đầu tiên là header
        const headers = jsonData[0];
        // Các hàng còn lại là data (lọc bỏ các dòng trống hoàn toàn nếu cần)
        const rows = jsonData.slice(1).filter((row) => row.length > 0);

        setPreviewHeaders(headers);
        setPreviewData(rows);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (selectedFile && validTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
      readExcel(selectedFile);
    } else {
      toast.error("Vui lòng chỉ chọn file Excel (.xlsx, .xls) hoặc CSV!");
      e.target.value = null;
    }
  };

  const handleCellChange = (rowIndex, colIndex, value) => {
    const newData = [...previewData];
    if (!newData[rowIndex]) newData[rowIndex] = [];
    newData[rowIndex][colIndex] = value;
    setPreviewData(newData);
  };

  const handleDeleteRow = (rowIndex) => {
    const newData = previewData.filter((_, index) => index !== rowIndex);
    setPreviewData(newData);
  };

  const handleAddRow = () => {
    const emptyRow = new Array(previewHeaders.length).fill("");
    setPreviewData([...previewData, emptyRow]);
  };

  // --- LOGIC GỬI JSON ĐÃ ĐƯỢC CHỈNH SỬA ---
  const handleUpload = async () => {
    if (!previewData.length)
      return toast.warning("Không có dữ liệu để import!");

    // Hỏi xác nhận
    const result = await Swal.fire({
      title: "Xác nhận Import?",
      text: `Bạn sẽ import ${
        previewData.length
      } dòng dữ liệu vào bảng ${selectedModel.toUpperCase()}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Đồng ý Import (JSON)",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    setProgress(0);

    try {
      // 1. Chuyển đổi Array of Arrays (Data xem trước) thành Array of Objects
      // Ví dụ: [['Nam', 20], ['Nu', 18]] => [{name: 'Nam', age: 20}, {name: 'Nu', age: 18}]
      const jsonPayload = previewData.map((row) => {
        let rowObject = {};
        previewHeaders.forEach((header, index) => {
          // Loại bỏ khoảng trắng thừa ở key nếu có và gán giá trị
          const key = String(header).trim();
          rowObject[key] = row[index] !== undefined ? row[index] : "";
        });
        return rowObject;
      });

      // 2. Tạo Body gửi đi
      const payload = {
        model: selectedModel,
        data: jsonPayload, // Dữ liệu dạng mảng object
      };

      const token = localStorage.getItem("access_token");

      // 3. Gửi Request dạng JSON
      await axios.post(
        "https://ai-career-advisor-4006.onrender.com/api/admin/import-data/",
        payload,
        {
          headers: {
            "Content-Type": "application/json", // Header quan trọng để server hiểu là JSON
            Authorization: `Bearer ${token}`,
          },
          // Upload progress với JSON chạy rất nhanh, có thể không mượt như file nhưng vẫn dùng được
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          },
        }
      );

      toast.success("Import dữ liệu JSON thành công! 🎉");

      // Reset trạng thái
      setFile(null);
      setPreviewData([]);
      setPreviewHeaders([]);
      setProgress(0);
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || "Lỗi khi import dữ liệu";
      Swal.fire({
        title: "Import Thất bại",
        text: message,
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetFile = () => {
    setFile(null);
    setPreviewData([]);
    setPreviewHeaders([]);
    setProgress(0);
  };

  const downloadTemplate = () => {
    toast.info(`Đang tải mẫu file Excel cho ${selectedModel}...`);
    // Logic tải mẫu ở đây
  };

  return (
    <div className="container py-5 fade-in">
      <div className="d-flex align-items-center mb-4">
        <div className="bg-primary text-white p-3 rounded-3 me-3">
          <Database size={24} />
        </div>
        <div>
          <h2 className="fw-bold mb-1">Import Dữ Liệu (JSON Mode)</h2>
          <p className="text-muted m-0">
            Chuyển đổi Excel sang JSON và đẩy lên Server
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* Cột trái: Menu chọn */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white fw-bold py-3">
              1. Chọn loại dữ liệu
            </div>
            <div className="card-body">
              <div className="d-flex flex-column gap-2">
                {importOptions.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedModel(opt.id)}
                    className={`p-3 rounded border cursor-pointer d-flex align-items-center transition-all ${
                      selectedModel === opt.id
                        ? "bg-primary-subtle border-primary"
                        : "hover-bg-light"
                    }`}
                  >
                    <div
                      className={`rounded-circle p-2 text-white me-3`}
                      style={{ background: opt.color }}
                    >
                      <FileSpreadsheet size={18} />
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1">{opt.label}</h6>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm bg-light">
            <div className="card-body">
              <button
                onClick={downloadTemplate}
                className="btn btn-outline-dark w-100 btn-sm"
              >
                <Download size={16} className="me-2" /> Tải File Mẫu (.xlsx)
              </button>
            </div>
          </div>
        </div>

        {/* Cột phải: Khu vực Upload & Preview */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
              <span>2. Tải lên & Chỉnh sửa</span>
              {file && <span className="badge bg-success">Đã chọn file</span>}
            </div>

            <div className="card-body">
              {!file ? (
                // --- Giao diện DROPZONE ---
                <label
                  htmlFor="fileInput"
                  className="upload-area w-100 d-flex flex-column align-items-center justify-content-center border border-2 border-dashed rounded-3 bg-light p-5 cursor-pointer"
                  style={{ minHeight: "300px", borderColor: "#ccc" }}
                >
                  <UploadCloud size={64} className="text-secondary mb-3" />
                  <h5 className="fw-bold text-secondary">
                    Kéo thả file vào đây
                  </h5>
                  <p className="text-muted">
                    Hệ thống sẽ tự động chuyển đổi sang JSON
                  </p>
                  <input
                    id="fileInput"
                    type="file"
                    className="d-none"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                // --- Giao diện FILE INFO & EDITABLE TABLE ---
                <div className="w-100">
                  <div className="d-flex align-items-center justify-content-between bg-light p-3 rounded mb-3 border">
                    <div className="d-flex align-items-center">
                      <FileSpreadsheet
                        size={32}
                        className="text-success me-3"
                      />
                      <div>
                        <h6 className="fw-bold m-0">{file.name}</h6>
                        <small className="text-muted">
                          {(file.size / 1024).toFixed(2)} KB - Sẵn sàng chuyển
                          JSON
                        </small>
                      </div>
                    </div>
                    <button
                      onClick={resetFile}
                      className="btn btn-sm btn-outline-danger"
                      disabled={loading}
                    >
                      <X size={16} /> Hủy bỏ
                    </button>
                  </div>

                  {/* THANH LOADING */}
                  {loading && (
                    <div className="progress mb-3" style={{ height: "10px" }}>
                      <div
                        className="progress-bar progress-bar-striped progress-bar-animated bg-success"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  )}

                  {/* BẢNG CHỈNH SỬA DỮ LIỆU */}
                  {previewHeaders.length > 0 && (
                    <div className="mb-4 border rounded overflow-hidden">
                      <div className="bg-light px-3 py-2 border-bottom d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                          <Edit3 size={16} className="me-2 text-primary" />
                          <small className="fw-bold text-uppercase text-primary">
                            Review dữ liệu ({previewData.length} dòng)
                          </small>
                        </div>
                        <button
                          className="btn btn-xs btn-outline-success py-0"
                          style={{ fontSize: "0.8rem" }}
                          onClick={handleAddRow}
                        >
                          <Plus size={14} className="me-1" /> Thêm dòng
                        </button>
                      </div>

                      <div
                        className="table-responsive"
                        style={{ maxHeight: "400px" }}
                      >
                        <table
                          className="table table-sm table-bordered table-hover mb-0"
                          style={{ fontSize: "0.85rem" }}
                        >
                          <thead
                            className="table-light sticky-top"
                            style={{ top: 0, zIndex: 5 }}
                          >
                            <tr>
                              <th
                                className="text-center"
                                style={{ width: "50px" }}
                              >
                                #
                              </th>
                              {previewHeaders.map((head, i) => (
                                <th key={i} className="text-nowrap">
                                  {head}
                                </th>
                              ))}
                              <th
                                className="text-center"
                                style={{ width: "50px" }}
                              >
                                Xóa
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.map((row, rIndex) => (
                              <tr key={rIndex}>
                                <td className="text-center text-muted align-middle">
                                  {rIndex + 1}
                                </td>
                                {previewHeaders.map((_, cIndex) => (
                                  <td key={cIndex} className="p-0">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm border-0 shadow-none rounded-0 bg-transparent"
                                      value={
                                        row[cIndex] !== undefined
                                          ? row[cIndex]
                                          : ""
                                      }
                                      onChange={(e) =>
                                        handleCellChange(
                                          rIndex,
                                          cIndex,
                                          e.target.value
                                        )
                                      }
                                      style={{ minWidth: "100px" }}
                                    />
                                  </td>
                                ))}
                                <td className="text-center align-middle">
                                  <button
                                    className="btn btn-link text-danger p-0"
                                    onClick={() => handleDeleteRow(rIndex)}
                                    title="Xóa dòng này"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {previewData.length === 0 && (
                              <tr>
                                <td
                                  colSpan={previewHeaders.length + 2}
                                  className="text-center py-3 text-muted"
                                >
                                  Dữ liệu trống. Hãy thêm dòng mới.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* NÚT ACTION */}
                  <div className="d-grid">
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleUpload}
                      disabled={loading || previewData.length === 0}
                    >
                      {loading ? (
                        "Đang đẩy dữ liệu JSON..."
                      ) : (
                        <span>
                          <Save size={20} className="me-2" /> Thêm dữ liệu
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataImport;
