const STUDENT_SESSION_KEY = "smart_paper_student_session";

export function saveStudentSession(payload) {
  localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(payload));
}

export function readStudentSession() {
  const raw = localStorage.getItem(STUDENT_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearStudentSession() {
  localStorage.removeItem(STUDENT_SESSION_KEY);
}
