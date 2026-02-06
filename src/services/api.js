const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

function buildUrl(path, query = {}) {
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.append(key, String(value));
  });
  return url.toString();
}

async function requestJson(path, options = {}, query = {}) {
  const url = buildUrl(path, query);
  const response = await fetch(url, options);
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
