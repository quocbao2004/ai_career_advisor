import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../assets/css-custom/userprofile.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getUserInfo } from "../api/authApi";

import {Pencil,Save,X,Linkedin,Phone,Cake,GraduationCap,Briefcase,
  Heart,Puzzle,Mail,FileText,Trash2,Plus,Contact,Users,
} from "lucide-react";

// Ảnh đại diện mặc định khi chưa có avatar
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
const API_URL = "https://ai-career-advisor-4006.onrender.com/api/users/profile/";

const UserProfile = () => {
  const navigate = useNavigate();
  // Chế độ chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);
  // Trạng thái đang tải dữ liệu
  const [isLoading, setIsLoading] = useState(true);
  // Trạng thái đang lưu
  const [isSaving, setIsSaving] = useState(false);

  // Dữ liệu hồ sơ người dùng
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    gender: "other",
    dob: "",
    bio: "",
    education_level: "bachelor",
    current_job_title: "",
    linkedin_url: "",
    mbti_result: "",
    holland_result: "",
    interests: [],
    skills: [],
  });

  // Dữ liệu kỹ năng mới đang nhập
  const [newSkill, setNewSkill] = useState({ name: "", level: 1 });
  // Sở thích mới đang nhập
  const [newInterest, setNewInterest] = useState("");

  // Lấy access token từ localStorage
  const getToken = () => localStorage.getItem("access_token");

  // Tải hồ sơ khi component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // Lấy thông tin hồ sơ từ API
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = response.data;

      // Gán dữ liệu vào form, xử lý giá trị null/undefined
      setFormData({
        full_name: data.full_name || "",
        email: data.email || "",
        phone_number: data.phone_number || "",
        gender: (data.gender || "other").toLowerCase(),
        dob: data.dob || "",
        bio: data.bio || "",
        education_level: data.education_level || "bachelor",
        current_job_title: data.current_job_title || "",
        linkedin_url: data.linkedin_url || "",
        mbti_result: data.mbti_result || "",
        holland_result: data.holland_result || "",
        interests: data.interests || [],
        // Chuẩn hóa dữ liệu kỹ năng
        skills: data.skills
          ? data.skills.map((s) => ({
              id: s.id || Math.random(),
              skill_name: s.skill_name || "Unknown",
              proficiency_level: s.proficiency_level || 1,
            }))
          : [],
      });
    } catch (error) {
      console.error("Lỗi tải hồ sơ:", error);
      toast.error("Không thể tải thông tin.");
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý khi thay đổi giá trị input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Thêm kỹ năng mới vào danh sách
  const handleAddSkill = () => {
    if (!newSkill.name.trim()) return;
    // Tạo kỹ năng tạm với id unique
    const tempSkill = {
      id: `temp-${Date.now()}`,
      skill_name: newSkill.name,
      proficiency_level: parseInt(newSkill.level),
    };
    setFormData({ ...formData, skills: [...formData.skills, tempSkill] });
    setNewSkill({ name: "", level: 1 });
  };

  // Xóa kỹ năng khỏi danh sách
  const handleRemoveSkill = (id) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s.id !== id),
    });
  };

  // Thêm sở thích khi nhấn Enter
  const handleAddInterest = (e) => {
    if (e.key === "Enter" && newInterest.trim()) {
      e.preventDefault();
      // Kiểm tra trùng lặp trước khi thêm
      if (!formData.interests.includes(newInterest.trim())) {
        setFormData({
          ...formData,
          interests: [...formData.interests, newInterest.trim()],
        });
      }
      setNewInterest("");
    }
  };

  // Xóa sở thích khỏi danh sách
  const handleRemoveInterest = (tag) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter((t) => t !== tag),
    });
  };

  // Lưu thông tin hồ sơ lên server
  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Chuẩn bị dữ liệu gửi lên API
      const payload = {
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        gender: formData.gender,
        dob: formData.dob || null,
        bio: formData.bio,
        education_level: formData.education_level,
        current_job_title: formData.current_job_title,
        linkedin_url: formData.linkedin_url,
        mbti_result: formData.mbti_result,
        holland_result: formData.holland_result,
        interests: formData.interests,
        // Chuẩn hóa dữ liệu kỹ năng trước khi gửi
        skills: formData.skills.map((s) => ({
          skill_name: s.skill_name,
          proficiency_level: s.proficiency_level,
        })),
      };

      await axios.put(API_URL, payload, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      });

      toast.success("Cập nhật hồ sơ thành công!");
      setIsEditing(false);
      fetchProfile();

      // Kiểm tra xem có đang trong quá trình onboarding không
      const user = getUserInfo();
      if (user) {
        const wasProfileCompleted = localStorage.getItem(`profile_completed_${user.id}`) === 'true';
        
        // Đánh dấu profile đã hoàn thành
        localStorage.setItem(`profile_completed_${user.id}`, 'true');
        
        // Chỉ chuyển sang trang trắc nghiệm nếu user chưa hoàn thành profile trước đó
        if (!wasProfileCompleted) {
          navigate("/trac-nghiem");
        }
      }
    } catch (error) {
      toast.error("Lỗi khi lưu. Kiểm tra lại dữ liệu.");
    } finally {
      setIsSaving(false);
    }
  };

  // Hiển thị loading khi đang tải dữ liệu
  if (isLoading && !formData.full_name) {
    return <div className="loading-screen">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="profile-container">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Loading Overlay khi đang lưu */}
      {isSaving && (
        <div className="saving-overlay">
          <div className="saving-content">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 mb-0 fw-semibold">Đang lưu thay đổi...</p>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="profile-header-card">
        <div className="header-cover"></div>
        <div className="header-content">
          <div className="avatar-section">
            <img
              src={DEFAULT_AVATAR}
              alt="Avatar"
              className="profile-avatar"
            />
          </div>

          <div className="user-intro">
            <h1 className="user-name">{formData.full_name || "Người dùng"}</h1>
            <div className="user-role-wrapper">
              <Briefcase size={16} className="icon-small" />
              <span className="user-role">
                {formData.current_job_title || "Chưa cập nhật chức danh"}
              </span>
            </div>
            <div className="user-meta">
              <Mail size={16} className="icon-small" />
              <span>{formData.email}</span>
            </div>
          </div>

          <div className="header-actions">
            {isEditing ? (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsEditing(false);
                    fetchProfile();
                  }}
                >
                  <X size={16} /> Hủy
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status"></span> Đang lưu...</>
                  ) : (
                    <><Save size={16} /> Lưu thay đổi</>
                  )}
                </button>
              </>
            ) : (
              <button
                className="btn btn-outline"
                onClick={() => setIsEditing(true)}
              >
                <Pencil size={16} /> Chỉnh sửa hồ sơ
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="profile-layout">
        {/* --- LEFT COLUMN --- */}
        <div className="layout-left">
          {/* INFO CARD */}
          <div className="info-card">
            <div className="card-header">
              <h3>
                <Contact className="icon-header" size={20} /> Thông tin cá nhân
              </h3>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input
                    className="input-field"
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <Phone size={14} className="icon-label" /> Số điện thoại
                  </label>
                  <input
                    className="input-field"
                    type="text"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <Cake size={14} className="icon-label" /> Ngày sinh
                  </label>
                  <input
                    className="input-field"
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <Users size={14} className="icon-label" /> Giới tính
                  </label>
                  <select
                    className="input-field"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={!isEditing}
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>
                    <GraduationCap size={14} className="icon-label" /> Trình độ
                    học vấn
                  </label>
                  <select
                    className="input-field"
                    name="education_level"
                    value={formData.education_level}
                    onChange={handleChange}
                    disabled={!isEditing}
                  >
                    <option value="high_school">Trung học phổ thông</option>
                    <option value="vocational">Trường nghề</option>
                    <option value="bachelor">Cử nhân (Đại học)</option>
                    <option value="master">Thạc sĩ</option>
                    <option value="phd">Tiến sĩ</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>
                    <FileText size={14} className="icon-label" /> Giới thiệu
                    (Bio)
                  </label>
                  <textarea
                    className="input-field bio-area"
                    rows="4"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Mô tả ngắn về kinh nghiệm..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* SKILLS CARD */}
          <div className="info-card">
            <div className="card-header">
              <h3>
                <Puzzle className="icon-header" size={20} /> Kỹ năng chuyên môn
              </h3>
            </div>
            <div className="card-body">
              <div className="skills-container">
                {formData.skills.map((skill) => (
                  <div key={skill.id} className="skill-row">
                    <div className="skill-info">
                      <span className="skill-name">{skill.skill_name}</span>
                      <span className="skill-level-text">
                        Lv.{skill.proficiency_level}
                      </span>
                    </div>
                    <div className="skill-bar-wrapper">
                      <div className="skill-bar-bg">
                        <div
                          className="skill-bar-fill"
                          style={{ width: `${skill.proficiency_level * 20}%` }}
                        ></div>
                      </div>
                      {isEditing && (
                        <button
                          className="btn-icon-delete"
                          onClick={() => handleRemoveSkill(skill.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {formData.skills.length === 0 && (
                  <p className="empty-text">Chưa có kỹ năng nào.</p>
                )}
              </div>

              {isEditing && (
                <div className="add-skill-box">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Tên kỹ năng (VD: ReactJS)"
                    value={newSkill.name}
                    onChange={(e) =>
                      setNewSkill({ ...newSkill, name: e.target.value })
                    }
                  />
                  <select
                    className="input-field"
                    value={newSkill.level}
                    onChange={(e) =>
                      setNewSkill({ ...newSkill, level: e.target.value })
                    }
                  >
                    <option value="1">1 - Cơ bản</option>
                    <option value="2">2 - Sơ cấp</option>
                    <option value="3">3 - Trung cấp</option>
                    <option value="4">4 - Cao cấp</option>
                    <option value="5">5 - Chuyên gia</option>
                  </select>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={handleAddSkill}
                  >
                    <Plus size={16} /> Thêm
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="layout-right">
          {/* SOCIAL CARD */}
          <div className="info-card">
            <div className="card-header">
              <h3>
                <Briefcase className="icon-header" size={20} /> Công việc & Liên
                kết
              </h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>Chức danh hiện tại</label>
                <input
                  className="input-field"
                  type="text"
                  name="current_job_title"
                  value={formData.current_job_title}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label>
                  <Linkedin size={14} className="icon-label" /> LinkedIn URL
                </label>
                <input
                  className="input-field"
                  type="url"
                  name="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          {/* INTERESTS CARD */}
          <div className="info-card">
            <div className="card-header">
              <h3>
                <Heart className="icon-header" size={20} /> Sở thích
              </h3>
            </div>
            <div className="card-body">
              <p className="hint-text">Giúp AI gợi ý chính xác hơn.</p>
              <div className="tags-wrapper">
                {formData.interests.map((tag, idx) => (
                  <span key={idx} className="tag-pill">
                    {tag}
                    {isEditing && (
                      <span
                        className="tag-remove"
                        onClick={() => handleRemoveInterest(tag)}
                      >
                        <X size={12} />
                      </span>
                    )}
                  </span>
                ))}
              </div>
              {isEditing && (
                <input
                  className="input-field mt-2"
                  type="text"
                  placeholder="Nhập sở thích + Enter"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyDown={handleAddInterest}
                />
              )}
            </div>
          </div>

          {/* TEST RESULTS */}
          <div className="info-card">
            <div className="card-header">
              <h3>Kết quả trắc nghiệm</h3>
            </div>
            <div className="card-body">
              <div className="test-item mb-3">
                <div className="test-label">MBTI (Tính cách)</div>
                {isEditing ? (
                  <input
                    className="input-field"
                    type="text"
                    name="mbti_result"
                    value={formData.mbti_result}
                    onChange={handleChange}
                  />
                ) : (
                  <div className="test-badge mbti">
                    {formData.mbti_result || "Chưa có"}
                  </div>
                )}
              </div>
              <div className="test-item">
                <div className="test-label">Holland (Nghề nghiệp)</div>
                {isEditing ? (
                  <input
                    className="input-field"
                    type="text"
                    name="holland_result"
                    value={formData.holland_result}
                    onChange={handleChange}
                  />
                ) : (
                  <div className="test-badge holland">
                    {formData.holland_result || "Chưa có"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;