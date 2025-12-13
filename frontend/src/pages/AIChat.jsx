import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "../assets/css-custom/ai-chat.css";
import Bot from "../assets/img/Gemini_Generated_Image_.png";

const AIChatPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Xin chào! Tôi là AI Career Advisor. Tôi có thể giúp bạn định hướng nghề nghiệp, gợi ý khóa học và sửa CV. Bạn cần tôi giúp gì hôm nay?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // URL API
  const API_URL = "http://127.0.0.1:8000/api/ai/chat/";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userPrompt = inputValue;
    setInputValue("");

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: userPrompt,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        API_URL,
        { prompt: userPrompt },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const aiResponseText = response.data.response;
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponseText,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Lỗi AI:", error);
      let errorMessageText =
        "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.";

      if (error.response?.status === 401) {
        errorMessageText = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
      }

      const errorMessage = {
        id: Date.now() + 1,
        text: errorMessageText,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Hàm render nội dung tin nhắn (để xử lý xuống dòng)
  const renderMessageContent = (text) => {
    return text.split("\n").map((str, index, array) => (
      <React.Fragment key={index}>
        {str}
        {index === array.length - 1 ? null : <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="ai-page-wrapper">
      {/* --- 1. HEADER --- */}
      <div className="chat-page-header">
        <div className="header-left">
          <div className="avatar-circle">
            <span>✨</span>
          </div>
          <div className="header-info">
            <h5>AI Career Advisor</h5>
            <div className="header-status">
              <span className="status-dot"></span>
              Sử dụng mô hình Gemini 2.5 Flash
            </div>
          </div>
        </div>
        {/* Có thể thêm nút Setting hoặc Menu ở đây nếu cần */}
      </div>

      {/* --- 2. BODY CHAT --- */}
      <div className="chat-page-body">
        <div className="chat-container">
          {messages.map((message) => (
            <div key={message.id} className={`message-row ${message.sender}`}>
              {/* Avatar chỉ hiện cho AI */}
              {message.sender === "ai" && (
                <div className="avatar-sm">
                  <img src={Bot} alt="" />
                </div>
              )}

              <div style={{ maxWidth: "75%" }}>
                <div
                  className={`bubble ${
                    message.sender === "user" ? "user-bubble" : "ai-bubble"
                  }`}
                >
                  <div className="bubble-content">
                    {renderMessageContent(message.text)}
                  </div>
                </div>
                <div
                  className={`message-time ${
                    message.sender === "user" ? "text-end" : ""
                  }`}
                >
                  {message.timestamp.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="message-row ai">
              <div className="avatar-sm">
                <img src={Bot} alt="" />
              </div>
              <div className="bubble ai-bubble">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* --- 3. FOOTER INPUT --- */}
      <div className="chat-page-footer">
        <div className="input-wrapper">
          <div className="custom-input-group">
            <input
              type="text"
              className="chat-input"
              placeholder="Nhập câu hỏi của bạn (Ví dụ: Lộ trình học ReactJS)..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              autoFocus
            />
            <button
              className="btn-send"
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              title="Gửi tin nhắn"
            >
              {/* Icon Send Vector */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22 2L11 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 2L15 22L11 13L2 9L22 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <div className="footer-note">
            AI có thể mắc lỗi. Vui lòng kiểm chứng lại các thông tin quan trọng.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
