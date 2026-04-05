export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

export function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片解析失败"));
    image.src = dataUrl;
  });
}

export async function dataUrlToFile(dataUrl, fileName = "selected-question.png") {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || "image/png" });
}

export async function cropDataUrlBySourceRect(sourceDataUrl, rect, outputType = "image/png") {
  if (!sourceDataUrl) {
    throw new Error("缺少源图片");
  }
  if (!rect || rect.width < 1 || rect.height < 1) {
    throw new Error("请先框选有效区域");
  }

  const sourceImage = await loadImageFromDataUrl(sourceDataUrl);
  const sx = Math.max(0, Math.round(rect.x));
  const sy = Math.max(0, Math.round(rect.y));
  const sw = Math.max(1, Math.round(rect.width));
  const sh = Math.max(1, Math.round(rect.height));

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("浏览器不支持图片裁剪");
  }
  context.drawImage(sourceImage, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas.toDataURL(outputType);
}

export function normalizeOcrImageUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:")) {
    return value;
  }
  const base = String(
    import.meta.env.VITE_API_BASE ||
      (typeof window !== "undefined" && window.location?.origin ? window.location.origin : "http://localhost:8100"),
  ).replace(/\/+$/, "");
  return `${base}${value.startsWith("/") ? "" : "/"}${value}`;
}

export function normalizeOcrItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .map((item, index) => {
      const questionImageUrl = normalizeOcrImageUrl(item?.question_image_url);
      const diagramImageUrl = normalizeOcrImageUrl(item?.diagram_image_url);
      const diagramLocalImageUrl = normalizeOcrImageUrl(item?.diagram_local_image_url);
      const diagramLlmImageUrl = normalizeOcrImageUrl(item?.diagram_llm_image_url);
      const diagramSvgUrl = normalizeOcrImageUrl(item?.diagram_svg_url);
      const legacyImageUrls = Array.isArray(item?.image_urls)
        ? item.image_urls.map((url) => normalizeOcrImageUrl(url)).filter(Boolean)
        : [];

      const resolvedQuestionImageUrl = questionImageUrl || "";
      const resolvedLocalDiagramUrl = diagramLocalImageUrl || diagramImageUrl || legacyImageUrls[0] || "";

      return {
        id: Number(item?.id) || index + 1,
        text: String(item?.text || "").trim(),
        hasImage: Boolean(item?.has_image) || Boolean(resolvedLocalDiagramUrl || diagramLlmImageUrl),
        questionImageUrl: resolvedQuestionImageUrl,
        diagramImageUrl: resolvedLocalDiagramUrl,
        diagramLocalImageUrl: resolvedLocalDiagramUrl,
        diagramLlmImageUrl: diagramLlmImageUrl || "",
        diagramSvgUrl,
      };
    })
    .filter((item) => item.text || item.questionImageUrl || item.diagramImageUrl || item.diagramSvgUrl);
}

export function normalizeTextForCard(rawText) {
  return String(rawText || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

export function escapeSvgText(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildDiagramReplacementDataUrl(rawText, questionId) {
  const text = normalizeTextForCard(rawText);
  const lines = text ? text.split("\n").slice(0, 4) : [];
  const hint = lines.length ? lines : ["请根据题干补充图示关系", "可手动替换为标准教辅图"];
  const escapedTitle = escapeSvgText(`第${questionId}题 图示替代草图`);
  const textLines = hint
    .map((line) => line.slice(0, 26))
    .map((line, index) => `<text x="70" y="${122 + index * 34}" font-size="24" fill="#1f2937">${escapeSvgText(line)}</text>`)
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="560" viewBox="0 0 960 560">
<rect width="960" height="560" fill="#f8fafc"/>
<rect x="36" y="34" width="888" height="492" rx="22" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
<text x="70" y="84" font-size="30" fill="#0f172a">${escapedTitle}</text>
<line x1="70" y1="102" x2="890" y2="102" stroke="#e2e8f0" stroke-width="2"/>
<rect x="590" y="142" width="250" height="250" rx="18" fill="#eef2ff" stroke="#94a3b8" stroke-width="2"/>
<circle cx="710" cy="214" r="62" fill="none" stroke="#3b82f6" stroke-width="4"/>
<line x1="648" y1="214" x2="772" y2="214" stroke="#3b82f6" stroke-width="3"/>
<line x1="710" y1="152" x2="710" y2="276" stroke="#3b82f6" stroke-width="3"/>
<text x="648" y="332" font-size="20" fill="#475569">示意图模板</text>
${textLines}
<text x="70" y="474" font-size="20" fill="#64748b">注：此图为系统生成替代图，不依赖原图抠图结果。</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function isLikelyHeicFile(file) {
  const type = String(file?.type || "").toLowerCase();
  const name = String(file?.name || "").toLowerCase();
  return type.includes("heic") || type.includes("heif") || name.endsWith(".heic") || name.endsWith(".heif");
}

export async function compressImage(file) {
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

export function buildTextRowMask(darkRowDensity, imageHeight) {
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

export async function detectHandwritingElements(imageUrl) {
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
    const isDark = gray < 132;

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
    const pixels = [];
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
      pixels.push(current);
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
      density,
      colorRatio,
      textOverlapRatio,
      pixelIndices: pixels,
    });
  }

  const elements = rawBoxes
    .sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y))
    .slice(0, 120)
    .map((box, index) => ({ id: index + 1, ...box }));

  return {
    imageWidth: width,
    imageHeight: height,
    elements,
  };
}

export async function detectScanElements(imageUrl) {
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
    const pixels = [];
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
      pixels.push(current);
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
    const density = area / Math.max(1, boxWidth * boxHeight);
    rawBoxes.push({
      x: minX,
      y: minY,
      width: boxWidth,
      height: boxHeight,
      area: boxWidth * boxHeight,
      density,
      pixelIndices: pixels,
    });
  }

  const elements = rawBoxes
    .sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y))
    .slice(0, 120)
    .map((box, index) => ({ id: index + 1, ...box }));

  return {
    imageWidth: width,
    imageHeight: height,
    elements,
  };
}

export async function eraseSelectedElements(imageUrl, elements, hiddenIds, options = {}) {
  const mode = options.mode || "general";
  const protectTextRows = Boolean(options.protectTextRows);
  const image = await loadImageFromDataUrl(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("浏览器不支持元素编辑");

  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;
  const total = width * height;
  const grayValues = new Uint8Array(total);
  const colorMask = new Uint8Array(total);
  const darkRowCount = new Uint32Array(height);
  const eraseMask = new Uint8Array(total);
  const protectedMask = new Uint8Array(total);

  const pixelIndex = (x, y) => (y * width + x) * 4;
  const clampByte = (value) => Math.max(0, Math.min(255, Math.round(value)));

  for (let i = 0, p = 0; i < total; i += 1, p += 4) {
    const y = Math.floor(i / width);
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const a = data[p + 3];
    if (a <= 0) continue;

    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    grayValues[i] = gray;

    const maxRgb = Math.max(r, g, b);
    const minRgb = Math.min(r, g, b);
    const sat = maxRgb > 0 ? (maxRgb - minRgb) / maxRgb : 0;
    const isRedMark = r >= 86 && r > g * 1.1 && r > b * 1.1 && sat >= 0.15;
    const isBlueMark = b >= 80 && b > r * 1.08 && b > g * 1.02 && sat >= 0.14;
    if (isRedMark || isBlueMark) colorMask[i] = 1;
    if (gray < 140) darkRowCount[y] += 1;
  }

  const darkRowDensity = Array.from(darkRowCount, (count) => count / Math.max(1, width));
  const textRowMask = buildTextRowMask(darkRowDensity, height);

  const hiddenSet = new Set(hiddenIds);

  const markErasablePixel = (idx, element, ringGray) => {
    const gray = grayValues[idx];
    const isColor = colorMask[idx] === 1;
    const y = Math.floor(idx / width);
    const aspect = element.width / Math.max(1, element.height);
    const isStrokeLikeElement = (
      aspect >= 4.2
      || aspect <= 0.26
      || element.width >= width * 0.1
      || element.height >= height * 0.04
    );

    const isDarkInk = gray <= Math.max(128, ringGray - 20);
    const isContrastInk = gray <= Math.max(160, ringGray - 14);
    const isForeground = isColor || isDarkInk || (isContrastInk && ringGray >= 182);
    if (!isForeground) return;

    if (mode === "handwriting" && protectTextRows && textRowMask[y] && !isColor) {
      const isStrongPenStroke = gray <= 88 && isStrokeLikeElement;
      if (!isStrongPenStroke) {
        protectedMask[idx] = 1;
        return;
      }
    }

    eraseMask[idx] = 1;
  };

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
    const ringGray = Math.round((baseR + baseG + baseB) / 3);

    if (Array.isArray(element.pixelIndices) && element.pixelIndices.length) {
      for (const pixel of element.pixelIndices) {
        if (pixel < 0 || pixel >= total) continue;
        const py = Math.floor(pixel / width);
        const px = pixel % width;
        if (px < x || px >= x + w || py < y || py >= y + h) continue;
        markErasablePixel(pixel, element, ringGray);
      }
      continue;
    }

    for (let py = y; py < y + h; py += 1) {
      for (let px = x; px < x + w; px += 1) {
        const idx = py * width + px;
        markErasablePixel(idx, element, ringGray);
      }
    }
  }

  let totalTextInk = 0;
  let erasedTextInk = 0;
  let protectedPixels = 0;
  let erasedCandidates = 0;
  for (let idx = 0; idx < total; idx += 1) {
    const y = Math.floor(idx / width);
    const gray = grayValues[idx];
    if (protectTextRows && protectedMask[idx]) {
      protectedPixels += 1;
      eraseMask[idx] = 0;
    }
    const isPrintedInkPixel = textRowMask[y] && !colorMask[idx] && gray < 170;
    if (isPrintedInkPixel) {
      totalTextInk += 1;
      if (eraseMask[idx]) erasedTextInk += 1;
    }
    if (eraseMask[idx]) erasedCandidates += 1;
  }

  if (mode === "handwriting" && totalTextInk > 0) {
    const riskyRatio = erasedTextInk / totalTextInk;
    if (riskyRatio > 0.08) {
      throw new Error('自动去手写触发保护：疑似会误删题干，请改用"背景置白 + 手动框选"');
    }
  }

  if (!erasedCandidates) {
    return {
      dataUrl: imageUrl,
      removedPixels: 0,
      protectedPixels,
    };
  }

  const visited = new Uint8Array(total);
  let removedPixels = 0;
  for (let idx = 0; idx < total; idx += 1) {
    if (!eraseMask[idx] || visited[idx]) continue;

    const stack = [idx];
    const pixels = [];
    visited[idx] = 1;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    while (stack.length) {
      const current = stack.pop();
      const y = Math.floor(current / width);
      const x = current % width;
      pixels.push(current);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      const left = x > 0 ? current - 1 : -1;
      const right = x + 1 < width ? current + 1 : -1;
      const up = y > 0 ? current - width : -1;
      const down = y + 1 < height ? current + width : -1;
      if (left >= 0 && eraseMask[left] && !visited[left]) {
        visited[left] = 1;
        stack.push(left);
      }
      if (right >= 0 && eraseMask[right] && !visited[right]) {
        visited[right] = 1;
        stack.push(right);
      }
      if (up >= 0 && eraseMask[up] && !visited[up]) {
        visited[up] = 1;
        stack.push(up);
      }
      if (down >= 0 && eraseMask[down] && !visited[down]) {
        visited[down] = 1;
        stack.push(down);
      }
    }

    const ringGap = Math.max(1, Math.round(Math.min(maxX - minX + 1, maxY - minY + 1) * 0.08));
    const ringLeft = Math.max(0, minX - ringGap);
    const ringTop = Math.max(0, minY - ringGap);
    const ringRight = Math.min(width - 1, maxX + ringGap);
    const ringBottom = Math.min(height - 1, maxY + ringGap);

    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let count = 0;
    for (let py = ringTop; py <= ringBottom; py += 1) {
      for (let px = ringLeft; px <= ringRight; px += 1) {
        const pixel = py * width + px;
        if (eraseMask[pixel]) continue;
        const p = pixel * 4;
        sumR += data[p];
        sumG += data[p + 1];
        sumB += data[p + 2];
        count += 1;
      }
    }

    const baseR = count ? Math.round(sumR / count) : 248;
    const baseG = count ? Math.round(sumG / count) : 248;
    const baseB = count ? Math.round(sumB / count) : 248;
    const targetR = Math.max(baseR, 232);
    const targetG = Math.max(baseG, 232);
    const targetB = Math.max(baseB, 232);

    for (const pixel of pixels) {
      const p = pixel * 4;
      const py = Math.floor(pixel / width);
      const px = pixel % width;
      const noise = ((px * 17 + py * 31) % 7) - 3;
      data[p] = clampByte(targetR + noise);
      data[p + 1] = clampByte(targetG + noise);
      data[p + 2] = clampByte(targetB + noise);
      data[p + 3] = 255;
      removedPixels += 1;
    }
  }

  context.putImageData(imageData, 0, 0);
  return {
    dataUrl: canvas.toDataURL("image/png"),
    removedPixels,
    protectedPixels,
  };
}
