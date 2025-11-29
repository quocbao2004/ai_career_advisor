# ai_career_advisor

**AI Career Advisor** là một ứng dụng web định hướng nghề nghiệp thông minh, giúp người dùng khám phá ngành nghề phù hợp dựa trên tính cách, kỹ năng và sở thích cá nhân.  
Dự án được phát triển với **Django (Backend)** và **React, CSS, JavaScript, Bootstrap (Frontend). 
Quá trình phát triển dữ án tuân thủ theo Git Flow**

---

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|-------------|------------|
| Frontend | React, CSS, Bootstrap 5 |
| Backend | Django, pandas |
| Authentication | Google, GitHub, JWT, Role-based Access |
| AI Module | Gemini API, gợi ý nghề nghiệp thông minh |
| Cơ sở dữ liệu | PostgreSQL, Vector DB |

---

## Giới thiệu dự án

**AI Career Advisor** được xây dựng nhằm hỗ trợ **học sinh, sinh viên và người tìm việc** trong việc:
- Đánh giá năng lực, sở thích, tính cách cá nhân  
- Gợi ý ngành nghề và lộ trình học tập phù hợp  
- Quản lý hồ sơ nghề nghiệp và theo dõi tiến trình phát triển  

Mục tiêu của dự án là tạo ra một nền tảng hỗ trợ định hướng nghề nghiệp ứng dụng trí tuệ nhân tạo trong thực tế.

---

## Tính năng nổi bật

-  Gợi ý nghề nghiệp dựa trên phân tích AI  
-  Bài kiểm tra đánh giá tính cách, sở thích nghề nghiệp
- Trang tổng quan (Dashboard) dành cho quản trị viên  
- Giao diện hiện đại, tương thích di động (Responsive UI)  
- Đăng nhập và phân quyền người dùng với Django Auth, 
- Tạo lộ trình học tập cho người dùng và theo dõi tiến độ
- Tư vấn các khóa học liên quan để người dùng bám sát học tập
  
---

## ⚙️ Hướng dẫn cài đặt và chạy dự án

### Clone repository
```bash
git clone https://github.com/quocbao2004/ai_career_advisor.git
cd ai_career_advisor
```
### Chạy môi trường backend
```bash
cd backend
pip install -r requirements.txt
python manage.py runserver
```
### Chạy môi trường frontend
```bash
cd frontend
npm install
npm start
```
