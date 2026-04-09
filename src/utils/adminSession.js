const ADMIN_SESSION_KEY = "smart_paper_admin_session";

export function saveAdminSession(payload) {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(payload));
}

export function readAdminSession() {
  const raw = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}
