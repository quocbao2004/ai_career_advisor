/**
 * Cấu hình Quiz - Định nghĩa cài đặt cho trắc nghiệm MBTI và Holland
 * Chứa các loại tính cách, mô tả và ánh xạ nghề nghiệp
 */

export const QUIZ_CONFIG = {
  mbti: {
    title: "Trắc Nghiệm MBTI",
    icon: "🧠",
    description: "Khám phá tính cách thật sự của bạn",
    apiType: "MBTI",
    types: {
      ISTJ: { 
        title: "Logistician", 
        vi: "Nhà Logistics", 
        description: "Có trách nhiệm, tổ chức, đáng tin cậy và trung thực", 
        careers: ["Kỹ sư", "Luật sư", "Kế toán", "Quản lý dự án"], 
        color: "#4f46e5" 
      },
      ISFJ: { 
        title: "Defender", 
        vi: "Người Bảo Vệ", 
        description: "Chu đáo, hỗ trợ và có trách nhiệm", 
        careers: ["Điều dưỡng", "Giáo viên", "Nhân viên xã hội", "Quản lý"], 
        color: "#0891b2" 
      },
      INFJ: { 
        title: "Advocate", 
        vi: "Cổ Động Viên", 
        description: "Có tầm nhìn, tường thuận và thấu hiểu con người", 
        careers: ["Tư vấn", "Tâm lý học", "Nhà lãnh đạo", "Diễn giả"], 
        color: "#7c3aed" 
      },
      INTJ: { 
        title: "Architect", 
        vi: "Kiến Trúc Sư", 
        description: "Chiến lược, độc lập và có tư duy phê phán", 
        careers: ["Kỹ sư phần mềm", "Nhà khoa học", "Nhà kiến trúc", "Nhà phân tích"], 
        color: "#db2777" 
      },
      ISTP: { 
        title: "Virtuoso", 
        vi: "Nghệ Sĩ Tài Năng", 
        description: "Linh hoạt, thực dụng và có kỹ năng giải quyết vấn đề", 
        careers: ["Kỹ sư", "Thợ sửa chữa", "Lập trình viên", "Phi công"], 
        color: "#d4af37" 
      },
      ISFP: { 
        title: "Adventurer", 
        vi: "Nhà Phiêu Lưu", 
        description: "Nhạy cảm, thân thiện và yêu cái mới", 
        careers: ["Thiết kế", "Họa sĩ", "Đầu bếp", "Nước hoa"], 
        color: "#f97316" 
      },
      INFP: { 
        title: "Mediator", 
        vi: "Nhà Hòa Giải", 
        description: "Sáng tạo, lý tưởng và thích giúp đỡ người khác", 
        careers: ["Nhà văn", "Tư vấn", "Nhà thiết kế", "Ngoại giao"], 
        color: "#ec4899" 
      },
      INTP: { 
        title: "Logician", 
        vi: "Nhà Lôgic", 
        description: "Tò mò, độc lập và có tư duy logic mạnh", 
        careers: ["Lập trình viên", "Nhà toán học", "Nhà khoa học", "Dữ liệu"], 
        color: "#06b6d4" 
      },
      ESTP: { 
        title: "Entrepreneur", 
        vi: "Người Kinh Doanh", 
        description: "Năng động, linh hoạt và yêu thích thách thức", 
        careers: ["Bán hàng", "Kinh doanh", "Tiếp thị", "Thương mại"], 
        color: "#eab308" 
      },
      ESFP: { 
        title: "Entertainer", 
        vi: "Người Vui Nhộn", 
        description: "Vui vẻ, thân thiện và yêu sự chú ý", 
        careers: ["Giám đốc sáng tạo", "Biểu diễn", "Kinh doanh", "Tiếp thị"], 
        color: "#f43f5e" 
      },
      ENFP: { 
        title: "Campaigner", 
        vi: "Người Vận Động", 
        description: "Sôi nổi, sáng tạo và yêu giúp đỡ người khác", 
        careers: ["Nhân sự", "Tiếp thị", "Tư vấn", "Giáo dục"], 
        color: "#a78bfa" 
      },
      ENTP: { 
        title: "Debater", 
        vi: "Người Tranh Luận", 
        description: "Thông minh, tò mò và yêu thích các cuộc tranh luận", 
        careers: ["Luật sư", "Kỹ sư", "Nhà khoa học", "Tiến sĩ"], 
        color: "#14b8a6" 
      },
      ESTJ: { 
        title: "Executive", 
        vi: "Nhân Viên Quản Lý", 
        description: "Trách nhiệm, tổ chức và quan tâm đến kết quả", 
        careers: ["Giám đốc", "Quản lý", "Quân đội", "Công vụ"], 
        color: "#059669" 
      },
      ESFJ: { 
        title: "Consul", 
        vi: "Tổng Lãnh Sự", 
        description: "Thân thiện, hỗ trợ và tổ chức", 
        careers: ["Quản lý nhân sự", "Bán hàng", "Tiếp thị", "Hành chính"], 
        color: "#c084fc" 
      },
      ENFJ: { 
        title: "Protagonist", 
        vi: "Nhân Vật Chính", 
        description: "Có khả năng lãnh đạo, tươi sáng và truyền cảm hứng", 
        careers: ["Giáo dục", "Quản lý", "Tư vấn", "Nhân sự"], 
        color: "#f59e0b" 
      },
      ENTJ: { 
        title: "Commander", 
        vi: "Chỉ Huy", 
        description: "Chiến lược, quyết đoán và có tầm nhìn rộng", 
        careers: ["CEO", "Nhà quản lý", "Nhà lãnh đạo", "Doanh nhân"], 
        color: "#ef4444" 
      },
    },
    resultDisplay: "single",
  },
  holland: {
    title: "Trắc Nghiệm Holland",
    icon: "🎯",
    description: "Khám phá sở thích nghề nghiệp của bạn",
    apiType: "HOLLAND",
    types: {
      R: { 
        name: "Realistic (Thực Tế)", 
        emoji: "🔧", 
        description: "Bạn thích làm việc với tay, máy móc, công cụ", 
        careers: ["Kỹ sư", "Thợ sửa chữa", "Xây dựng", "Nông nghiệp"], 
        color: "#ef4444" 
      },
      I: { 
        name: "Investigative (Nghiên Cứu)", 
        emoji: "🔬", 
        description: "Bạn thích phân tích, tìm hiểu sâu vấn đề", 
        careers: ["Nhà khoa học", "Nhà toán học", "Kỹ sư phần mềm", "Dữ liệu"], 
        color: "#06b6d4" 
      },
      A: { 
        name: "Artistic (Nghệ Thuật)", 
        emoji: "🎨", 
        description: "Bạn thích sáng tạo, tự do, diễn đạt cảm xúc", 
        careers: ["Họa sĩ", "Nhạc sĩ", "Nhà thiết kế", "Nhà văn"], 
        color: "#ec4899" 
      },
      S: { 
        name: "Social (Xã Hội)", 
        emoji: "👥", 
        description: "Bạn thích giúp đỡ, làm việc với con người", 
        careers: ["Giáo viên", "Tư vấn", "Điều dưỡng", "Công tác xã hội"], 
        color: "#f59e0b" 
      },
      E: { 
        name: "Enterprising (Kinh Doanh)", 
        emoji: "💼", 
        description: "Bạn thích lãnh đạo, ảnh hưởng, quản lý", 
        careers: ["CEO", "Tiếp thị", "Bán hàng", "Quản lý dự án"], 
        color: "#eab308" 
      },
      C: { 
        name: "Conventional (Quy Ước)", 
        emoji: "📋", 
        description: "Bạn thích tổ chức, quy luật, kỹ năng hành chính", 
        careers: ["Kế toán", "Hành chính", "Thư ký", "Quản lý tài chính"], 
        color: "#8b5cf6" 
      },
    },
    resultDisplay: "grid",
  },
};

/**
 * Lấy cấu hình quiz theo loại
 * @param {string} quizType - 'mbti' hoặc 'holland'
 * @returns {Object|null} - Config object hoặc null nếu không tìm thấy
 */
export const getQuizConfig = (quizType) => {
  return QUIZ_CONFIG[quizType?.toLowerCase()] || null;
};
