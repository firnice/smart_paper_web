import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  addPracticeRecord,
  createStudentWrongQuestion,
  getDefaultSchoolTerm,
  getStudentDashboardData,
  resetStudentDemoData,
  setWrongQuestionStatus,
} from "../../services/studentDemo.js";
import { extractQuestions } from "../../services/api.js";
import { clearStudentSession, readStudentSession } from "../../utils/studentSession.js";

const INITIAL_FORM = {
  title: "",
  content: "",
  subject: "数学",
  term: getDefaultSchoolTerm(),
  category: "计算错误",
  error_reason: "粗心抄错",
  difficulty: "medium",
  image_data: "",
  image_name: "",
};

const STATUS_LABEL = {
  new: "新错题",
  reviewing: "复习中",
  mastered: "已掌握",
};

const DEFAULT_SUBJECT_OPTIONS = ["数学", "语文", "英语", "科学"];

const ENTRY_MODES = [
  { id: "camera", label: "拍照" },
  { id: "photo", label: "照片" },
  { id: "upload", label: "上传" },
  { id: "text", label: "输入" },
];

const TERM_OPTIONS = Array.from(
  new Set([
    `${new Date().getFullYear() - 1}秋学期`,
    getDefaultSchoolTerm(),
    `${new Date().getFullYear()}秋学期`,
    `${new Date().getFullYear() + 1}春学期`,
  ]),
);

function createElementEditorInitial() {
  return {
    open: false,
    sourceImage: "",
    sourceLabel: "",
    sourceType: "form",
    imageWidth: 0,
    imageHeight: 0,
    itemId: null,
    elements: [],
    hiddenIds: [],
    loading: false,
    error: "",
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片解析失败"));
    image.src = dataUrl;
  });
}

function normalizeOcrImageUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:")) {
    return value;
  }
  const base = String(import.meta.env.VITE_API_BASE || "http://localhost:8000").replace(/\/+$/, "");
  return `${base}${value.startsWith("/") ? "" : "/"}${value}`;
}

function normalizeOcrItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .map((item, index) => {
      const questionImageUrl = normalizeOcrImageUrl(item?.question_image_url);
      const diagramImageUrl = normalizeOcrImageUrl(item?.diagram_image_url);
      const legacyImageUrls = Array.isArray(item?.image_urls)
        ? item.image_urls.map((url) => normalizeOcrImageUrl(url)).filter(Boolean)
        : [];

      const resolvedDiagramImageUrl = diagramImageUrl || legacyImageUrls[0] || "";
      const resolvedQuestionImageUrl = questionImageUrl || "";

      return {
        id: Number(item?.id) || index + 1,
        text: String(item?.text || "").trim(),
        hasImage: Boolean(item?.has_image) || Boolean(resolvedDiagramImageUrl),
        questionImageUrl: resolvedQuestionImageUrl,
        diagramImageUrl: resolvedDiagramImageUrl,
      };
    })
    .filter((item) => item.text || item.questionImageUrl || item.diagramImageUrl);
}

function isLikelyHeicFile(file) {
  const type = String(file?.type || "").toLowerCase();
  const name = String(file?.name || "").toLowerCase();
  return type.includes("heic") || type.includes("heif") || name.endsWith(".heic") || name.endsWith(".heif");
}

async function compressImage(file) {
  const rawDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageFromDataUrl(rawDataUrl);

  const maxWidth = 1280;
  const ratio = Math.min(1, maxWidth / image.width);
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return rawDataUrl;

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.78);
}

function boxesOverlapExpanded(a, b, gapX, gapY) {
  return !(
    a.x + a.width + gapX < b.x ||
    b.x + b.width + gapX < a.x ||
    a.y + a.height + gapY < b.y ||
    b.y + b.height + gapY < a.y
  );
}

function mergeNearbyBoxes(rawBoxes, imageWidth, imageHeight) {
  if (!rawBoxes.length) return [];

  const gapX = Math.max(2, Math.round(imageWidth * 0.006));
  const gapY = Math.max(2, Math.round(imageHeight * 0.008));
  let merged = rawBoxes.map((box) => ({ ...box }));
  let changed = true;

  while (changed) {
    changed = false;
    const next = [];
    for (const box of merged) {
      let mergedInto = false;
      for (const target of next) {
        if (boxesOverlapExpanded(target, box, gapX, gapY)) {
          const left = Math.min(target.x, box.x);
          const top = Math.min(target.y, box.y);
          const right = Math.max(target.x + target.width, box.x + box.width);
          const bottom = Math.max(target.y + target.height, box.y + box.height);
          target.x = left;
          target.y = top;
          target.width = right - left;
          target.height = bottom - top;
          target.area = target.width * target.height;
          mergedInto = true;
          changed = true;
          break;
        }
      }
      if (!mergedInto) next.push({ ...box });
    }
    merged = next;
  }

  const minArea = Math.max(50, Math.round(imageWidth * imageHeight * 0.00003));
  const maxArea = Math.round(imageWidth * imageHeight * 0.88);
  return merged
    .filter((box) => box.area >= minArea && box.area <= maxArea)
    .filter((box) => box.width >= 10 && box.height >= 10);
}

function buildTextRowMask(darkRowDensity, imageHeight) {
  const avgDensity = darkRowDensity.reduce((sum, value) => sum + value, 0) / Math.max(1, darkRowDensity.length);
  const threshold = Math.max(0.035, avgDensity * 1.12);
  const segments = [];
  let start = -1;

  for (let y = 0; y < darkRowDensity.length; y += 1) {
    const isDenseRow = darkRowDensity[y] >= threshold && darkRowDensity[y] <= 0.65;
    if (isDenseRow) {
      if (start < 0) start = y;
    } else if (start >= 0) {
      segments.push([start, y - 1]);
      start = -1;
    }
  }
  if (start >= 0) segments.push([start, darkRowDensity.length - 1]);

  const merged = [];
  for (const [segStart, segEnd] of segments) {
    if (!merged.length) {
      merged.push([segStart, segEnd]);
      continue;
    }
    const last = merged[merged.length - 1];
    if (segStart - last[1] <= 3) {
      last[1] = segEnd;
    } else {
      merged.push([segStart, segEnd]);
    }
  }

  const textRowMask = new Uint8Array(imageHeight);
  const minBand = Math.max(4, Math.round(imageHeight * 0.006));
  const maxBand = Math.max(minBand + 1, Math.round(imageHeight * 0.08));
  for (const [segStart, segEnd] of merged) {
    const segHeight = segEnd - segStart + 1;
    if (segHeight < minBand || segHeight > maxBand) continue;
    const pad = Math.max(1, Math.round(segHeight * 0.22));
    const from = Math.max(0, segStart - pad);
    const to = Math.min(imageHeight - 1, segEnd + pad);
    for (let y = from; y <= to; y += 1) {
      textRowMask[y] = 1;
    }
  }
  return textRowMask;
}

async function detectHandwritingElements(imageUrl) {
  const image = await loadImageFromDataUrl(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("浏览器不支持手写识别");

  context.drawImage(image, 0, 0);
  const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
  const total = width * height;
  const candidateMask = new Uint8Array(total);
  const colorMask = new Uint8Array(total);
  const visited = new Uint8Array(total);
  const darkRowCount = new Uint32Array(height);

  for (let i = 0, p = 0; i < total; i += 1, p += 4) {
    const y = Math.floor(i / width);
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const a = data[p + 3];
    if (a <= 0) continue;

    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const maxRgb = Math.max(r, g, b);
    const minRgb = Math.min(r, g, b);
    const sat = maxRgb > 0 ? (maxRgb - minRgb) / maxRgb : 0;
    const isRedMark = r >= 86 && r > g * 1.1 && r > b * 1.1 && sat >= 0.15;
    const isBlueMark = b >= 80 && b > r * 1.08 && b > g * 1.02 && sat >= 0.14;
    const isColorMark = isRedMark || isBlueMark;
    const isDark = gray < 142;

    if (isDark) {
      darkRowCount[y] += 1;
    }
    if (isColorMark) {
      colorMask[i] = 1;
    }
    candidateMask[i] = isColorMark || isDark ? 1 : 0;
  }

  const darkRowDensity = Array.from(darkRowCount, (count) => count / Math.max(1, width));
  const textRowMask = buildTextRowMask(darkRowDensity, height);

  const rawBoxes = [];
  const minPixelArea = Math.max(20, Math.round(total * 0.00004));
  const maxPixelArea = Math.round(total * 0.12);

  for (let idx = 0; idx < total; idx += 1) {
    if (!candidateMask[idx] || visited[idx]) continue;

    const stack = [idx];
    visited[idx] = 1;
    let area = 0;
    let colorArea = 0;
    let textOverlap = 0;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    while (stack.length) {
      const current = stack.pop();
      const y = Math.floor(current / width);
      const x = current % width;
      area += 1;
      if (colorMask[current]) colorArea += 1;
      if (textRowMask[y]) textOverlap += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      const left = x > 0 ? current - 1 : -1;
      const right = x + 1 < width ? current + 1 : -1;
      const up = y > 0 ? current - width : -1;
      const down = y + 1 < height ? current + width : -1;
      if (left >= 0 && candidateMask[left] && !visited[left]) {
        visited[left] = 1;
        stack.push(left);
      }
      if (right >= 0 && candidateMask[right] && !visited[right]) {
        visited[right] = 1;
        stack.push(right);
      }
      if (up >= 0 && candidateMask[up] && !visited[up]) {
        visited[up] = 1;
        stack.push(up);
      }
      if (down >= 0 && candidateMask[down] && !visited[down]) {
        visited[down] = 1;
        stack.push(down);
      }
    }

    if (area < minPixelArea || area > maxPixelArea) continue;
    const boxWidth = maxX - minX + 1;
    const boxHeight = maxY - minY + 1;
    if (boxWidth < 5 || boxHeight < 5) continue;

    const density = area / Math.max(1, boxWidth * boxHeight);
    const aspect = boxWidth / Math.max(1, boxHeight);
    const colorRatio = colorArea / Math.max(1, area);
    const textOverlapRatio = textOverlap / Math.max(1, area);
    const centerY = (minY + maxY) / 2;

    const isColorHandwriting = colorRatio >= 0.08;
    const isStrokeLike = (aspect >= 4.6 || aspect <= 0.23) && density < 0.5;
    const isLoopLike = boxWidth >= width * 0.12 && boxHeight >= height * 0.035 && density < 0.24;
    const isBottomScribble = centerY >= height * 0.58 && area >= total * 0.0001;
    const likelyPrintedText = textOverlapRatio >= 0.9 && colorRatio < 0.03 && density > 0.38 && !isStrokeLike;

    const isHandwritingCandidate = (
      isColorHandwriting
      || (isStrokeLike && textOverlapRatio < 0.94)
      || (isLoopLike && textOverlapRatio < 0.9)
      || (isBottomScribble && textOverlapRatio < 0.96)
    );
    if (!isHandwritingCandidate || likelyPrintedText) continue;

    rawBoxes.push({
      x: minX,
      y: minY,
      width: boxWidth,
      height: boxHeight,
      area: boxWidth * boxHeight,
    });
  }

  const merged = mergeNearbyBoxes(rawBoxes, width, height)
    .sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y))
    .slice(0, 120)
    .map((box, index) => ({ id: index + 1, ...box }));

  return {
    imageWidth: width,
    imageHeight: height,
    elements: merged,
  };
}

async function detectScanElements(imageUrl) {
  const image = await loadImageFromDataUrl(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("浏览器不支持元素扫描");

  context.drawImage(image, 0, 0);
  const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
  const total = width * height;
  const mask = new Uint8Array(total);
  const visited = new Uint8Array(total);

  for (let i = 0, p = 0; i < total; i += 1, p += 4) {
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const a = data[p + 3];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const isRedMark = r >= 92 && r > g * 1.12 && r > b * 1.12;
    mask[i] = a > 0 && (gray < 182 || isRedMark) ? 1 : 0;
  }

  const rawBoxes = [];
  const minPixelArea = Math.max(20, Math.round(total * 0.00009));

  for (let idx = 0; idx < total; idx += 1) {
    if (!mask[idx] || visited[idx]) continue;
    const stack = [idx];
    visited[idx] = 1;
    let area = 0;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    while (stack.length) {
      const current = stack.pop();
      const y = Math.floor(current / width);
      const x = current % width;
      area += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      const left = x > 0 ? current - 1 : -1;
      const right = x + 1 < width ? current + 1 : -1;
      const up = y > 0 ? current - width : -1;
      const down = y + 1 < height ? current + width : -1;

      if (left >= 0 && mask[left] && !visited[left]) {
        visited[left] = 1;
        stack.push(left);
      }
      if (right >= 0 && mask[right] && !visited[right]) {
        visited[right] = 1;
        stack.push(right);
      }
      if (up >= 0 && mask[up] && !visited[up]) {
        visited[up] = 1;
        stack.push(up);
      }
      if (down >= 0 && mask[down] && !visited[down]) {
        visited[down] = 1;
        stack.push(down);
      }
    }

    if (area < minPixelArea) continue;
    const boxWidth = maxX - minX + 1;
    const boxHeight = maxY - minY + 1;
    rawBoxes.push({
      x: minX,
      y: minY,
      width: boxWidth,
      height: boxHeight,
      area: boxWidth * boxHeight,
    });
  }

  const merged = mergeNearbyBoxes(rawBoxes, width, height)
    .sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y))
    .slice(0, 120)
    .map((box, index) => ({ id: index + 1, ...box }));

  return {
    imageWidth: width,
    imageHeight: height,
    elements: merged,
  };
}

async function eraseSelectedElements(imageUrl, elements, hiddenIds) {
  const image = await loadImageFromDataUrl(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("浏览器不支持元素编辑");

  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;

  const pixelIndex = (x, y) => (y * width + x) * 4;

  const hiddenSet = new Set(hiddenIds);
  for (const element of elements) {
    if (!hiddenSet.has(element.id)) continue;
    const padX = Math.max(2, Math.round(element.width * 0.06));
    const padY = Math.max(2, Math.round(element.height * 0.08));
    const x = Math.max(0, element.x - padX);
    const y = Math.max(0, element.y - padY);
    const w = Math.min(canvas.width - x, element.width + padX * 2);
    const h = Math.min(canvas.height - y, element.height + padY * 2);

    const ringGap = Math.max(1, Math.round(Math.min(w, h) * 0.05));
    const ringLeft = Math.max(0, x - ringGap);
    const ringTop = Math.max(0, y - ringGap);
    const ringRight = Math.min(width - 1, x + w - 1 + ringGap);
    const ringBottom = Math.min(height - 1, y + h - 1 + ringGap);

    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let count = 0;
    for (let py = ringTop; py <= ringBottom; py += 1) {
      for (let px = ringLeft; px <= ringRight; px += 1) {
        const insideCore = px >= x && px < x + w && py >= y && py < y + h;
        if (insideCore) continue;
        const idx = pixelIndex(px, py);
        sumR += data[idx];
        sumG += data[idx + 1];
        sumB += data[idx + 2];
        count += 1;
      }
    }

    const baseR = count ? Math.round(sumR / count) : 248;
    const baseG = count ? Math.round(sumG / count) : 248;
    const baseB = count ? Math.round(sumB / count) : 248;

    for (let py = y; py < y + h; py += 1) {
      for (let px = x; px < x + w; px += 1) {
        const idx = pixelIndex(px, py);
        const noise = ((px * 17 + py * 31) % 7) - 3;
        data[idx] = Math.max(0, Math.min(255, baseR + noise));
        data[idx + 1] = Math.max(0, Math.min(255, baseG + noise));
        data[idx + 2] = Math.max(0, Math.min(255, baseB + noise));
      }
    }
  }

  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const cameraInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const cropImageRef = useRef(null);
  const elementStageRef = useRef(null);
  const latestImageFileRef = useRef(null);

  const [session, setSession] = useState(() => readStudentSession());
  const [stats, setStats] = useState(null);
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [termOptions, setTermOptions] = useState([]);

  const [filters, setFilters] = useState({
    keyword: "",
    subject: "",
    term: "",
    status: "",
  });

  const [form, setForm] = useState(INITIAL_FORM);
  const [composerMode, setComposerMode] = useState("camera");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [originalImageData, setOriginalImageData] = useState("");
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState(null);
  const [cropRect, setCropRect] = useState(null);
  const [ocrStatus, setOcrStatus] = useState("idle");
  const [ocrItems, setOcrItems] = useState([]);
  const [ocrError, setOcrError] = useState("");
  const [selectedOcrId, setSelectedOcrId] = useState(null);
  const [ocrApplyMode, setOcrApplyMode] = useState("snapshot");
  const [elementEditor, setElementEditor] = useState(() => createElementEditorInitial());
  const [elementDraftStart, setElementDraftStart] = useState(null);
  const [elementDraftRect, setElementDraftRect] = useState(null);

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const studentId = session?.student?.id;

  const refresh = useCallback(() => {
    if (!studentId) return;
    const data = getStudentDashboardData(studentId, filters);
    setStats(data.stats);
    setWrongQuestions(data.items);
    setSubjectOptions(data.subject_options || []);
    setTermOptions(data.term_options || []);
  }, [studentId, filters]);

  useEffect(() => {
    if (!studentId) {
      navigate("/student/login");
      return;
    }
    refresh();
  }, [studentId, navigate, refresh]);

  const setSuccess = (message) => {
    setError("");
    setNotice(message);
  };

  const setFailure = (message) => {
    setNotice("");
    setError(message);
  };

  const resetElementEditor = () => {
    setElementEditor(createElementEditorInitial());
    setElementDraftStart(null);
    setElementDraftRect(null);
  };

  const logout = () => {
    clearStudentSession();
    setSession(null);
    navigate("/student/login");
  };

  const onResetDemo = () => {
    if (!window.confirm("确认重置本地数据吗？")) return;
    resetStudentDemoData();
    refresh();
    setSuccess("已重置本地数据");
  };

  const onOpenComposer = () => {
    setComposerMode("camera");
    resetElementEditor();
    setIsComposerOpen(true);
  };

  const onCloseComposer = () => {
    resetElementEditor();
    setIsComposerOpen(false);
  };

  const onTriggerPick = (mode) => {
    if (mode === "camera") cameraInputRef.current?.click();
    if (mode === "photo") photoInputRef.current?.click();
    if (mode === "upload") uploadInputRef.current?.click();
  };

  const onRemovePhoto = () => {
    setForm((prev) => ({ ...prev, image_data: "", image_name: "" }));
    setOriginalImageData("");
    setIsCropping(false);
    setCropStart(null);
    setCropRect(null);
    setOcrStatus("idle");
    setOcrItems([]);
    setOcrError("");
    setSelectedOcrId(null);
    setOcrApplyMode("snapshot");
    resetElementEditor();
    latestImageFileRef.current = null;
  };

  const onApplyOcrItem = (item, silent = false, mode = ocrApplyMode) => {
    if (!item) return;
    const preferDiagram = mode === "diagram";
    const chosenImageUrl = preferDiagram
      ? item.diagramImageUrl || ""
      : item.questionImageUrl || item.diagramImageUrl || "";
    if (preferDiagram && !chosenImageUrl) {
      if (!silent) {
        setFailure(`第 ${item.id} 题没有可用图示图，请切到“题干+图片”模式`);
      }
      return;
    }
    const imageName = chosenImageUrl
      ? preferDiagram
        ? `ocr-diagram-q${item.id}.png`
        : `ocr-question-q${item.id}.png`
      : "";

    setSelectedOcrId(item.id);
    setForm((prev) => ({
      ...prev,
      title: prev.title || `第${item.id}题`,
      content: preferDiagram ? prev.content || item.text || "" : item.text || prev.content,
      image_data: chosenImageUrl || prev.image_data,
      image_name: chosenImageUrl ? imageName : prev.image_name,
    }));

    if (chosenImageUrl) {
      setOriginalImageData(chosenImageUrl);
      setCropRect(null);
      setIsCropping(false);
      setCropStart(null);
    }

    if (!silent) {
      setSuccess(
        preferDiagram
          ? `已应用第 ${item.id} 题：仅替换为图示图（不强制覆盖当前题干）`
          : `已应用第 ${item.id} 题：题干+图片已填充`,
      );
    }
  };

  const onOpenOcrItemEditor = (item) => {
    if (!item) return;

    if (ocrApplyMode === "diagram") {
      if (!item.diagramImageUrl) {
        setFailure(`第 ${item.id} 题没有图示图，无法按“只换图示”模式精修`);
        return;
      }
      onOpenElementEditor({
        imageUrl: item.diagramImageUrl,
        sourceLabel: `第${item.id}题图示图`,
        sourceType: "diagram",
        itemId: item.id,
      });
      return;
    }

    if (item.questionImageUrl) {
      onOpenElementEditor({
        imageUrl: item.questionImageUrl,
        sourceLabel: `第${item.id}题题目图`,
        sourceType: "question",
        itemId: item.id,
      });
      return;
    }

    if (item.diagramImageUrl) {
      onOpenElementEditor({
        imageUrl: item.diagramImageUrl,
        sourceLabel: `第${item.id}题图示图`,
        sourceType: "diagram",
        itemId: item.id,
      });
      return;
    }

    setFailure(`第 ${item.id} 题没有可精修图片`);
  };

  const onOpenElementEditor = async ({ imageUrl, sourceLabel, sourceType = "form", itemId = null }) => {
    if (!imageUrl) {
      setFailure("当前没有可扫描的图片");
      return;
    }

    setElementEditor({
      ...createElementEditorInitial(),
      open: true,
      sourceImage: imageUrl,
      sourceLabel,
      sourceType,
      itemId,
      loading: true,
    });
    setElementDraftStart(null);
    setElementDraftRect(null);

    try {
      const detected = await detectScanElements(imageUrl);
      setElementEditor((prev) => ({
        ...prev,
        loading: false,
        imageWidth: detected.imageWidth,
        imageHeight: detected.imageHeight,
        elements: detected.elements,
        hiddenIds: [],
        error: detected.elements.length ? "" : "未自动识别到元素，可在下方拖拽框选删除区域。",
      }));
      setSuccess(
        detected.elements.length
          ? `元素扫描完成：识别到 ${detected.elements.length} 个元素，可逐个点选删除`
          : "元素扫描完成：未识别到元素，可手动框选",
      );
    } catch (err) {
      setElementEditor((prev) => ({
        ...prev,
        loading: false,
        error: err?.message || "元素扫描失败",
      }));
      setFailure(err?.message || "元素扫描失败");
    }
  };

  const onToggleElementHidden = (elementId) => {
    setElementEditor((prev) => {
      const hiddenSet = new Set(prev.hiddenIds);
      if (hiddenSet.has(elementId)) {
        hiddenSet.delete(elementId);
      } else {
        hiddenSet.add(elementId);
      }
      return {
        ...prev,
        hiddenIds: Array.from(hiddenSet),
      };
    });
  };

  const onMarkAllElements = () => {
    setElementEditor((prev) => ({
      ...prev,
      hiddenIds: prev.elements.map((element) => element.id),
    }));
  };

  const onClearElementMarks = () => {
    setElementEditor((prev) => ({
      ...prev,
      hiddenIds: [],
    }));
  };

  const onApplyElementErase = async () => {
    if (!elementEditor.sourceImage || !elementEditor.elements.length) {
      setFailure("当前没有可应用的元素");
      return;
    }
    if (!elementEditor.hiddenIds.length) {
      setFailure("请先点选需要删除的元素");
      return;
    }

    setElementEditor((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const cleaned = await eraseSelectedElements(
        elementEditor.sourceImage,
        elementEditor.elements,
        elementEditor.hiddenIds,
      );
      setForm((prev) => ({
        ...prev,
        image_data: cleaned,
        image_name: prev.image_name ? `clean-${prev.image_name.replace(/^clean-/, "")}` : "clean-question.png",
      }));
      setOriginalImageData(elementEditor.sourceImage);
      setCropRect(null);
      setIsCropping(false);
      setCropStart(null);

      if (elementEditor.itemId) {
        setSelectedOcrId(elementEditor.itemId);
        setOcrItems((prev) =>
          prev.map((item) => {
            if (item.id !== elementEditor.itemId) return item;
            if (elementEditor.sourceType === "question") {
              return { ...item, questionImageUrl: cleaned, hasImage: true };
            }
            if (elementEditor.sourceType === "diagram") {
              return { ...item, diagramImageUrl: cleaned, hasImage: true };
            }
            return item;
          }),
        );
      }

      resetElementEditor();
      setSuccess(`已删除 ${elementEditor.hiddenIds.length} 个元素，生成清洗图`);
    } catch (err) {
      setElementEditor((prev) => ({ ...prev, loading: false, error: err?.message || "应用删除失败" }));
      setFailure(err?.message || "应用删除失败");
    }
  };

  const onRunRealOcr = async (file) => {
    if (!file || !String(file.type || "").startsWith("image/")) return;

    resetElementEditor();
    setOcrStatus("loading");
    setOcrError("");
    setOcrItems([]);
    setSelectedOcrId(null);

    try {
      const response = await extractQuestions(file);
      const items = normalizeOcrItems(response?.items);
      if (!items.length) {
        setOcrStatus("empty");
        setSuccess("真实识别完成，但未提取到题目，请手动填写");
        return;
      }

      setOcrItems(items);
      setOcrStatus("success");
      onApplyOcrItem(items[0], true, ocrApplyMode);
      setSuccess(`真实识别完成：共 ${items.length} 题，已自动填充第 ${items[0].id} 题`);
    } catch (err) {
      const message = err?.message || "题目识别失败";
      setOcrStatus("error");
      setOcrError(message);
      setFailure(`真实识别失败：${message}`);
    }
  };

  const onUseFile = async (file, sourceLabel) => {
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      setFailure("文件过大，请选择 12MB 以内文件");
      return;
    }

    setLoading(true);
    try {
      if (file.type.startsWith("image/")) {
        latestImageFileRef.current = file;
        setOcrStatus("idle");
        setOcrItems([]);
        setOcrError("");
        setSelectedOcrId(null);
        setOcrApplyMode("snapshot");
        resetElementEditor();

        try {
          const compressed = await compressImage(file);
          setForm((prev) => ({
            ...prev,
            image_data: compressed,
            image_name: file.name,
            content: prev.content || `已通过${sourceLabel}录入图片，待补充题干文字`,
          }));
          setOriginalImageData(compressed);
          setCropRect(null);
          setIsCropping(false);
          setCropStart(null);
          setSuccess("图片已加载，正在进行真实题目识别...");
          await onRunRealOcr(file);
        } catch {
          // 某些浏览器无法解码 HEIC/HEIF，降级为附件模式，避免阻塞错题录入。
          setForm((prev) => ({
            ...prev,
            image_data: "",
            image_name: file.name,
            content: prev.content || `已通过${sourceLabel}录入附件：${file.name}，请补充题干文字`,
          }));
          setOriginalImageData("");
          setCropRect(null);
          setIsCropping(false);
          setCropStart(null);
          if (isLikelyHeicFile(file)) {
            setSuccess("HEIC 图片当前浏览器无法解析预览，已按附件录入。仍将尝试真实识别题目。");
          } else {
            setSuccess("图片暂不支持预览，已按附件录入。仍将尝试真实识别题目。");
          }
          await onRunRealOcr(file);
        }
      } else {
        setForm((prev) => ({
          ...prev,
          image_data: "",
          image_name: file.name,
          content: prev.content || `已上传附件：${file.name}`,
        }));
        setOriginalImageData("");
        setCropRect(null);
        setIsCropping(false);
        setCropStart(null);
        setOcrStatus("idle");
        setOcrItems([]);
        setOcrError("");
        setSelectedOcrId(null);
        setOcrApplyMode("snapshot");
        resetElementEditor();
        latestImageFileRef.current = null;
        setSuccess("附件已加载，请补充题干后保存");
      }
    } catch (err) {
      setFailure(err?.message || "文件处理失败");
    } finally {
      setLoading(false);
    }
  };

  const onPickCamera = async (event) => {
    const file = event.target.files?.[0];
    await onUseFile(file, "拍照");
    event.target.value = "";
  };

  const onPickPhoto = async (event) => {
    const file = event.target.files?.[0];
    await onUseFile(file, "相册");
    event.target.value = "";
  };

  const onPickUpload = async (event) => {
    const file = event.target.files?.[0];
    await onUseFile(file, "上传");
    event.target.value = "";
  };

  const onAddWrongQuestion = (event) => {
    event.preventDefault();
    if (!studentId) return;

    setLoading(true);
    try {
      createStudentWrongQuestion(studentId, form);
      setForm((prev) => ({ ...INITIAL_FORM, subject: prev.subject, term: prev.term }));
      setIsComposerOpen(false);
      setOriginalImageData("");
      setCropRect(null);
      setIsCropping(false);
      setCropStart(null);
      setOcrStatus("idle");
      setOcrItems([]);
      setOcrError("");
      setSelectedOcrId(null);
      setOcrApplyMode("snapshot");
      resetElementEditor();
      latestImageFileRef.current = null;
      refresh();
      setSuccess("错题已加入错题本");
    } catch (err) {
      setFailure(err?.message || "新增错题失败");
    } finally {
      setLoading(false);
    }
  };

  const onChangeStatus = (wrongQuestionId, status) => {
    if (!studentId) return;

    setLoading(true);
    try {
      setWrongQuestionStatus(studentId, wrongQuestionId, status);
      refresh();
      setSuccess(`已更新为${STATUS_LABEL[status]}`);
    } catch (err) {
      setFailure(err?.message || "状态更新失败");
    } finally {
      setLoading(false);
    }
  };

  const onPractice = (wrongQuestionId, result) => {
    if (!studentId) return;

    setLoading(true);
    try {
      addPracticeRecord(studentId, wrongQuestionId, result);
      refresh();
      setSuccess(result === "correct" ? "已记录：本次做对" : "已记录：本次仍做错");
    } catch (err) {
      setFailure(err?.message || "练习记录失败");
    } finally {
      setLoading(false);
    }
  };

  const getPointInImage = (event) => {
    const imageEl = cropImageRef.current;
    if (!imageEl) return null;

    const rect = imageEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
    return { x, y, width: rect.width, height: rect.height };
  };

  const getPointInElementStage = (event) => {
    const stageEl = elementStageRef.current;
    if (!stageEl || !elementEditor.imageWidth || !elementEditor.imageHeight) return null;

    const rect = stageEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const viewX = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const viewY = Math.max(0, Math.min(event.clientY - rect.top, rect.height));
    const imageX = Math.max(0, Math.min(elementEditor.imageWidth, Math.round((viewX / rect.width) * elementEditor.imageWidth)));
    const imageY = Math.max(
      0,
      Math.min(elementEditor.imageHeight, Math.round((viewY / rect.height) * elementEditor.imageHeight)),
    );

    return { viewX, viewY, imageX, imageY };
  };

  const onElementStageMouseDown = (event) => {
    if (!elementEditor.open || elementEditor.loading) return;
    const point = getPointInElementStage(event);
    if (!point) return;

    setElementDraftStart(point);
    setElementDraftRect({ x: point.imageX, y: point.imageY, width: 0, height: 0 });
  };

  const onElementStageMouseMove = (event) => {
    if (!elementDraftStart) return;
    const point = getPointInElementStage(event);
    if (!point) return;

    const left = Math.min(elementDraftStart.imageX, point.imageX);
    const top = Math.min(elementDraftStart.imageY, point.imageY);
    const width = Math.abs(elementDraftStart.imageX - point.imageX);
    const height = Math.abs(elementDraftStart.imageY - point.imageY);
    setElementDraftRect({ x: left, y: top, width, height });
  };

  const onElementStageMouseUp = () => {
    if (!elementDraftStart) return;
    const draft = elementDraftRect;
    setElementDraftStart(null);
    setElementDraftRect(null);

    if (!draft || draft.width < 12 || draft.height < 12) return;
    setElementEditor((editorPrev) => {
      const newId = editorPrev.elements.reduce((max, element) => Math.max(max, element.id), 0) + 1;
      return {
        ...editorPrev,
        elements: [...editorPrev.elements, { id: newId, ...draft }],
        hiddenIds: [...editorPrev.hiddenIds, newId],
      };
    });
    setSuccess("已新增删除框，点击“应用删除到图片”后生效");
  };

  const onCropMouseDown = (event) => {
    if (!form.image_data) return;
    const point = getPointInImage(event);
    if (!point) return;

    event.preventDefault();
    setIsCropping(true);
    setCropStart({ x: point.x, y: point.y });
    setCropRect({ x: point.x, y: point.y, width: 0, height: 0 });
  };

  const onCropMouseMove = (event) => {
    if (!isCropping || !cropStart) return;
    const imageEl = cropImageRef.current;
    if (!imageEl) return;

    const rect = imageEl.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(event.clientY - rect.top, rect.height));

    const left = Math.min(cropStart.x, x);
    const top = Math.min(cropStart.y, y);
    const width = Math.abs(cropStart.x - x);
    const height = Math.abs(cropStart.y - y);
    setCropRect({ x: left, y: top, width, height });
  };

  const onCropMouseUp = () => {
    if (!isCropping) return;
    setIsCropping(false);
    setCropStart(null);

    setCropRect((prev) => {
      if (!prev) return null;
      if (prev.width < 8 || prev.height < 8) return null;
      return prev;
    });
  };

  const onApplyCrop = async () => {
    if (!form.image_data || !cropRect) {
      setFailure("请先在图片上拖拽框选区域");
      return;
    }

    const imageEl = cropImageRef.current;
    if (!imageEl || !imageEl.clientWidth || !imageEl.clientHeight) {
      setFailure("图片未就绪，请稍后再试");
      return;
    }

    setLoading(true);
    try {
      const sourceImage = await loadImageFromDataUrl(form.image_data);
      const scaleX = sourceImage.width / imageEl.clientWidth;
      const scaleY = sourceImage.height / imageEl.clientHeight;
      const sx = Math.max(0, Math.round(cropRect.x * scaleX));
      const sy = Math.max(0, Math.round(cropRect.y * scaleY));
      const sw = Math.max(1, Math.round(cropRect.width * scaleX));
      const sh = Math.max(1, Math.round(cropRect.height * scaleY));

      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("浏览器不支持图片裁剪");
      }
      context.drawImage(sourceImage, sx, sy, sw, sh, 0, 0, sw, sh);

      const croppedDataUrl = canvas.toDataURL("image/png");
      setForm((prev) => ({
        ...prev,
        image_data: croppedDataUrl,
        image_name: prev.image_name ? `crop-${prev.image_name}` : "cropped-question.png",
      }));
      setCropRect(null);
      setSuccess("已抠出题内图，可直接保存错题");
    } catch (err) {
      setFailure(err?.message || "抠图失败");
    } finally {
      setLoading(false);
    }
  };

  const onWhitenBackground = async () => {
    if (!form.image_data) {
      setFailure("当前没有可处理的图片");
      return;
    }

    setLoading(true);
    try {
      const sourceImage = await loadImageFromDataUrl(form.image_data);
      const canvas = document.createElement("canvas");
      canvas.width = sourceImage.width;
      canvas.height = sourceImage.height;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("浏览器不支持背景处理");
      }

      context.drawImage(sourceImage, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = imageData;
      const hist = new Array(256).fill(0);
      const grayValues = new Uint8Array(canvas.width * canvas.height);

      for (let i = 0, p = 0; i < grayValues.length; i += 1, p += 4) {
        const gray = Math.max(0, Math.min(255, Math.round(0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2])));
        grayValues[i] = gray;
        hist[gray] += 1;
      }

      const total = grayValues.length;
      const pickPercentile = (ratio) => {
        const target = Math.floor(total * ratio);
        let acc = 0;
        for (let value = 0; value < 256; value += 1) {
          acc += hist[value];
          if (acc >= target) return value;
        }
        return 255;
      };

      const p10 = pickPercentile(0.1);
      const p92 = Math.max(p10 + 20, pickPercentile(0.92));
      const span = Math.max(1, p92 - p10);

      for (let i = 0, p = 0; i < grayValues.length; i += 1, p += 4) {
        const norm = Math.max(0, Math.min(1, (grayValues[i] - p10) / span));
        if (norm >= 0.72) {
          data[p] = 255;
          data[p + 1] = 255;
          data[p + 2] = 255;
          continue;
        }

        const boost = Math.max(0, Math.min(1, (norm - 0.45) / 0.27));
        const enhance = (channel) => {
          const stretched = Math.max(0, Math.min(255, ((channel - p10) * 255) / span));
          return Math.round(stretched + (255 - stretched) * boost * 0.45);
        };

        data[p] = enhance(data[p]);
        data[p + 1] = enhance(data[p + 1]);
        data[p + 2] = enhance(data[p + 2]);
      }

      context.putImageData(imageData, 0, 0);
      const whitenedDataUrl = canvas.toDataURL("image/png");
      setOriginalImageData((prev) => prev || form.image_data);
      setForm((prev) => ({
        ...prev,
        image_data: whitenedDataUrl,
        image_name: prev.image_name ? `white-${prev.image_name.replace(/^white-/, "")}` : "white-question.png",
      }));
      setCropRect(null);
      setSuccess("已完成背景置白，可继续抠图或保存");
    } catch (err) {
      setFailure(err?.message || "背景置白失败");
    } finally {
      setLoading(false);
    }
  };

  const onAutoRemoveHandwriting = async () => {
    if (!form.image_data) {
      setFailure("当前没有可处理的图片");
      return;
    }

    setLoading(true);
    try {
      const detected = await detectHandwritingElements(form.image_data);
      if (!detected.elements.length) {
        setSuccess("未检测到明显手写标记，可直接保存或手动精修");
        return;
      }

      const allIds = detected.elements.map((item) => item.id);
      const cleaned = await eraseSelectedElements(form.image_data, detected.elements, allIds);
      setOriginalImageData((prev) => prev || form.image_data);
      setForm((prev) => ({
        ...prev,
        image_data: cleaned,
        image_name: prev.image_name ? `clean-hand-${prev.image_name.replace(/^clean-hand-/, "")}` : "clean-handwriting.png",
      }));
      setCropRect(null);
      setSuccess(`已自动去除 ${detected.elements.length} 处手写标记（安全模式）`);
    } catch (err) {
      setFailure(err?.message || "自动去手写失败");
    } finally {
      setLoading(false);
    }
  };

  const onRestoreOriginalImage = () => {
    if (!originalImageData) return;
    setForm((prev) => ({
      ...prev,
      image_data: originalImageData,
      image_name: prev.image_name?.replace(/^crop-/, "") || prev.image_name,
    }));
    setCropRect(null);
    setSuccess("已恢复原图");
  };

  if (!session?.student) return null;

  const student = session.student;
  const profile = student.student_profile || {};
  const formTermOptions = Array.from(new Set([...TERM_OPTIONS, ...termOptions, getDefaultSchoolTerm()]));
  const filterSubjectOptions = Array.from(
    new Set([...DEFAULT_SUBJECT_OPTIONS, ...subjectOptions, form.subject].filter(Boolean)),
  );
  const filterTermOptions = Array.from(
    new Set([...TERM_OPTIONS, ...termOptions, getDefaultSchoolTerm(), form.term].filter(Boolean)),
  );

  return (
    <div className="page student-dashboard-page">
      <header className="hero student-hero">
        <div className="hero-tag">学生错题本</div>
        <h1>{student.name} 的错题本</h1>
        <p>年级：{profile.grade || "-"} · 学号：{profile.student_no || "-"}</p>
        <div className="hero-actions">
          <button className="btn-primary" type="button" onClick={logout}>
            退出登录
          </button>
          <Link className="btn-ghost" to="/">
            切换角色
          </Link>
          <button className="btn-ghost" type="button" onClick={onResetDemo}>
            重置数据
          </button>
        </div>
      </header>

      {notice && <div className="workspace-alert ok">{notice}</div>}
      {error && <div className="workspace-alert error">{error}</div>}
      {loading && <div className="workspace-alert">处理中...</div>}

      {stats && (
        <section className="workspace-card">
          <div className="student-stats-head">
            <div>
              <h2>学习统计</h2>
              <p>先看整体掌握情况，再进入下方错题列表维护。</p>
            </div>
            <button className="btn-primary" type="button" onClick={onOpenComposer}>
              添加错题
            </button>
          </div>
          <div className="workspace-stat-grid student-stats-grid">
            <div>
              <span>错题总数</span>
              <strong>{stats.total}</strong>
            </div>
            <div>
              <span>新错题</span>
              <strong>{stats.new_count}</strong>
            </div>
            <div>
              <span>复习中</span>
              <strong>{stats.reviewing_count}</strong>
            </div>
            <div>
              <span>已掌握</span>
              <strong>{stats.mastered_count}</strong>
            </div>
            <div>
              <span>掌握率</span>
              <strong>{stats.mastery_rate}%</strong>
            </div>
            <div>
              <span>累计练习</span>
              <strong>{stats.total_reviews}</strong>
            </div>
          </div>
        </section>
      )}

      <section className="workspace-card">
        <h2>我的错题列表</h2>

        <div className="student-filter-block">
          <span className="student-filter-label">按学科筛选</span>
          <div className="student-filter-tabs">
            <button
              type="button"
              className={`student-filter-tab subject ${filters.subject === "" ? "active" : ""}`}
              onClick={() => setFilters((prev) => ({ ...prev, subject: "" }))}
            >
              全部学科
            </button>
            {filterSubjectOptions.map((subject) => (
              <button
                key={subject}
                type="button"
                className={`student-filter-tab subject ${filters.subject === subject ? "active" : ""}`}
                onClick={() => setFilters((prev) => ({ ...prev, subject }))}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>

        <div className="student-filter-block">
          <span className="student-filter-label">按学期分期筛选</span>
          <div className="student-filter-tabs">
            <button
              type="button"
              className={`student-filter-tab term ${filters.term === "" ? "active" : ""}`}
              onClick={() => setFilters((prev) => ({ ...prev, term: "" }))}
            >
              全部学期
            </button>
            {filterTermOptions.map((term) => (
              <button
                key={term}
                type="button"
                className={`student-filter-tab term ${filters.term === term ? "active" : ""}`}
                onClick={() => setFilters((prev) => ({ ...prev, term }))}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        <div className="workspace-form student-filter-grid">
          <label>
            关键词
            <input
              placeholder="标题 / 内容 / 错误原因"
              value={filters.keyword}
              onChange={(event) => setFilters((prev) => ({ ...prev, keyword: event.target.value }))}
            />
          </label>
          <label>
            状态
            <select
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="">全部</option>
              <option value="new">新错题</option>
              <option value="reviewing">复习中</option>
              <option value="mastered">已掌握</option>
            </select>
          </label>
        </div>

        <div className="student-card-grid">
          {wrongQuestions.length === 0 ? (
            <p>当前筛选条件下没有错题。</p>
          ) : (
            wrongQuestions.map((item) => (
              <article key={item.id} className="student-question-item">
                <div className="student-question-head">
                  <div className="student-chip-row">
                    <span className="student-subject-badge">{item.subject}</span>
                    <span className="student-term-badge">{item.term}</span>
                  </div>
                  <span className={`student-status status-${item.status}`}>{STATUS_LABEL[item.status]}</span>
                </div>
                <strong className="student-question-title">{item.title}</strong>
                {item.image_data && (
                  <div className="student-question-image-wrap">
                    <img className="student-question-image" src={item.image_data} alt={item.image_name || item.title} />
                  </div>
                )}
                <p>{item.content}</p>
                <div className="student-meta">
                  <span>学科：{item.subject}</span>
                  <span>学期：{item.term}</span>
                  <span>分类：{item.category}</span>
                  <span>错因：{item.error_reason}</span>
                  <span>练习：{item.review_count || 0} 次</span>
                </div>
                <div className="student-actions">
                  <button type="button" className="btn-secondary btn-small" onClick={() => onPractice(item.id, "correct")}>
                    本次做对
                  </button>
                  <button type="button" className="btn-secondary btn-small" onClick={() => onPractice(item.id, "incorrect")}>
                    本次做错
                  </button>
                  <button type="button" className="btn-small btn-ghost" onClick={() => onChangeStatus(item.id, "reviewing")}>
                    标记复习中
                  </button>
                  <button type="button" className="btn-small btn-ghost" onClick={() => onChangeStatus(item.id, "mastered")}>
                    标记已掌握
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {isComposerOpen && (
        <div className="student-modal-backdrop" onClick={onCloseComposer}>
          <section className="student-modal" onClick={(event) => event.stopPropagation()}>
            <div className="student-modal-head">
              <h3>添加错题</h3>
              <button type="button" className="btn-ghost btn-small" onClick={onCloseComposer}>
                关闭
              </button>
            </div>

            <div className="student-entry-mode-tabs">
              {ENTRY_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={`student-entry-mode-tab ${composerMode === mode.id ? "active" : ""}`}
                  onClick={() => setComposerMode(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="student-entry-panel">
              {composerMode === "camera" && (
                <button type="button" className="btn-secondary" onClick={() => onTriggerPick("camera")}>
                  打开摄像头拍照
                </button>
              )}
              {composerMode === "photo" && (
                <button type="button" className="btn-secondary" onClick={() => onTriggerPick("photo")}>
                  从相册选择照片
                </button>
              )}
              {composerMode === "upload" && (
                <button type="button" className="btn-secondary" onClick={() => onTriggerPick("upload")}>
                  上传文件
                </button>
              )}
              {composerMode === "text" && (
                <p className="hint">请在下方填写题目内容，可不上传图片。</p>
              )}

              <input
                ref={cameraInputRef}
                className="student-hidden-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onPickCamera}
              />
              <input
                ref={photoInputRef}
                className="student-hidden-input"
                type="file"
                accept="image/*"
                onChange={onPickPhoto}
              />
              <input
                ref={uploadInputRef}
                className="student-hidden-input"
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={onPickUpload}
              />
            </div>

            {(form.image_data || form.image_name) && (
              <div className="student-photo-preview student-full-col">
                {form.image_data ? (
                  <img src={form.image_data} alt={form.image_name || "错题图片"} />
                ) : (
                  <div className="workspace-alert">当前附件：{form.image_name}</div>
                )}
                <div className="student-photo-meta">
                  <span>{form.image_name || "已选择文件"}</span>
                  <button type="button" className="btn-small btn-ghost" onClick={onRemovePhoto}>
                    清除文件
                  </button>
                </div>
              </div>
            )}

            {(form.image_data || form.image_name) && (
              <section className="student-ocr-section">
                <div className="student-ocr-head">
                  <div>
                    <h4>题目识别结果（真实）</h4>
                    <p>先选模式，再点每题“应用该题”。只保留 2 个核心动作：应用、精修。</p>
                  </div>
                  <div className="student-ocr-head-actions">
                    <div className="student-ocr-mode-tabs">
                      <button
                        type="button"
                        className={`student-ocr-mode-tab ${ocrApplyMode === "snapshot" ? "active" : ""}`}
                        onClick={() => setOcrApplyMode("snapshot")}
                      >
                        题干+图片
                      </button>
                      <button
                        type="button"
                        className={`student-ocr-mode-tab ${ocrApplyMode === "diagram" ? "active" : ""}`}
                        onClick={() => setOcrApplyMode("diagram")}
                      >
                        只换图示
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary btn-small"
                      disabled={ocrStatus === "loading" || !latestImageFileRef.current}
                      onClick={() => onRunRealOcr(latestImageFileRef.current)}
                    >
                      {ocrStatus === "loading" ? "识别中..." : "重新识别"}
                    </button>
                  </div>
                </div>
                <div className="student-ocr-mode-hint">
                  当前模式：
                  {ocrApplyMode === "snapshot"
                    ? "题干+图片（会用OCR题干覆盖输入框）"
                    : "只换图示（不覆盖你已编辑的题干）"}
                </div>

                {ocrStatus === "loading" && <div className="workspace-alert">正在识别题目，请稍候...</div>}
                {ocrStatus === "error" && <div className="workspace-alert error">{ocrError || "识别失败"}</div>}
                {ocrStatus === "empty" && (
                  <div className="workspace-alert">识别已完成，但未提取到题目，请手动补充题目内容。</div>
                )}

                {ocrStatus === "success" && ocrItems.length > 0 && (
                  <div className="student-ocr-list">
                    {ocrItems.map((item) => (
                      <article
                        key={item.id}
                        className={`student-ocr-item ${selectedOcrId === item.id ? "active" : ""}`}
                      >
                        <div className="student-ocr-item-head">
                          <strong>第 {item.id} 题</strong>
                          <div className="student-ocr-item-actions">
                            <button
                              type="button"
                              className="btn-ghost btn-small"
                              onClick={() => onApplyOcrItem(item, false)}
                            >
                              应用该题
                            </button>
                            <button
                              type="button"
                              className="btn-ghost btn-small"
                              onClick={() => onOpenOcrItemEditor(item)}
                            >
                              精修图片
                            </button>
                          </div>
                        </div>
                        <p className="student-ocr-text">{item.text || "（该题未返回文字）"}</p>
                        <div className="student-ocr-image-grid">
                          <div className="student-ocr-image-slot">
                            <span className="student-ocr-image-label">题目截图</span>
                            {item.questionImageUrl ? (
                              <div className="student-ocr-image-wrap">
                                <img src={item.questionImageUrl} alt={`第${item.id}题题目截图`} />
                              </div>
                            ) : (
                              <div className="workspace-alert">未返回题目截图</div>
                            )}
                          </div>
                          <div className="student-ocr-image-slot">
                            <span className="student-ocr-image-label">图示抠图</span>
                            {item.diagramImageUrl ? (
                              <div className="student-ocr-image-wrap diagram">
                                <img src={item.diagramImageUrl} alt={`第${item.id}题图示抠图`} />
                              </div>
                            ) : (
                              <div className="workspace-alert">该题没有图示抠图</div>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {elementEditor.open && (
                  <section className="student-element-editor">
                    <div className="student-element-editor-head">
                      <div>
                        <h4>元素扫描编辑</h4>
                        <p>
                          来源：{elementEditor.sourceLabel || "当前图片"}。已识别 {elementEditor.elements.length} 个元素，
                          已标记删除 {elementEditor.hiddenIds.length} 个。点击框可切换，空白处拖拽可新增删除框。
                        </p>
                      </div>
                      <div className="student-element-editor-actions">
                        <button
                          type="button"
                          className="btn-ghost btn-small"
                          onClick={onMarkAllElements}
                          disabled={elementEditor.loading || !elementEditor.elements.length}
                        >
                          全部标记删除
                        </button>
                        <button
                          type="button"
                          className="btn-ghost btn-small"
                          onClick={onClearElementMarks}
                          disabled={elementEditor.loading || !elementEditor.hiddenIds.length}
                        >
                          清空标记
                        </button>
                        <button
                          type="button"
                          className="btn-secondary btn-small"
                          onClick={onApplyElementErase}
                          disabled={elementEditor.loading || !elementEditor.hiddenIds.length}
                        >
                          {elementEditor.loading ? "处理中..." : "应用删除到图片"}
                        </button>
                        <button type="button" className="btn-ghost btn-small" onClick={resetElementEditor}>
                          关闭编辑
                        </button>
                      </div>
                    </div>

                    {elementEditor.error && <div className="workspace-alert">{elementEditor.error}</div>}
                    {elementEditor.loading && <div className="workspace-alert">元素扫描处理中...</div>}

                    {elementEditor.sourceImage && (
                      <div
                        ref={elementStageRef}
                        className="student-element-stage"
                        onMouseDown={onElementStageMouseDown}
                        onMouseMove={onElementStageMouseMove}
                        onMouseUp={onElementStageMouseUp}
                        onMouseLeave={onElementStageMouseUp}
                      >
                        <img src={elementEditor.sourceImage} alt="元素扫描底图" draggable={false} />
                        {elementEditor.elements.map((element) => {
                          const marked = elementEditor.hiddenIds.includes(element.id);
                          return (
                            <button
                              key={element.id}
                              type="button"
                              className={`student-element-box ${marked ? "marked" : ""}`}
                              style={{
                                left: `${(element.x / Math.max(1, elementEditor.imageWidth)) * 100}%`,
                                top: `${(element.y / Math.max(1, elementEditor.imageHeight)) * 100}%`,
                                width: `${(element.width / Math.max(1, elementEditor.imageWidth)) * 100}%`,
                                height: `${(element.height / Math.max(1, elementEditor.imageHeight)) * 100}%`,
                              }}
                              onMouseDown={(event) => event.stopPropagation()}
                              onClick={(event) => {
                                event.stopPropagation();
                                onToggleElementHidden(element.id);
                              }}
                              title={marked ? "已标记删除，点击恢复" : "点击标记删除"}
                            />
                          );
                        })}
                        {elementDraftRect && (
                          <div
                            className="student-element-draft"
                            style={{
                              left: `${(elementDraftRect.x / Math.max(1, elementEditor.imageWidth)) * 100}%`,
                              top: `${(elementDraftRect.y / Math.max(1, elementEditor.imageHeight)) * 100}%`,
                              width: `${(elementDraftRect.width / Math.max(1, elementEditor.imageWidth)) * 100}%`,
                              height: `${(elementDraftRect.height / Math.max(1, elementEditor.imageHeight)) * 100}%`,
                            }}
                          />
                        )}
                      </div>
                    )}
                  </section>
                )}
              </section>
            )}

            {form.image_data && (
              <section className="student-crop-section">
                <div className="student-crop-actions">
                  <span className="student-filter-label">前端抠图：拖拽框选题内图（集合图/几何图）</span>
                  <div className="student-crop-buttons">
                    <button
                      type="button"
                      className="btn-ghost btn-small"
                      onClick={() =>
                        onOpenElementEditor({
                          imageUrl: form.image_data,
                          sourceLabel: "当前预览图",
                          sourceType: "form",
                          itemId: selectedOcrId,
                        })
                      }
                    >
                      扫描当前图元素
                    </button>
                    <button type="button" className="btn-ghost btn-small" onClick={onAutoRemoveHandwriting}>
                      自动去手写
                    </button>
                    <button type="button" className="btn-ghost btn-small" onClick={onWhitenBackground}>
                      背景置白
                    </button>
                    <button type="button" className="btn-secondary btn-small" onClick={onApplyCrop}>
                      抠选中区域
                    </button>
                    {originalImageData && originalImageData !== form.image_data && (
                      <button type="button" className="btn-small btn-ghost" onClick={onRestoreOriginalImage}>
                        恢复原图
                      </button>
                    )}
                  </div>
                </div>
                <div
                  className="student-crop-area"
                  onMouseDown={onCropMouseDown}
                  onMouseMove={onCropMouseMove}
                  onMouseUp={onCropMouseUp}
                  onMouseLeave={onCropMouseUp}
                >
                  <img ref={cropImageRef} src={form.image_data} alt="待抠图题目" draggable={false} />
                  {cropRect && (
                    <div
                      className="student-crop-rect"
                      style={{
                        left: `${cropRect.x}px`,
                        top: `${cropRect.y}px`,
                        width: `${cropRect.width}px`,
                        height: `${cropRect.height}px`,
                      }}
                    />
                  )}
                </div>
              </section>
            )}

            {(form.image_data || form.image_name) && (
              <section className="student-preview-section">
                <div className="student-preview-head">
                  <h4>错题卡片预览</h4>
                  <p>保存后将在错题列表按下方样式展示。</p>
                </div>
                <article className="student-question-item student-preview-card">
                  <div className="student-question-head">
                    <div className="student-chip-row">
                      <span className="student-subject-badge">{form.subject || "未分类学科"}</span>
                      <span className="student-term-badge">{form.term || getDefaultSchoolTerm()}</span>
                    </div>
                    <span className="student-status status-new">新错题</span>
                  </div>
                  <strong className="student-question-title">{form.title || "未命名错题"}</strong>
                  {form.image_data ? (
                    <div className="student-question-image-wrap">
                      <img className="student-question-image" src={form.image_data} alt={form.image_name || "错题图片预览"} />
                    </div>
                  ) : (
                    <div className="workspace-alert student-preview-note">
                      当前文件不可预览：{form.image_name || "未选择图片"}（可继续保存文字版错题）
                    </div>
                  )}
                  <p>{form.content || "请补充题目内容。"}</p>
                  <div className="student-meta">
                    <span>分类：{form.category || "未分类"}</span>
                    <span>错因：{form.error_reason || "待分析"}</span>
                  </div>
                </article>
              </section>
            )}

            <form className="workspace-form" onSubmit={onAddWrongQuestion}>
              <label>
                标题（可选）
                <input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </label>
              <label>
                学科
                <select
                  value={form.subject}
                  onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                >
                  <option value="数学">数学</option>
                  <option value="语文">语文</option>
                  <option value="英语">英语</option>
                  <option value="科学">科学</option>
                </select>
              </label>
              <label>
                学期分期
                <select
                  value={form.term}
                  onChange={(event) => setForm((prev) => ({ ...prev, term: event.target.value }))}
                >
                  {formTermOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                错题分类
                <input
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                />
              </label>
              <label>
                错误原因
                <input
                  value={form.error_reason}
                  onChange={(event) => setForm((prev) => ({ ...prev, error_reason: event.target.value }))}
                />
              </label>
              <label className="student-full-col">
                题目内容（支持手动输入）
                <textarea
                  rows={3}
                  value={form.content}
                  onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                />
              </label>
              <button className="btn-primary" type="submit" disabled={loading}>
                保存到错题本
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
