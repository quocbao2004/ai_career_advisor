import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/common/GlassCard"; // Giả định component card của bạn
import {
  Target,
  RotateCcw,
  LayoutDashboard,
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
    <div
      className="career-item-card"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px",
        background: "rgba(255, 255, 255, 0.03)",
        borderRadius: "12px",
        marginBottom: "12px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        transition: "background 0.3s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)")
      }
    >
      {/* Phần thông tin nghề */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          flex: 1,
        }}
      >
        <div
          style={{
            background: "rgba(99, 102, 241, 0.2)",
            padding: "8px",
            borderRadius: "8px",
            color: "#818cf8",
          }}
        >
          <Briefcase size={20} />
        </div>

        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: "1rem",
              color: "#fff",
              marginBottom: "4px",
            }}
          >
            {career.title}
            {career.level && (
              <span
                style={{
                  fontSize: "0.8rem",
                  opacity: 0.6,
                  marginLeft: "8px",
                  border: "1px solid #555",
                  padding: "1px 6px",
                  borderRadius: "4px",
                }}
              >
                {career.level}
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.6)",
              display: "flex",
              gap: "15px",
            }}
          >
            <span>
              💰{" "}
              {career.salary_range ? `$${career.salary_range}` : "Thỏa thuận"}
            </span>
            <span style={{ color: "#4ade80" }}>
              Match: {career.match_score}%
            </span>
          </div>

          {career.description && (
            <p
              style={{
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.4)",
                marginTop: "4px",
                maxWidth: "450px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {career.description}
            </p>
          )}
        </div>
      </div>

      {/* --- BUTTON TẠO LỘ TRÌNH --- */}
      <div style={{ marginLeft: "15px" }}>
        <button
          onClick={() => onGenerate(career)}
          disabled={isGenerating}
          style={{
            background: "linear-gradient(90deg, #4f46e5, #6366f1)",
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px",
            color: "white",
            fontSize: "0.9rem",
            fontWeight: "500",
            cursor: isGenerating ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
            opacity: isGenerating ? 0.7 : 1,
            minWidth: "140px",
            justifyContent: "center",
          }}
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
    </div>
  );
};

// --- Main Component ---
const QuizResult = ({ result, config, onReset }) => {
  const navigate = useNavigate();

  // Lấy dữ liệu từ props result
  const industries = useMemo(
    () => normalizeIndustries(result?.data || result?.recommended_industries),
    [result]
  );

  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [industryCareers, setIndustryCareers] = useState([]);
  const [careersLoading, setCareersLoading] = useState(false);
  const [generatingPathId, setGeneratingPathId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

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
    <div
      className="quiz-wrapper"
      style={{ maxWidth: "900px", margin: "0 auto", paddingBottom: "50px" }}
    >
      <GlassCard className="quiz-result-card" style={{ padding: "40px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              display: "inline-block",
              padding: "8px 16px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "20px",
              marginBottom: "15px",
              fontSize: "0.9rem",
              color: "#cbd5e1",
            }}
          >
            🎯 Dựa trên phân tích AI
          </div>
          <h1
            style={{
              fontSize: "2.2rem",
              fontWeight: "bold",
              color: "white",
              marginBottom: "10px",
            }}
          >
            Lĩnh vực phù hợp với bạn
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)" }}>
            Chọn một lĩnh vực bên dưới để xem các vị trí công việc chi tiết
          </p>
        </div>

        {/* --- STEP 1: CHỌN INDUSTRY --- */}
        <div style={{ marginBottom: "40px" }}>
          <h4
            style={{
              color: "#818cf8",
              marginBottom: "15px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Target size={18} /> BƯỚC 1: Chọn lĩnh vực
          </h4>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {industries.length > 0 ? (
              industries.map((industry) => {
                const isSelected = selectedIndustry?.id === industry.id;
                return (
                  <button
                    key={industry.id}
                    onClick={() => handleIndustryClick(industry)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "100px",
                      border: isSelected
                        ? "1px solid #6366f1"
                        : "1px solid rgba(255,255,255,0.2)",
                      background: isSelected
                        ? "rgba(99, 102, 241, 0.2)"
                        : "transparent",
                      color: isSelected ? "#fff" : "rgba(255,255,255,0.7)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontSize: "0.95rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
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
            <h4
              style={{
                color: "#818cf8",
                marginBottom: "15px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ChevronRight size={18} /> BƯỚC 2: Chọn nghề nghiệp để bắt đầu
            </h4>

            <div style={{ minHeight: "200px" }}>
              {careersLoading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  <Loader2
                    className="animate-spin mx-auto"
                    size={30}
                    style={{ marginBottom: "10px" }}
                  />
                  <p>
                    AI đang tìm kiếm công việc phù hợp trong ngành{" "}
                    {selectedIndustry.name}...
                  </p>
                </div>
              ) : errorMsg ? (
                <div
                  style={{
                    padding: "20px",
                    background: "rgba(239, 68, 68, 0.1)",
                    borderRadius: "8px",
                    color: "#fca5a5",
                  }}
                >
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
                <p style={{ color: "rgba(255,255,255,0.5)" }}>
                  Chưa có dữ liệu cho ngành này.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div
          style={{
            marginTop: "40px",
            paddingTop: "20px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "center",
            gap: "15px",
          }}
        >
          <button
            onClick={onReset}
            className="btn-secondary"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "white",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <RotateCcw size={16} /> Làm lại bài test
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-secondary"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "white",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <LayoutDashboard size={16} /> Về Dashboard
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default QuizResult;
