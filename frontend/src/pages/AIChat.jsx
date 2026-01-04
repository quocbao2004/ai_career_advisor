import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";
import {
  Send,
  Plus,
  MessageSquare,
  Edit2,
  Trash2,
  X,
  Check,
  Bot,
  User,
  Sparkles,
} from "lucide-react";
import "../assets/css-custom/ai-chat.css";

const AIChat = () => {
  // --- STATE ---
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navigate = useNavigate();

  // Learning paths rendered inside message bubble
  const [pathSelections, setPathSelections] = useState({});

  // Learning path detail modal (no extra chat message)
  const [isPathModalOpen, setIsPathModalOpen] = useState(false);
  const [modalPath, setModalPath] = useState(null);

  // State quản lý Edit/Delete/Model
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  // Refs
  const messagesEndRef = useRef(null);
  // Dùng ref này để chặn useEffect fetch lại tin nhắn khi vừa tạo session mới
  const isCreatingSession = useRef(false);

  const token = localStorage.getItem("access_token");
  const BASE_URL = "https://ai-career-advisor-4006.onrender.com/api/ai";

  const AVAILABLE_MODELS = [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite" },
  ];

  // --- API & LOGIC ---

  // 1. Load danh sách sessions khi vào trang
  useEffect(() => {
    fetchSessions();
  }, []);

  // 2. Scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 3. Load tin nhắn khi đổi session
  useEffect(() => {
    if (currentSessionId) {
      // Nếu vừa mới tạo session xong (isCreatingSession = true) thì KHÔNG fetch lại
      // để tránh mất tin nhắn vừa chat hoặc reload không cần thiết.
      if (isCreatingSession.current) {
        isCreatingSession.current = false; // Reset cờ
      } else {
        fetchSessionMessages(currentSessionId);
      }
    } else {
      setMessages([]); // Reset về màn hình Welcome
    }

    // Reset advice panel khi đổi phiên chat / new chat
    resetAdviceState();
  }, [currentSessionId]);

  const resetAdviceState = () => {
    setPathSelections({});
    setIsPathModalOpen(false);
    setModalPath(null);
  };

  const handleNewChat = () => {
    // Always reset UI state, even if currentSessionId is already null
    setCurrentSessionId(null);
    setMessages([]);
    resetAdviceState();
  };

  const isAdviceIntent = (text) => {
    if (!text) return false;
    const t = String(text).toLowerCase();
    return (
      t.includes("lộ trình") ||
      t.includes("lo trinh") ||
      t.includes("roadmap") ||
      t.includes("tư vấn") ||
      t.includes("tu van") ||
      t.includes("định hướng") ||
      t.includes("dinh huong") ||
      t.includes("nghề") ||
      t.includes("nghe") ||
      t.includes("career")
    );
  };

  const parseStoredMessage = (m) => {
    const base = {
      id: m.id,
      sender: m.role === "user" ? "user" : "ai",
      text: m.content,
    };

    if (base.sender !== "ai" || typeof m.content !== "string") return base;

    const raw = m.content.trim();
    if (!raw.startsWith("{")) return base;

    try {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === "object" && obj.type && obj.payload) {
        return {
          ...base,
          text: "",
          type: obj.type,
          payload: obj.payload,
        };
      }
    } catch {
      // Not JSON; treat as plain text
    }

    return base;
  };

  const pushLearningPathsMessage = (payload) => {
    const messageId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        text: "",
        sender: "ai",
        type: "learning_paths",
        payload,
      },
    ]);
  };

  const openPathModal = (path) => {
    setModalPath(path || null);
    setIsPathModalOpen(true);
  };

  const closePathModal = () => {
    setIsPathModalOpen(false);
    setModalPath(null);
  };

  useEffect(() => {
    if (!isPathModalOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closePathModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPathModalOpen]);

  const pushLearningPathsErrorMessage = (message, extraPayload = null) => {
    const messageId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        text: "",
        sender: "ai",
        type: "learning_paths_error",
        payload: { message, ...(extraPayload || {}) },
      },
    ]);
  };

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/chat/sessions/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(res.data.data || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSessionMessages = async (sid) => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/chat/sessions/${sid}/messages/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const mapped = (res.data || []).map(parseStoredMessage);
      setMessages(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const prompt = inputValue;
    setInputValue("");

    // UI Optimistic Update (Hiện tin nhắn user ngay)
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: prompt, sender: "user" },
    ]);
    setIsLoading(true);

    const shouldSuggestPaths = isAdviceIntent(prompt);

    try {
      const res = await axios.post(
        `${BASE_URL}/chat/message/`,
        {
          prompt,
          session_id: currentSessionId, // Gửi null nếu là tin đầu
          model: selectedModel,
          intent_learning_paths: shouldSuggestPaths,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = res.data;

      // Hiện tin nhắn AI phản hồi (nếu có). Với intent lộ trình: backend trả response rỗng.
      if (typeof data.response === "string" && data.response.trim()) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, text: data.response, sender: "ai" },
        ]);
      }

      // Extra messages (learning paths) are generated & saved by backend
      if (
        Array.isArray(data.extra_messages) &&
        data.extra_messages.length > 0
      ) {
        data.extra_messages.forEach((extra, idx) => {
          if (
            extra?.type === "learning_paths" &&
            extra?.payload?.learning_paths
          ) {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + 2 + idx,
                text: "",
                sender: "ai",
                type: "learning_paths",
                payload: extra.payload,
              },
            ]);
          } else if (extra?.type === "learning_paths_error") {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + 2 + idx,
                text: "",
                sender: "ai",
                type: "learning_paths_error",
                payload: extra.payload || {
                  message: "Chưa thể tạo lộ trình học.",
                },
              },
            ]);
          }
        });
      }

      // --- FIX LOGIC TẠO SESSION Ở ĐÂY ---
      // Kiểm tra nếu chưa có session ID hiện tại VÀ backend trả về session_id mới
      if (!currentSessionId && data.session_id) {
        // Đánh dấu là đang tạo session để chặn useEffect fetch lại
        isCreatingSession.current = true;

        // Cập nhật ID phiên làm việc
        setCurrentSessionId(data.session_id);

        // Cập nhật Sidebar ngay lập tức
        setSessions((prev) => [
          {
            id: data.session_id,
            title: data.session_title || "New Conversation",
          },
          ...prev,
        ]);
      }
      // ------------------------------------
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "Lỗi kết nối server hoặc AI không phản hồi.",
          sender: "ai",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS: RENAME / DELETE ---
  const handleRename = async (sid) => {
    if (!editTitle.trim()) return setEditingSessionId(null);
    try {
      await axios.patch(
        `${BASE_URL}/chat/sessions/${sid}/`,
        { title: editTitle },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSessions((prev) =>
        prev.map((s) => (s.id === sid ? { ...s, title: editTitle } : s))
      );
      setEditingSessionId(null);
    } catch (e) {
      alert("Lỗi đổi tên");
    }
  };

  const handleDelete = async (e, sid) => {
    e.stopPropagation();
    if (!window.confirm("Xóa cuộc hội thoại này?")) return;
    try {
      await axios.delete(`${BASE_URL}/chat/sessions/${sid}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions((prev) => prev.filter((s) => s.id !== sid));
      if (currentSessionId === sid) setCurrentSessionId(null);
    } catch (e) {
      alert("Lỗi xóa");
    }
  };

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // --- RENDER ---
  return (
    <div className="chat-layout">
      {isPathModalOpen && modalPath ? (
        <div className="lp-modal-overlay" onMouseDown={closePathModal}>
          <div className="lp-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="lp-modal-header">
              <div className="lp-modal-title">
                {modalPath.title || "Lộ trình"}
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={closePathModal}
              >
                <X size={18} />
              </button>
            </div>

            <div className="lp-modal-body">
              {modalPath.target_audience ? (
                <div className="advice-sub" style={{ marginBottom: 8 }}>
                  <strong>Đối tượng:</strong> {modalPath.target_audience}
                </div>
              ) : null}

              {modalPath.detail?.goal ? (
                <div className="advice-sub" style={{ marginBottom: 8 }}>
                  <strong>Mục tiêu:</strong> {modalPath.detail.goal}
                </div>
              ) : null}

              {modalPath.detail?.estimated_duration ? (
                <div className="advice-sub" style={{ marginBottom: 8 }}>
                  <strong>Tổng thời gian:</strong>{" "}
                  {modalPath.detail.estimated_duration}
                </div>
              ) : null}

              {modalPath.detail?.level ? (
                <div className="advice-sub" style={{ marginBottom: 12 }}>
                  <strong>Mức độ:</strong> {modalPath.detail.level}
                </div>
              ) : null}

              {Array.isArray(modalPath.detail?.steps) &&
              modalPath.detail.steps.length > 0 ? (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 10 }}>
                    Các giai đoạn
                  </div>
                  {modalPath.detail.steps.map((step) => (
                    <div
                      key={step.step_order || step.title}
                      style={{ marginBottom: 14 }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>
                        {step.title || "Giai đoạn"}
                      </div>
                      {Array.isArray(step.content) &&
                      step.content.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {step.content
                            .filter((x) => typeof x === "string" && x.trim())
                            .map((line, idx) => (
                              <li
                                key={idx}
                                style={{
                                  color: "var(--text-sub)",
                                  fontSize: 13,
                                }}
                              >
                                {line}
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <div className="advice-sub">
                          Chưa có nội dung chi tiết.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="advice-sub">Chưa có nội dung chi tiết.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* --- SIDEBAR --- */}
      <aside className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <button className="btn-new-chat" onClick={handleNewChat}>
            <Plus size={18} /> <span>New Chat</span>
          </button>
        </div>

        <div className="session-list">
          <div className="list-label">Gần đây</div>
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`session-item ${
                currentSessionId === session.id ? "active" : ""
              }`}
              onClick={() => setCurrentSessionId(session.id)}
            >
              <MessageSquare size={16} className="session-icon" />

              {editingSessionId === session.id ? (
                <div className="edit-input-group">
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleRename(session.id)
                    }
                  />
                  <button
                    className="icon-btn small check"
                    onClick={() => handleRename(session.id)}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    className="icon-btn small cancel"
                    onClick={() => setEditingSessionId(null)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="session-title">
                    {session.title || "New Conversation"}
                  </span>
                  <div className="session-actions">
                    <button
                      className="icon-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSessionId(session.id);
                        setEditTitle(session.title);
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="icon-btn delete"
                      onClick={(e) => handleDelete(e, session.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-mini">
            <div className="avatar-circle small">
              <User size={16} />
            </div>
            <span>User Account</span>
          </div>
        </div>
      </aside>

      {/* --- MAIN CHAT AREA --- */}
      <main className="chat-main">
        {/* HEADER TOOLBAR */}
        <header className="chat-header">
          <div className="model-selector-wrapper">
            <Sparkles size={18} className="sparkle-icon" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="model-select"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* MESSAGES LIST */}
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="bot-logo-large">
                <Bot size={48} />
              </div>
              <h3>Tôi có thể giúp gì cho sự nghiệp của bạn?</h3>
              <p>
                Hãy hỏi về lộ trình học, review CV, hoặc định hướng nghề nghiệp.
              </p>
              <div className="suggestions">
                <button
                  onClick={() => setInputValue("Lộ trình học Python cho AI?")}
                >
                  Lộ trình Python AI
                </button>
                <button
                  onClick={() => setInputValue("Cách viết CV xin thực tập?")}
                >
                  Viết CV Intern
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message-row ${msg.sender}`}>
                <div className="avatar-circle">
                  {msg.sender === "ai" ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className="bubble">
                  {msg.sender === "ai" && msg.type === "learning_paths" ? (
                    (() => {
                      const payload = msg.payload;
                      const paths = payload?.learning_paths || {};
                      return (
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>
                            3 Lộ trình học được gợi ý cho bạn
                          </div>

                          <div
                            className="suggestions"
                            style={{ marginTop: 6, flexWrap: "wrap" }}
                          >
                            {payload?.learning_path_order?.map((pathId) => {
                              const path = paths[pathId];
                              if (!path) return null;
                              const active = pathSelections[msg.id] === pathId;
                              return (
                                <button
                                  key={pathId}
                                  type="button"
                                  onClick={() => {
                                    setPathSelections((prev) => ({
                                      ...prev,
                                      [msg.id]: pathId,
                                    }));
                                    openPathModal(path);
                                  }}
                                  style={{
                                    borderColor: active
                                      ? "var(--primary-color)"
                                      : "var(--border-color)",
                                    color: active
                                      ? "var(--primary-color)"
                                      : "var(--text-main)",
                                  }}
                                  title={path.title}
                                >
                                  {path.short_description || path.title}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  ) : msg.sender === "ai" &&
                    msg.type === "learning_paths_error" ? (
                    <div>
                      <div className="advice-sub">
                        {msg.payload?.message || "Chưa thể tạo lộ trình học."}
                      </div>
                      <div
                        className="suggestions"
                        style={{ marginTop: 10, flexWrap: "wrap" }}
                      >
                        <button
                          type="button"
                          onClick={() => navigate("/dashboard")}
                        >
                          Cập nhật hồ sơ
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate("/trac-nghiem")}
                        >
                          Làm trắc nghiệm
                        </button>
                      </div>
                    </div>
                  ) : msg.sender === "ai" ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="message-row ai">
              <div className="avatar-circle">
                <Bot size={20} />
              </div>
              <div className="bubble loading">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div className="input-area-wrapper">
          <div className="input-container">
            <input
              placeholder="Nhập câu hỏi cho AI..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={isLoading}
            />
            <button
              className={`btn-send ${!inputValue.trim() ? "disabled" : ""}`}
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
            >
              <Send size={18} />
            </button>
          </div>
          <div className="disclaimer">
            AI có thể mắc lỗi. Vui lòng kiểm tra lại thông tin quan trọng.
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIChat;
