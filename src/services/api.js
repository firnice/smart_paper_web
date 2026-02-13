function trimTrailingSlash(url) {
  return String(url).replace(/\/+$/, "");
}

function resolveApiBase() {
  const configured = import.meta.env.VITE_API_BASE;
  if (configured && String(configured).trim()) {
    return trimTrailingSlash(configured);
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return trimTrailingSlash(window.location.origin);
  }
  return "http://localhost:8000";
}

const API_BASE = resolveApiBase();

function buildUrl(path, query = {}, base = API_BASE) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.append(key, String(value));
  });
  return url.toString();
}

async function requestJson(path, options = {}, query = {}) {
  const url = buildUrl(path, query);
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    const fallbackBase =
      typeof window !== "undefined" && window.location?.origin
        ? trimTrailingSlash(window.location.origin)
        : null;
    if (fallbackBase && fallbackBase !== API_BASE) {
      try {
        response = await fetch(buildUrl(path, query, fallbackBase), options);
      } catch {
        throw new Error("无法连接后端服务，请确认后端已启动（默认 http://localhost:8000）");
      }
    } else {
      throw new Error("无法连接后端服务，请确认后端已启动（默认 http://localhost:8000）");
    }
  }

  if (!response.ok) {
    const raw = await response.text();
    if (!raw) {
      throw new Error(`Request failed: ${response.status}`);
    }
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(raw || `Request failed: ${response.status}`);
    }

    const detail = parsed?.detail;
    if (typeof detail === "string" && detail.trim()) {
      throw new Error(detail);
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const message = detail.map((item) => item?.msg).filter(Boolean).join("; ");
      throw new Error(message || raw);
    }
    throw new Error(raw || `Request failed: ${response.status}`);
  }
  return response.json();
}

export async function checkHealth() {
  return requestJson("/api/health");
}

export async function extractQuestions(file) {
  const formData = new FormData();
  formData.append("file", file);
  return requestJson("/api/ocr/extract", {
    method: "POST",
    body: formData,
  });
}

export async function generateVariants(payload) {
  return requestJson("/api/variants/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function createExport(payload) {
  return requestJson("/api/export", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function listUsers(params = {}) {
  return requestJson("/api/users", {}, params);
}

export async function createUser(payload) {
  return requestJson("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function createParentStudentLink(payload) {
  return requestJson("/api/users/parent-student-links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function listParentStudents(parentId) {
  return requestJson(`/api/users/${parentId}/students`);
}

export async function listSubjects(params = {}) {
  return requestJson("/api/subjects", {}, params);
}

export async function createSubject(payload) {
  return requestJson("/api/subjects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function listWrongQuestionCategories(params = {}) {
  return requestJson("/api/wrong-question-categories", {}, params);
}

export async function createWrongQuestionCategory(payload) {
  return requestJson("/api/wrong-question-categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function listErrorReasons(params = {}) {
  return requestJson("/api/error-reasons", {}, params);
}

export async function createErrorReason(payload) {
  return requestJson("/api/error-reasons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function listWrongQuestions(params = {}) {
  return requestJson("/api/wrong-questions", {}, params);
}

export async function createWrongQuestion(payload) {
  return requestJson("/api/wrong-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function createStudyRecord(wrongQuestionId, payload) {
  return requestJson(`/api/wrong-questions/${wrongQuestionId}/study-records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getStatisticsOverview(studentId, params = {}) {
  return requestJson("/api/statistics/overview", {}, {
    student_id: studentId,
    ...params,
  });
}

export async function studentLogin(payload) {
  return requestJson("/api/auth/student-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
