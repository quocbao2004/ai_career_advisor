import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/common/GlassCard"; // Giả định component card của bạn
import {
  Target,
  RotateCcw,
  Briefcase,
  Map,
  ChevronRight,
  Loader2,
  CheckCircle,
} from "lucide-react";

// Import API services
import { getCareersByIndustryId } from "../api/careerApi";
// --- THAY ĐỔI: Import hàm tạo lộ trình từ learningApi ---
import { generateLearningPath } from "../api/learningPathApi";

// Import responsive CSS
import "../assets/css-custom/quiz-result.css";

// --- Helper: Chuẩn hóa dữ liệu từ Backend ---
const normalizeIndustries = (recommended) => {
  const raw = Array.isArray(recommended) ? recommended : [];
  return raw
    .map((item) => {
      if (!item) return null;
      // Map đúng key từ backend trả về
      const id = item.industry_id || item.id;
      const name = item.industry_name || item.name;

      if (!id || !name) return null;
      return { id, name, ...item };
    })
    .filter(Boolean);
};

// --- Component con: Career Item ---
const CareerItem = ({ career, onGenerate, isGenerating }) => {
  return (
    <div className="career-item-card">
      {/* Phần thông tin nghề */}
      <div className="career-info">
        <div className="career-icon">
          <Briefcase size={20} />
        </div>

        <div className="career-details">
          <div className="career-title">
            {career.title}
            {career.level && (
              <span className="career-level">{career.level}</span>
            )}
          </div>

          <div className="career-meta">
            <span>
              💰 {career.salary_range ? `$${career.salary_range}` : "Thỏa thuận"}
            </span>
            <span className="career-match">Match: {career.match_score}%</span>
          </div>

          {career.description && (
            <p className="career-desc">{career.description}</p>
          )}
        </div>
      </div>

      {/* --- BUTTON TẠO LỘ TRÌNH --- */}
      <button
        onClick={() => onGenerate(career)}
        disabled={isGenerating}
        className="btn-generate"
      >
        {isGenerating ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Đang tạo...</span>
          </>
        ) : (
          <>
            <Map size={16} />
            <span>Tạo lộ trình</span>
          </>
        )}
      </button>
    </div>
  );
};

// --- Main Component ---
const QuizResult = ({ result, config, onReset }) => {
  const navigate = useNavigate();

  // Lấy dữ liệu từ props result
  const industries = useMemo(
    () => result ? normalizeIndustries(result?.data || result?.recommended_industries) : [],
    [result]
  );

  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [industryCareers, setIndustryCareers] = useState([]);
  const [careersLoading, setCareersLoading] = useState(false);
  const [generatingPathId, setGeneratingPathId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!result || !config) {
    return <div>Không có dữ liệu kết quả. Vui lòng làm lại bài test.</div>;
  }

  // 1. Xử lý khi user chọn Lĩnh Vực -> Gọi API lấy Careers
  const handleIndustryClick = async (industry) => {
    setSelectedIndustry(industry);
    setIndustryCareers([]);
    setErrorMsg(null);

    if (!industry?.id) return;

    setCareersLoading(true);
    try {
      const res = await getCareersByIndustryId(industry.id);

      if (res && res.success) {
        setIndustryCareers(res.data || []);
      } else {
        setErrorMsg(res?.message || "Không tải được danh sách nghề.");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Lỗi kết nối server.");
    } finally {
      setCareersLoading(false);
    }
  };

  // 2. Xử lý khi bấm nút "Tạo lộ trình" -> Gọi AI generate -> Redirect
  const handleCreateRoadmap = async (career) => {
    setGeneratingPathId(career.id);
    try {
      // --- THAY ĐỔI: Gọi API generateLearningPath ---
      // Endpoint: POST /api/learning/generate/
      const res = await generateLearningPath(career.id);

      if (res && res.success && res.path_id) {
        // Thành công: Chuyển hướng sang trang chi tiết Tree View
        // URL: /learning-path/:path_id
        navigate(`/learning-path/${res.path_id}`);
      } else {
        // Trường hợp lộ trình đã tồn tại, backend cũng trả về path_id
        if (res?.path_id) {
          navigate(`/learning-path/${res.path_id}`);
        } else {
          alert(
            "Có lỗi xảy ra: " + (res?.message || "Không thể tạo lộ trình.")
          );
        }
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi hệ thống, vui lòng thử lại sau.");
    } finally {
      setGeneratingPathId(null);
    }
  };

  return (
    <div className="quiz-wrapper">
      <GlassCard className="quiz-result-card">
        {/* Header */}
        <div className="quiz-result-header">
          <div className="quiz-result-badge">
            🎯 Dựa trên phân tích AI
          </div>
          <h1 className="quiz-result-title">
            Lĩnh vực phù hợp với bạn
          </h1>
          <p className="quiz-result-subtitle">
            Chọn một lĩnh vực bên dưới để xem các vị trí công việc chi tiết
          </p>
        </div>

        {/* --- STEP 1: CHỌN INDUSTRY --- */}
        <div style={{ marginBottom: "40px" }}>
          <h4 className="quiz-step-title">
            <Target size={18} /> BƯỚC 1: Chọn lĩnh vực
          </h4>

          <div className="industry-list">
            {industries.length > 0 ? (
              industries.map((industry) => {
                const isSelected = selectedIndustry?.id === industry.id;
                return (
                  <button
                    key={industry.id}
                    onClick={() => handleIndustryClick(industry)}
                    className={`industry-btn ${isSelected ? "selected" : ""}`}
                  >
                    {industry.name}
                    {isSelected && <CheckCircle size={14} />}
                  </button>
                );
              })
            ) : (
              <p style={{ color: "gray" }}>Đang phân tích dữ liệu...</p>
            )}
          </div>
        </div>

        {/* --- STEP 2: DANH SÁCH CAREER & NÚT TẠO --- */}
        {selectedIndustry && (
          <div className="fade-in-up">
            <h4 className="quiz-step-title">
              <ChevronRight size={18} /> BƯỚC 2: Chọn nghề nghiệp để bắt đầu
            </h4>

            <div style={{ minHeight: "150px" }}>
              {careersLoading ? (
                <div style={{ textAlign: "center", padding: "30px", color: "rgba(255,255,255,0.5)" }}>
                  <Loader2 className="animate-spin" size={30} style={{ marginBottom: "10px", display: "inline-block" }} />
                  <p>AI đang tìm kiếm công việc phù hợp trong ngành {selectedIndustry.name}...</p>
                </div>
              ) : errorMsg ? (
                <div style={{ padding: "20px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px", color: "#fca5a5" }}>
                  {errorMsg}
                </div>
              ) : industryCareers.length > 0 ? (
                <div>
                  {industryCareers.map((career) => (
                    <CareerItem
                      key={career.id}
                      career={career}
                      onGenerate={handleCreateRoadmap}
                      isGenerating={generatingPathId === career.id}
                    />
                  ))}
                </div>
              ) : (
                <p style={{ color: "rgba(255,255,255,0.5)" }}>Chưa có dữ liệu cho ngành này.</p>
              )}
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="quiz-footer">
          <button onClick={onReset} className="btn-secondary">
            <RotateCcw size={16} /> Làm lại bài test
          </button>
          <button onClick={() => navigate("/chat")} className="btn-primary">
            <Target size={16} /> Nhận tư vấn AI
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default QuizResult;
