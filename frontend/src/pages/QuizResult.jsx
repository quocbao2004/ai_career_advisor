import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/common/GlassCard';
import { Target, RotateCcw, LayoutDashboard } from 'lucide-react';
import { getCareersByIndustryId } from '../api/careerApi';

const normalizeIndustries = (recommended) => {
  const raw = Array.isArray(recommended) ? recommended : [];
  return raw
    .map((item) => {
      if (typeof item === 'string') {
        const name = item.trim();
        return name ? { id: null, name } : null;
      }
      if (item && typeof item === 'object') {
        const id = item.id ?? item.industry_id ?? null;
        const name = String(item.name ?? '').trim();
        if (!name) return null;
        return { id, name };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 4);
};

const QuizResult = ({ result, config, onReset }) => {
  const navigate = useNavigate();
  const resultCode = result?.result_code || '';

  const industries = useMemo(
    () => normalizeIndustries(result?.recommended_industries),
    [result?.recommended_industries]
  );

  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [industryCareers, setIndustryCareers] = useState([]);
  const [careersLoading, setCareersLoading] = useState(false);
  const [careersError, setCareersError] = useState(null);

  const title = useMemo(() => {
    if (config?.resultDisplay === 'grid') {
      return `Nhóm Holland: ${resultCode || '-'}`;
    }
    return `Nhóm MBTI: ${resultCode || '-'}`;
  }, [config?.resultDisplay, resultCode]);

  const accent = config?.resultDisplay === 'grid' ? '#0891b2' : '#6366f1';

  const handleIndustryClick = async (industry) => {
    setSelectedIndustry(industry);
    setIndustryCareers([]);
    setCareersError(null);

    if (!industry?.id) {
      setCareersError('Thiếu id lĩnh vực để tải nghề nghiệp (backend cần trả id).');
      return;
    }

    setCareersLoading(true);
    try {
      const res = await getCareersByIndustryId(industry.id, 30);
      if (res && res.success === false) {
        setCareersError(res.message || 'Không thể tải nghề nghiệp.');
        return;
      }
      setIndustryCareers(Array.isArray(res?.careers) ? res.careers : []);
    } catch (e) {
      setCareersError(e?.message || 'Không thể tải nghề nghiệp.');
    } finally {
      setCareersLoading(false);
    }
  };

  return (
    <div className="quiz-wrapper">
      <GlassCard className="quiz-result-card fade-in-up">
        <div style={{ textAlign: 'center' }}>
          <h1 className="result-title-main">{title}</h1>

          <div className="result-section-box">
            <h4>
              <Target size={18} style={{ marginRight: '8px', display: 'inline' }} /> Lĩnh vực phù hợp
            </h4>

            <div className="tags-container">
              {industries.length > 0 ? (
                industries.map((industry, idx) => (
                  <button
                    key={`${industry.name}_${idx}`}
                    type="button"
                    className="career-tag"
                    style={{ background: `${accent}40`, color: accent }}
                    onClick={() => handleIndustryClick(industry)}
                  >
                    {industry.name}
                  </button>
                ))
              ) : (
                <p className="text-white-50">Không có dữ liệu</p>
              )}
            </div>

            {selectedIndustry ? (
              <div style={{ marginTop: '12px', textAlign: 'left' }}>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                  Nghề nghiệp trong lĩnh vực: {selectedIndustry.name}
                </div>
                {careersLoading ? (
                  <p className="text-white-50">Đang tải nghề nghiệp...</p>
                ) : careersError ? (
                  <p className="text-danger">{careersError}</p>
                ) : industryCareers.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '18px' }}>
                    {industryCareers.map((c) => (
                      <li key={c.id || c.title} style={{ marginBottom: '6px' }}>
                        {c.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white-50">Không có nghề nghiệp trong lĩnh vực này.</p>
                )}
              </div>
            ) : null}
          </div>

          <div className="quiz-actions-row">
            <button className="btn-quiz-primary" onClick={onReset}>
              <RotateCcw size={16} style={{ marginRight: '6px' }} />
              Làm lại
            </button>
            <button className="btn-quiz-outline" onClick={() => navigate('/dashboard')}>
              <LayoutDashboard size={16} style={{ marginRight: '6px' }} />
              Đến Dashboard
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default QuizResult;
