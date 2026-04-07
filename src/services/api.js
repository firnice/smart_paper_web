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
  return "http://localhost:8100";
}

const API_BASE = resolveApiBase();

export function resolveAssetUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (value.startsWith("data:")) return value;

  const apiBase = trimTrailingSlash(API_BASE);
  const apiOrigin = (() => {
    try {
      return new URL(apiBase).origin;
    } catch {
      return "";
    }
  })();

  if (value.startsWith("/static/")) {
    return `${apiBase}${value}`;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const parsed = new URL(value);
      if (parsed.pathname.startsWith("/static/") && apiOrigin) {
        return `${apiOrigin}${parsed.pathname}${parsed.search || ""}${parsed.hash || ""}`;
      }
    } catch {
      return value;
    }
  }

  return value;
}

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
        throw new Error("无法连接后端服务，请确认后端已启动（默认 http://localhost:8100）");
      }
    } else {
      throw new Error("无法连接后端服务，请确认后端已启动（默认 http://localhost:8100）");
    }
  }

  if (!response.ok) {
    const serviceUnavailableMessage = "服务暂时不可用，请稍后重试";
    const raw = await response.text();
    if (!raw) {
      if (response.status >= 500) {
        throw new Error(serviceUnavailableMessage);
      }
      throw new Error(`Request failed: ${response.status}`);
    }
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      if (response.status >= 500) {
        throw new Error(serviceUnavailableMessage);
      }
      throw new Error(raw || `Request failed: ${response.status}`);
    }

    const detail = parsed?.detail;
    if (typeof detail === "string" && detail.trim()) {
      if (response.status >= 500) {
        throw new Error(serviceUnavailableMessage);
      }
      throw new Error(detail);
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const message = detail.map((item) => item?.msg).filter(Boolean).join("; ");
      throw new Error(message || raw);
    }
    if (response.status >= 500) {
      throw new Error(serviceUnavailableMessage);
    }
    throw new Error(raw || `Request failed: ${response.status}`);
  }
  return response.json();
}

export async function checkHealth() {
  return requestJson("/api/health");
}

export async function listSchoolTerms(params = {}) {
  return requestJson("/api/school-terms", {}, params);
}

export async function setStudentCurrentTerm(userId, termId) {
  return requestJson(`/api/users/${userId}/term`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ term_id: termId }),
  });
}

export async function extractQuestions(file, options = {}) {
  const formData = new FormData();
  formData.append("file", file);
  if (options.prompt) {
    formData.append("prompt", String(options.prompt));
  }
  return requestJson("/api/ocr/extract", {
    method: "POST",
    body: formData,
  });
}

export async function generateDiagramCrop(payload) {
  return requestJson("/api/ocr/diagram/crop", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function generateDiagramSvg(payload) {
  return requestJson("/api/ocr/diagram/svg", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function analyzeQuestion(payload) {
  return requestJson("/api/ocr/analyze-question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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

export async function createPrintPackExport(payload) {
  return requestJson("/api/print-pack/export", {
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

export async function updateUser(userId, payload) {
  return requestJson(`/api/users/${userId}`, {
    method: "PUT",
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

export async function getWrongQuestion(wrongQuestionId) {
  return requestJson(`/api/wrong-questions/${wrongQuestionId}`);
}

export async function updateWrongQuestion(wrongQuestionId, payload) {
  return requestJson(`/api/wrong-questions/${wrongQuestionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteWrongQuestion(wrongQuestionId) {
  const url = buildUrl(`/api/wrong-questions/${wrongQuestionId}`);
  const response = await fetch(url, { method: "DELETE" });
  if (!response.ok) {
    const raw = await response.text();
    throw new Error(raw || `Request failed: ${response.status}`);
  }
}

export async function createStudyRecord(wrongQuestionId, payload) {
  return requestJson(`/api/wrong-questions/${wrongQuestionId}/study-records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function listStudyRecords(wrongQuestionId, params = {}) {
  return requestJson(`/api/wrong-questions/${wrongQuestionId}/study-records`, {}, params);
}

export async function getStatisticsOverview(studentId, params = {}) {
  return requestJson("/api/statistics/overview", {}, {
    student_id: studentId,
    ...params,
  });
}

export async function getStudentLoginConfig() {
  return requestJson("/api/auth/student-login-config");
}

export async function studentLogin(payload) {
  return requestJson("/api/auth/student-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ---- 举一反三 ----
export async function generateVariantsForQuestion(wrongQuestionId, options = {}) {
  const normalized = typeof options === "number" ? { count: options } : (options || {});
  const payload = {
    wrong_question_id: wrongQuestionId,
    count: normalized.count ?? 3,
  };

  if (normalized.prompt !== undefined) {
    payload.prompt = normalized.prompt;
  }

  if (normalized.include_images !== undefined) {
    payload.include_images = normalized.include_images;
  }

  return requestJson("/api/variants/generate-for-question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ---- 趋势分析 ----
export async function createTrendAnalysis(payload) {
  return requestJson("/api/analysis/trend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getTrendAnalysis(id) {
  return requestJson(`/api/analysis/trend/${id}`);
}

export async function getLatestTrendAnalysis(studentId) {
  return requestJson(`/api/analysis/trend/latest?student_id=${studentId}`);
}

export async function listTrendAnalyses(studentId) {
  return requestJson(`/api/analysis/trend?student_id=${studentId}`);
}

// ---- Admin: Agent 配置管理 ----

export async function listAgents() {
  return requestJson("/api/admin/agents");
}

export async function getAgent(nodeName) {
  return requestJson(`/api/admin/agents/${nodeName}`);
}

export async function updateAgent(nodeName, payload) {
  return requestJson(`/api/admin/agents/${nodeName}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function testAgent(nodeName, payload = {}) {
  return requestJson(`/api/admin/agents/${nodeName}/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
