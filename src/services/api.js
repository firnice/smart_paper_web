const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
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
