import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import AppFrameLayout from "../components/layout/AppFrameLayout.jsx";
import HomePage from "../pages/HomePage.jsx";
import UploadPage from "../pages/paper/UploadPage.jsx";
import QuestionBankPage from "../pages/QuestionBankPage.jsx";
import QuestionDetailPage from "../pages/QuestionDetailPage.jsx";
import PracticePage from "../pages/PracticePage.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";
import PrintPage from "../pages/PrintPage.jsx";
import StudentLoginPage from "../pages/auth/StudentLoginPage.jsx";
import ParentLoginPage from "../pages/auth/ParentLoginPage.jsx";
import StudentDashboardPage from "../pages/student/StudentDashboardPage.jsx";
import WorkspacePage from "../pages/management/WorkspacePage.jsx";
import { readStudentSession } from "../utils/studentSession.js";

function StudentGate({ children }) {
  const session = readStudentSession();
  if (!session?.student?.id) {
    return <Navigate to="/student/login" replace />;
  }
  return children;
}

function RootRedirect() {
  const session = readStudentSession();
  return <Navigate to={session?.student?.id ? "/home" : "/student/login"} replace />;
}

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/student/login" element={<StudentLoginPage />} />
          <Route path="/parent/login" element={<ParentLoginPage />} />
          <Route
            path="/management"
            element={(
              <StudentGate>
                <WorkspacePage />
              </StudentGate>
            )}
          />

          <Route
            path="/"
            element={(
              <StudentGate>
                <AppFrameLayout />
              </StudentGate>
            )}
          >
            <Route path="student/dashboard" element={<StudentDashboardPage />} />
            <Route path="home" element={<HomePage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="bank" element={<QuestionBankPage />} />
            <Route path="question/:id" element={<QuestionDetailPage />} />
            <Route path="practice/:id" element={<PracticePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="print" element={<PrintPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </>
  );
}
