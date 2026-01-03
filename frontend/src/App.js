import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AdminDashboard from "./pages/AdminDashboard";
import QuizSelection from "./pages/QuizSelection";
import QuizGame from "./pages/QuizGame";
import OnboardingWelcome from "./pages/OnboardingWelcome";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPassWordPage from "./pages/ForgotPasswordPage";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import UserManager from "./pages/UserManagerPage";
import DataImport from "./pages/DataImport";
import CourseManagement from "./pages/CourseManagement";
import MasterSkillManagement from "./pages/MasterSkillManagement";
import CareerManagement from "./pages/CareerManagement";
import IndustryManagement from "./pages/IndustryManagement";
import Chat from "./pages/AIChat";
import UserProfile from "./pages/UserProfile";
import AiConfig from "./pages/AiConfig";
import LearningPathDetail from "./pages/LearningPathDetail";
import "./assets/css-custom/main.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { GoogleOAuthProvider } from "@react-oauth/google";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  isAuthenticated,
  getUserInfo,
  getCachedOnboardingStatus,
  hasSeenOnboardingWelcome,
} from "./api/authApi";
//Hàm tránh trả lỗi 404 khi người dùng tự nhập tay url
// không match với router đang có,
// chuyển hướng user dựa trên điều kiện
const resolveFallbackPath = () => {
  try {
    const isAuth = isAuthenticated();
    if (!isAuth) return "/"; // chưa login
    const user = getUserInfo(); //thiếu thông tin
    if (!user) return "/dang-nhap";
    if (user.role === "admin") return "/trang-quan-tri";
    const cachedCompleted = getCachedOnboardingStatus();
    const userCompleted = user.hasCompletedOnboarding === true;
    const userNeeds = user.needsOnboarding === true;
    const hasCompleted = cachedCompleted || (userCompleted && !userNeeds);
    if (hasCompleted) return "/dashboard"; // hoàn thành flow lần đầu đăng nhập
    return hasSeenOnboardingWelcome(user.id) ? "/trac-nghiem" : "/chao-mung"; // đã thấy trang chào mừng nhưng chưa hoàn thành flow lần đầu đăng nhập
  } catch (err) {
    return "/";
  }
};

function App() {
  return (
    <div className="App">
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <MainLayout>
          <Routes>
            {/* Auth routes - Không cần protection */}
            <Route path="/dang-nhap" element={<LoginPage />} />
            <Route path="/dang-ky" element={<RegisterPage />} />
            <Route path="/quen-mat-khau" element={<ForgotPassWordPage />} />

            {/* Public routes - Có thể truy cập khi chưa login, nhưng nếu đã login thì phải onboarding */}
            <Route
              path="/"
              element={
                <ProtectedRoute element={<HomePage />} isPublicRoute={true} />
              }
            />

            {/* Onboarding routes - Bắt buộc cho user chưa hoàn thành test */}
            <Route
              path="/chao-mung"
              element={
                <ProtectedRoute
                  element={<OnboardingWelcome />}
                  skipOnboardingCheck={true}
                />
              }
            />
            <Route
              path="/trac-nghiem"
              element={
                <ProtectedRoute
                  element={<QuizSelection />}
                  skipOnboardingCheck={true}
                  requireWelcomeSeen={true}
                />
              }
            />
            <Route
              path="/trac-nghiem/mbti"
              element={
                <ProtectedRoute
                  element={<QuizGame />}
                  skipOnboardingCheck={true}
                  requireWelcomeSeen={true}
                />
              }
            />
            <Route
              path="/trac-nghiem/holland"
              element={
                <ProtectedRoute
                  element={<QuizGame />}
                  skipOnboardingCheck={true}
                  requireWelcomeSeen={true}
                />
              }
            />

            <Route
              path="/learning-path/:id"
              element={
                <ProtectedRoute
                  element={<LearningPathDetail />}
                  // Các props khác tùy logic app của bạn (vd: requireWelcomeSeen)
                />
              }
            />

            {/* Protected routes - Chỉ truy cập được sau khi onboarding */}
            <Route
              path="/dashboard"
              element={<ProtectedRoute element={<UserProfile />} />}
            />
            <Route
              path="/chat"
              element={<ProtectedRoute element={<Chat />} />}
            />
            <Route
              path="/trang-quan-tri"
              element={
                <ProtectedRoute
                  element={<AdminDashboard />}
                  requiredRole="admin"
                />
              }
            />

            {/* ADMIN */}
            <Route
              path="/admin/xem-danh-sach-nguoi-dung"
              element={
                <ProtectedRoute
                  element={<UserManager />}
                  requiredRole="admin"
                />
              }
            />
            <Route
              path="/trang-quan-tri/import-data"
              element={
                <ProtectedRoute element={<DataImport />} requiredRole="admin" />
              }
            />
            <Route
              path="/trang-quan-tri/careers"
              element={
                <ProtectedRoute
                  element={<CareerManagement />}
                  requiredRole="admin"
                />
              }
            />
            <Route
              path="/trang-quan-tri/courses"
              element={
                <ProtectedRoute
                  element={<CourseManagement />}
                  requiredRole="admin"
                />
              }
            />
            <Route
              path="/trang-quan-tri/skills"
              element={
                <ProtectedRoute
                  element={<MasterSkillManagement />}
                  requiredRole="admin"
                />
              }
            />
            <Route
              path="/trang-quan-tri/industries"
              element={
                <ProtectedRoute
                  element={<IndustryManagement />}
                  requiredRole="admin"
                />
              }
            />
            <Route path="/trang-quan-tri/ai-config" element={<AiConfig />} />
          </Routes>
        </MainLayout>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </GoogleOAuthProvider>
    </div>
  );
}

export default App;
