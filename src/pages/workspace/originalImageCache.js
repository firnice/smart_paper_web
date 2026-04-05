const originalImageById = new Map();
const originalImageByFingerprint = new Map();

function normalizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function buildFingerprint({ title, content }) {
  const normalizedTitle = normalizeText(title).slice(0, 80);
  const normalizedContent = normalizeText(content).slice(0, 240);
  if (!normalizedTitle && !normalizedContent) return "";
  return `${normalizedTitle}::${normalizedContent}`;
}

function normalizeOriginalImage({ imageData, imageName }) {
  const data = String(imageData || "").trim();
  if (!data) return null;
  return {
    data,
    name: String(imageName || "").trim(),
  };
}

export function rememberOriginalImageForQuestion({ id, title, content, imageData, imageName }) {
  const normalized = normalizeOriginalImage({ imageData, imageName });
  if (!normalized) return null;

  const fingerprint = buildFingerprint({ title, content });
  if (fingerprint) {
    originalImageByFingerprint.set(fingerprint, normalized);
  }

  if (id !== undefined && id !== null && id !== "") {
    originalImageById.set(String(id), normalized);
  }

  return normalized;
}

export function resolveOriginalImageForQuestion({ id, title, content, imageData, imageName }) {
  const explicitOriginal = rememberOriginalImageForQuestion({
    id,
    title,
    content,
    imageData,
    imageName,
  });

  if (explicitOriginal) {
    return explicitOriginal;
  }

  if (id !== undefined && id !== null && id !== "") {
    const byId = originalImageById.get(String(id));
    if (byId) {
      return byId;
    }
  }

  const fingerprint = buildFingerprint({ title, content });
  if (!fingerprint) return null;

  const byFingerprint = originalImageByFingerprint.get(fingerprint);
  if (byFingerprint && id !== undefined && id !== null && id !== "") {
    originalImageById.set(String(id), byFingerprint);
  }
  return byFingerprint || null;
}
