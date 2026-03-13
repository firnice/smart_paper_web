import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppFrameLayout from "../components/layout/AppFrameLayout.jsx";
import HomePage from "../pages/HomePage.jsx";
import QuestionBankPage from "../pages/QuestionBankPage.jsx";
import QuestionDetailPage from "../pages/QuestionDetailPage.jsx";
import PracticePage from "../pages/PracticePage.jsx";
import InsightsPage from "../pages/InsightsPage.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";
import PrintPage from "../pages/PrintPage.jsx";
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
          <Route path="/" element={<AppFrameLayout />}>
            <Route index element={<HomePage />} />
            <Route path="bank" element={<QuestionBankPage />} />
            <Route path="question/:id" element={<QuestionDetailPage />} />
            <Route path="practice/:id" element={<PracticePage />} />
            <Route path="insights" element={<InsightsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="print" element={<PrintPage />} />
            <Route path="workspace" element={<WorkspacePage />} />
            <Route path="student/login" element={<StudentLoginPage />} />
            <Route path="parent/login" element={<ParentLoginPage />} />
            <Route path="student/dashboard" element={<StudentDashboardPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="result" element={<ResultPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </PaperProvider>
  );
}
