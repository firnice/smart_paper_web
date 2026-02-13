import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../pages/HomePage.jsx";
import UploadPage from "../pages/paper/UploadPage.jsx";
import ResultPage from "../pages/paper/ResultPage.jsx";
import WorkspacePage from "../pages/management/WorkspacePage.jsx";
import StudentLoginPage from "../pages/auth/StudentLoginPage.jsx";
import ParentLoginPage from "../pages/auth/ParentLoginPage.jsx";
import StudentDashboardPage from "../pages/student/StudentDashboardPage.jsx";
import { PaperProvider } from "../context/PaperContext.jsx";

export default function App() {
  return (
    <PaperProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/student/login" element={<StudentLoginPage />} />
          <Route path="/parent/login" element={<ParentLoginPage />} />
          <Route path="/student/dashboard" element={<StudentDashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </PaperProvider>
  );
}
