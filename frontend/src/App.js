import "./App.css";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import QuizSelection from "./pages/QuizSelection";
import QuizGame from "./pages/QuizGame";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPassWordPage from "./pages/ForgotPasswordPage";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import "./assets/css-custom/main.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { GoogleOAuthProvider } from "@react-oauth/google";

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
            <Route
              path="/trang-nguoi-dung"
              element={<ProtectedRoute element={<UserDashboard />}/>}
            />
            <Route
              path="/trang-quan-tri"
              element={<ProtectedRoute element={<AdminDashboard />} requiredRole="admin" />}
            />

            {/* Quiz Routes */}
            <Route path="/trac-nghiem" element={<QuizSelection />} />
            <Route path="/trac-nghiem/:type" element={<QuizGame />} />
          </Routes>
        </MainLayout>
      </GoogleOAuthProvider>
    </div>
  );
}

export default App;
