import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Plus,
  MessageSquare,
  MoreHorizontal,
  Edit2,
  Trash2,
  X,
  Check,
  Bot,
  User,
  Sparkles,
} from "lucide-react"; // Import icon xịn
import "../assets/css-custom/ai-chat.css";

const AIChat = () => {
  // --- STATE ---
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Responsive mobile

  // State quản lý Edit/Delete/Model
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash");
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  // Refs & Token
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem("access_token");
  const BASE_URL = "http://127.0.0.1:8000/api/ai";

  const AVAILABLE_MODELS = [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Nhanh)" },
    { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite" },
  ];

  // --- API & LOGIC (Giữ nguyên logic cũ, chỉ cập nhật UI) ---
  useEffect(() => {
    fetchSessions();
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  useEffect(() => {
    if (currentSessionId) {
      fetchSessionMessages(currentSessionId);
    } else {
      setMessages([]); // Reset về trống để hiện màn hình Welcome
    }
  }, [currentSessionId]);

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
      const mapped = res.data.map((m) => ({
        id: m.id,
        text: m.content,
        sender: m.role === "user" ? "user" : "ai",
      }));
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
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: prompt, sender: "user" },
    ]);
    setIsLoading(true);

    try {
      const res = await axios.post(
        `${BASE_URL}/chat/message/`,
        {
          prompt,
          session_id: currentSessionId,
          model: selectedModel,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = res.data;
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: data.response, sender: "ai" },
      ]);

      if (!currentSessionId && data.new_session_id) {
        setCurrentSessionId(data.new_session_id);
        setSessions((prev) => [
          { id: data.new_session_id, title: data.new_session_title },
          ...prev,
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: "⚠️ Lỗi kết nối server.", sender: "ai" },
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
      {/* --- SIDEBAR --- */}
      <aside className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <button
            className="btn-new-chat"
            onClick={() => setCurrentSessionId(null)}
          >
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

        {/* User Profile Mini (Optional footer for sidebar) */}
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
                  {msg.sender === "ai" ? (
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
