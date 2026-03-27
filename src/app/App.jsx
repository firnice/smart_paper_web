import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import AppFrameLayout from "../components/layout/AppFrameLayout.jsx";
import QuestionDetailPage from "../pages/QuestionDetailPage.jsx";
import PracticePage from "../pages/PracticePage.jsx";
import MinePage from "../pages/mine/MinePage.jsx";
import StudentLoginPage from "../pages/auth/StudentLoginPage.jsx";
import ParentLoginPage from "../pages/auth/ParentLoginPage.jsx";
import WorkspacePage from "../pages/workspace/WorkspacePage.jsx";
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
  return <Navigate to={session?.student?.id ? "/workspace" : "/student/login"} replace />;
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
            path="/"
            element={(
              <StudentGate>
                <AppFrameLayout />
              </StudentGate>
            )}
          >
            <Route path="workspace" element={<WorkspacePage />} />
            <Route path="mine" element={<MinePage />} />
            <Route path="question/:id" element={<QuestionDetailPage />} />
            <Route path="practice/:id" element={<PracticePage />} />
          </Route>

          {/* 旧路由重定向 */}
          <Route path="/home" element={<Navigate to="/workspace" replace />} />
          <Route path="/student/dashboard" element={<Navigate to="/workspace" replace />} />
          <Route path="/bank" element={<Navigate to="/workspace" replace />} />
          <Route path="/print" element={<Navigate to="/workspace" replace />} />
          <Route path="/upload" element={<Navigate to="/workspace" replace />} />
          <Route path="/profile" element={<Navigate to="/mine" replace />} />
          <Route path="/management" element={<Navigate to="/workspace" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </>
  );
}
