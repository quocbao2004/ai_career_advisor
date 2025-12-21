import "./App.css";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AdminDashboard from "./pages/AdminDashboard";
// import UserDashboard from "./pages/UserDashboard";
import QuizSelection from "./pages/QuizSelection";
import MBTIQuiz from "./pages/MBTIQuiz";
import HollandQuiz from "./pages/HollandQuiz";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPassWordPage from "./pages/ForgotPasswordPage";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import UserManager from "./pages/UserManagerPage";
import DataImport from "./pages/DataImport";
import CourseManagement from "./pages/CourseManagement";
import MasterSkillManagement from "./pages/MasterSkillManagement";
import CareerManagement from "./pages/CareerManagement";
import IndustryManagement from "./pages/IndustryManagement";
import Chat from "./pages/AIChat";

import "./assets/css-custom/main.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { GoogleOAuthProvider } from "@react-oauth/google";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Import } from "lucide-react";

function App() {
  return (
    <div className="App">
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <MainLayout>
          <Routes>
            {/* Home */}
            <Route path="/" element={<HomePage />} />

            {/* Auth */}
            <Route path="/dang-nhap" element={<LoginPage />} />
            <Route path="/dang-ky" element={<RegisterPage />} />
            <Route path="/quen-mat-khau" element={<ForgotPassWordPage />} />

            {/* Redirect dựa trên role */}
            <Route path="/dashboard" element={<RoleBasedRedirect />} />

            {/* Dashboards - Protected */}
            {/* <Route
                path="/trang-nguoi-dung"
                element={<ProtectedRoute element={<UserDashboard />} />}
              /> */}
            <Route path="/chat" element={<Chat />} />
            <Route
              path="/trang-quan-tri"
              element={
                <ProtectedRoute
                  element={<AdminDashboard />}
                  requiredRole="admin"
                />
              }
            />

            {/* Quiz Routes */}
            <Route path="/trac-nghiem" element={<QuizSelection />} />
            <Route path="/trac-nghiem/mbti" element={<MBTIQuiz />} />
            <Route path="/trac-nghiem/holland" element={<HollandQuiz />} />

            {/* ADMIN */}
            <Route
              path="/admin/xem-danh-sach-nguoi-dung"
              element={<UserManager />}
            />
            <Route
              path="/trang-quan-tri/import-data"
              element={<DataImport />}
            />
            <Route
              path="/trang-quan-tri/careers"
              element={<CareerManagement />}
            />
            <Route
              path="/trang-quan-tri/courses"
              element={<CourseManagement />}
            />
            <Route
              path="/trang-quan-tri/skills"
              element={<MasterSkillManagement />}
            />
            <Route
              path="/trang-quan-tri/industries"
              element={<IndustryManagement />}
            />
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
