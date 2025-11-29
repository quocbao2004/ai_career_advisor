import React, { useState, useRef, useEffect } from "react";
import "../assets/css-custom/ai-chat.css";

// Thành phần Chat AI - Cửa sổ trò chuyện với AI ở góc dưới phải
const AIChat = () => {
  // Quản lý trạng thái hiển thị cửa sổ chat
  const [isOpen, setIsOpen] = useState(false);
  // Danh sách các tin nhắn trong cuộc trò chuyện
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Xin chào! Tôi là AI Career Advisor. Có thể giúp bạn tìm hiểu về các khóa học hoặc lộ trình học tập phù hợp với bạn.",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  // Nội dung tin nhắn đang nhập
  const [inputValue, setInputValue] = useState("");
  // Trạng thái đang gửi tin nhắn
  const [isLoading, setIsLoading] = useState(false);
  // Tham chiếu đến phần tử cuộn tin nhắn
  const messagesEndRef = useRef(null);

  // Cuộn đến tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Xử lý gửi tin nhắn
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Thêm tin nhắn người dùng vào danh sách
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Mô phỏng phản hồi từ AI sau 1 giây
    setTimeout(() => {
      const aiMessage = {
        id: messages.length + 2,
        text: "Cảm ơn câu hỏi của bạn! Đây là một ví dụ phản hồi từ AI. Hãy tiếp tục hỏi tôi bất cứ điều gì về học tập và phát triển sự nghiệp.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  // Xử lý nhấn Enter để gửi tin nhắn
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="ai-chat-container">
      {/* Nút bật/tắt chat */}
      <button
        className={`ai-chat-toggle ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Nhắn tin với AI"
      >
        <span className="chat-icon">💬</span>
      </button>

      {/* Cửa sổ chat */}
      {isOpen && (
        <div className="ai-chat-window card-glass">
          {/* Header chat */}
          <div className="ai-chat-header">
            <div className="ai-chat-title">
              <span className="ai-avatar">🤖</span>
              <div>
                <h4>AI Career Advisor</h4>
                <p className="ai-status">Sẵn sàng giúp bạn</p>
              </div>
            </div>
            <button
              className="ai-chat-close"
              onClick={() => setIsOpen(false)}
              title="Đóng"
            >
              ✕
            </button>
          </div>

          {/* Danh sách tin nhắn */}
          <div className="ai-chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`ai-message ${message.sender === "user" ? "user-message" : "ai-message-item"}`}
              >
                <div className="message-content">
                  <p>{message.text}</p>
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
            {/* Hiển thị trạng thái đang gõ */}
            {isLoading && (
              <div className="ai-message ai-message-item">
                <div className="message-content">
                  <p className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </p>
                </div>
              </div>
            )}
            {/* Điểm cuộn đến đây */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input tin nhắn */}
          <div className="ai-chat-input-area">
            <input
              type="text"
              className="ai-chat-input"
              placeholder="Nhập câu hỏi của bạn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              className="ai-chat-send"
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              title="Gửi"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;
