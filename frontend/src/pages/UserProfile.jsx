import React, { useState, useEffect } from "react";
import axios from "axios";
// --- 1. IMPORT TOASTIFY ---
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "../assets/css-custom/userprofile.css";

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // State dữ liệu
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    avatar_url: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    phone_number: "",
    gender: "other",
    dob: "",
    bio: "",
    education_level: "bachelor",
    current_job_title: "",
    linkedin_url: "",
    skills: [],
    interests: [],
    tests: [],
  });

  const [newSkill, setNewSkill] = useState({ name: "", level: 1 });
  const [newInterest, setNewInterest] = useState("");

  const API_URL = "http://127.0.0.1:8000/api/users/profile/";
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      setFormData({
        full_name: data.full_name || "",
        email: data.email || "",
        avatar_url:
          data.avatar_url ||
          "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        phone_number: data.phone_number || "",
        gender: data.gender || "other",
        dob: data.dob || "",
        bio: data.bio || "",
        education_level: data.education_level || "bachelor",
        current_job_title: data.current_job_title || "",
        linkedin_url: data.linkedin_url || "",
        skills: data.skills.map((s) => ({
          id: s.id,
          skill_name: s.skill_details?.skill_name || s.skill_name || "Unknown",
          proficiency_level: s.proficiency_level,
        })),
        interests: data.interests.map((i) => i.keyword || i),
        tests:
          data.personality_tests?.map((t) => ({
            type: t.test_type,
            code: t.summary_code,
            date: new Date(t.taken_at).toLocaleDateString(),
          })) || [],
      });
    } catch (error) {
      console.error("Lỗi tải hồ sơ:", error);
      // --- THAY ALERT BẰNG TOAST ERROR ---
      toast.error(
        "Không thể tải thông tin người dùng. Vui lòng đăng nhập lại."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddSkill = () => {
    if (!newSkill.name.trim()) return;
    const tempSkill = {
      id: `temp-${Date.now()}`,
      skill_name: newSkill.name,
      proficiency_level: parseInt(newSkill.level),
    };
    setFormData({ ...formData, skills: [...formData.skills, tempSkill] });
    setNewSkill({ name: "", level: 1 });
  };

  const handleRemoveSkill = (id) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s.id !== id),
    });
  };

  const handleAddInterest = (e) => {
    if (e.key === "Enter" && newInterest.trim()) {
      e.preventDefault();
      setFormData({
        ...formData,
        interests: [...formData.interests, newInterest.trim()],
      });
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (tag) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter((t) => t !== tag),
    });
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const payload = {
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        gender: formData.gender,
        dob: formData.dob,
        bio: formData.bio,
        education_level: formData.education_level,
        current_job_title: formData.current_job_title,
        linkedin_url: formData.linkedin_url,
        skills: formData.skills.map((s) => ({
          skill_name: s.skill_name,
          proficiency_level: s.proficiency_level,
        })),
        interests: formData.interests,
      };

      await axios.put(API_URL, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // --- THAY ALERT BẰNG TOAST SUCCESS ---
      toast.success("Cập nhật hồ sơ thành công!");

      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error("Lỗi lưu hồ sơ:", error);
      // --- THAY ALERT BẰNG TOAST ERROR ---
      toast.error("Có lỗi xảy ra khi lưu thông tin.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !formData.full_name) {
    return (
      <div style={{ textAlign: "center", marginTop: 50 }}>
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* --- 2. THÊM CONTAINER ĐỂ HIỂN THỊ TOAST --- */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="profile-header">
        <div className="avatar-wrapper">
          <img src={formData.avatar_url} alt="Avatar" />
        </div>
        <div className="header-info">
          <h1>{formData.full_name || "Người dùng"}</h1>
          <div style={{ marginTop: 5 }}>
            <span className="header-role">
              {formData.current_job_title || "Chưa cập nhật chức danh"}
            </span>
          </div>
        </div>
        <div className="header-actions">
          {isEditing ? (
            <>
              <button
                className="btn-secondary"
                onClick={() => {
                  setIsEditing(false);
                  fetchProfile();
                }}
                style={{ marginRight: 10 }}
                disabled={isLoading}
              >
                Hủy
              </button>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </>
          ) : (
            <button
              className="btn-secondary"
              onClick={() => setIsEditing(true)}
            >
              Chỉnh sửa
            </button>
          )}
        </div>
      </div>

      <div className="profile-grid">
        {/* CỘT TRÁI */}
        <div className="grid-left">
          <div className="profile-card">
            <div className="card-title">Thông tin cá nhân</div>
            <div className="form-row">
              <div className="form-group">
                <label>Họ và tên</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-100"
                  style={{ backgroundColor: "#f3f4f6", cursor: "not-allowed" }}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="text"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label>Ngày sinh</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Giới tính</label>
                <select
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
              <div className="form-group">
                <label>Trình độ học vấn</label>
                <select
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
            </div>
            <div className="form-group">
              <label>Giới thiệu bản thân (Bio)</label>
              <textarea
                rows="3"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                disabled={!isEditing}
              ></textarea>
            </div>
          </div>

          <div className="profile-card">
            <div className="card-title">Kỹ năng chuyên môn</div>
            <div className="skills-list">
              {formData.skills.map((skill) => (
                <div key={skill.id} className="skill-item">
                  <span style={{ fontWeight: 500 }}>{skill.skill_name}</span>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div className="skill-level-bar">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`level-dot ${
                            lvl <= skill.proficiency_level ? "active" : ""
                          }`}
                        ></div>
                      ))}
                    </div>
                    {isEditing && (
                      <button
                        style={{
                          color: "red",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          fontSize: "1.2rem",
                        }}
                        onClick={() => handleRemoveSkill(skill.id)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {formData.skills.length === 0 && (
                <p style={{ color: "#888", fontStyle: "italic" }}>
                  Chưa có kỹ năng.
                </p>
              )}
            </div>

            {isEditing && (
              <div
                style={{
                  marginTop: 15,
                  display: "flex",
                  gap: 10,
                  alignItems: "end",
                }}
              >
                <div style={{ flex: 2 }}>
                  <label>Tên kỹ năng</label>
                  <input
                    type="text"
                    placeholder="VD: Python"
                    value={newSkill.name}
                    onChange={(e) =>
                      setNewSkill({ ...newSkill, name: e.target.value })
                    }
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Level (1-5)</label>
                  <select
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
                </div>
                <button
                  className="btn-primary"
                  style={{ height: 42 }}
                  onClick={handleAddSkill}
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div className="grid-right">
          <div className="profile-card">
            <div className="card-title">Mạng xã hội</div>
            <div className="form-group">
              <label>Chức danh hiện tại</label>
              <input
                type="text"
                name="current_job_title"
                value={formData.current_job_title}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
            <div className="form-group">
              <label>LinkedIn URL</label>
              <input
                type="url"
                name="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="profile-card">
            <div className="card-title">Sở thích</div>
            <div className="tags-container">
              {formData.interests.map((tag, idx) => (
                <div key={idx} className="tag-chip">
                  {tag}
                  {isEditing && (
                    <span
                      className="remove-tag"
                      onClick={() => handleRemoveInterest(tag)}
                    >
                      ×
                    </span>
                  )}
                </div>
              ))}
            </div>
            {isEditing && (
              <input
                style={{ marginTop: 10 }}
                type="text"
                placeholder="Nhập sở thích + Enter"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={handleAddInterest}
              />
            )}
          </div>

          <div className="profile-card">
            <div className="card-title">Kết quả trắc nghiệm</div>
            {formData.tests.length > 0 ? (
              formData.tests.map((test, idx) => (
                <div key={idx} className="test-card">
                  <div style={{ fontSize: "0.9rem", color: "#666" }}>
                    {test.type}
                  </div>
                  <div className="test-code">{test.code}</div>
                  <div
                    style={{ fontSize: "0.8rem", color: "#999", marginTop: 4 }}
                  >
                    Ngày test: {test.date}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: "#888", fontStyle: "italic" }}>
                Chưa có kết quả bài test nào.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
