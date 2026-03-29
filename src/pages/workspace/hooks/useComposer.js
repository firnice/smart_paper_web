import { useCallback, useRef, useState } from "react";
import { getDefaultSchoolTerm } from "../../../services/studentDemo.js";
import {
  analyzeQuestion,
  createWrongQuestion,
  extractQuestions,
  generateDiagramCrop,
  generateDiagramSvg,
  listSubjects,
} from "../../../services/api.js";
import {
  buildDiagramReplacementDataUrl,
  compressImage,
  cropDataUrlBySourceRect,
  dataUrlToFile,
  detectHandwritingElements,
  detectScanElements,
  eraseSelectedElements,
  isLikelyHeicFile,
  loadImageFromDataUrl,
  normalizeOcrImageUrl,
  normalizeOcrItems,
  normalizeTextForCard,
} from "../../../utils/imageProcessing.js";
import {
  INITIAL_FORM,
  PAPER_ZOOM_MIN,
  PAPER_ZOOM_MAX,
  createElementEditorInitial,
} from "../constants.js";

export default function useComposer({ studentId, profile, subjectOptions, categoryOptions, errorReasonOptions, refresh, setSuccess, setFailure }) {
  const cameraInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const paperImageRef = useRef(null);
  const cropImageRef = useRef(null);
  const elementStageRef = useRef(null);
  const latestImageFileRef = useRef(null);
  const lastAnalyzedTextRef = useRef("");

  const [form, setForm] = useState(INITIAL_FORM);
  const [composerMode, setComposerMode] = useState("camera");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [originalImageData, setOriginalImageData] = useState("");
  const [paperImageMetrics, setPaperImageMetrics] = useState({ width: 0, height: 0 });
  const [paperZoom, setPaperZoom] = useState(1);
  const [recognitionScope, setRecognitionScope] = useState("manual_question");
  const [isSelectingPaper, setIsSelectingPaper] = useState(false);
  const [paperSelectionStart, setPaperSelectionStart] = useState(null);
  const [paperSelectionRect, setPaperSelectionRect] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState(null);
  const [cropRect, setCropRect] = useState(null);
  const [ocrStatus, setOcrStatus] = useState("idle");
  const [ocrItems, setOcrItems] = useState([]);
  const [ocrError, setOcrError] = useState("");
  const [selectedOcrId, setSelectedOcrId] = useState(null);
  const [diagramRenderMode, setDiagramRenderMode] = useState("llm_svg");
  const [diagramRequestKey, setDiagramRequestKey] = useState("");
  const [sourceImageSnapshot, setSourceImageSnapshot] = useState({ data: "", name: "" });
  const [elementEditor, setElementEditor] = useState(() => createElementEditorInitial());
  const [elementDraftStart, setElementDraftStart] = useState(null);
  const [elementDraftRect, setElementDraftRect] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetPaperSelection = () => {
    setIsSelectingPaper(false);
    setPaperSelectionStart(null);
    setPaperSelectionRect(null);
  };

  const resetPaperViewport = () => {
    setPaperImageMetrics({ width: 0, height: 0 });
    setPaperZoom(1);
    resetPaperSelection();
  };

  const resetElementEditor = () => {
    setElementEditor(createElementEditorInitial());
    setElementDraftStart(null);
    setElementDraftRect(null);
  };

  const updatePaperZoom = (nextZoom) => {
    setPaperZoom(Math.max(PAPER_ZOOM_MIN, Math.min(PAPER_ZOOM_MAX, nextZoom)));
    resetPaperSelection();
  };

  const patchOcrItem = (itemId, patch) => {
    setOcrItems((prev) =>
      prev.map((entry) => {
        if (entry.id !== itemId) return entry;
        const merged = { ...entry, ...patch };
        return {
          ...merged,
          hasImage: Boolean(
            merged.hasImage
            || merged.questionImageUrl
            || merged.diagramImageUrl
            || merged.diagramLocalImageUrl
            || merged.diagramLlmImageUrl
            || merged.diagramSvgUrl,
          ),
        };
      }),
    );
  };

  const runQuestionAnalysis = (questionText) => {
    if (!questionText) return;
    if (questionText === lastAnalyzedTextRef.current) return;
    lastAnalyzedTextRef.current = questionText;
    setAnalyzing(true);
    analyzeQuestion({
      question_text: questionText,
      grade: profile.grade || "",
    })
      .then((result) => {
        if (!result) return;
        setForm((prev) => ({
          ...prev,
          subject: result.subject || prev.subject,
          category: result.category || prev.category,
          error_reason: result.error_reason || prev.error_reason,
          title: result.title || prev.title,
        }));
      })
      .catch(() => {})
      .finally(() => {
        setAnalyzing(false);
      });
  };

  const applyOcrTextOnly = (item) => {
    if (!item) return;
    const normalizedText = normalizeTextForCard(item.text);
    const baseTitle = `第${item.id}题`;
    setSelectedOcrId(item.id);
    setForm((prev) => ({
      ...prev,
      title: prev.title || baseTitle,
      content: normalizedText || prev.content,
    }));
    runQuestionAnalysis(normalizedText);
  };

  const onOpenComposer = () => {
    setComposerMode("camera");
    setRecognitionScope("manual_question");
    resetPaperViewport();
    resetElementEditor();
    setIsComposerOpen(true);
  };

  const onCloseComposer = () => {
    resetPaperViewport();
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
    setSourceImageSnapshot({ data: "", name: "" });
    setRecognitionScope("manual_question");
    resetPaperViewport();
    setIsCropping(false);
    setCropStart(null);
    setCropRect(null);
    setOcrStatus("idle");
    setOcrItems([]);
    setOcrError("");
    setSelectedOcrId(null);
    resetElementEditor();
    latestImageFileRef.current = null;
    lastAnalyzedTextRef.current = "";
  };

  const onApplyOcrItem = async (item, silent = false, mode = diagramRenderMode) => {
    if (!item) return false;
    let resolvedItem = item;
    const normalizedText = normalizeTextForCard(item.text);
    const baseTitle = `第${item.id}题`;

    setDiagramRenderMode(mode);
    setCropRect(null);
    setIsCropping(false);
    setCropStart(null);

    if (mode === "llm_svg") {
      if (!resolvedItem.diagramSvgUrl) {
        setDiagramRequestKey(`${item.id}:${mode}`);
        try {
          const response = await generateDiagramSvg({
            item_id: item.id,
            question_text: item.text || "",
            question_image_url: item.questionImageUrl || "",
            diagram_image_url: item.diagramLocalImageUrl || item.diagramImageUrl || "",
          });
          const diagramSvgUrl = normalizeOcrImageUrl(response?.diagram_svg_url);
          if (diagramSvgUrl) {
            resolvedItem = { ...resolvedItem, diagramSvgUrl };
            patchOcrItem(item.id, { diagramSvgUrl });
          }
        } catch (err) {
          console.error("generateDiagramSvg failed", err);
        } finally {
          setDiagramRequestKey("");
        }
      }

      const imageDataUrl = resolvedItem.diagramSvgUrl || buildDiagramReplacementDataUrl(item.text, item.id);
      setSelectedOcrId(resolvedItem.id);
      setForm((prev) => ({
        ...prev,
        title: prev.title || baseTitle,
        content: normalizedText || prev.content,
        image_data: imageDataUrl,
        image_name: resolvedItem.diagramSvgUrl ? `llm-diagram-q${item.id}.svg` : `generated-diagram-q${item.id}.svg`,
      }));
      setOriginalImageData(imageDataUrl);
      if (!silent) {
        setSuccess(
          resolvedItem.diagramSvgUrl
            ? `已应用第 ${item.id} 题：使用后端 LLM 生成 SVG 图示`
            : `已应用第 ${item.id} 题：使用本地模板生成 SVG 图示（后端未返回SVG）`,
        );
      }
      runQuestionAnalysis(normalizedText);
      return true;
    }

    if (mode === "llm_crop") {
      if (!resolvedItem.diagramLlmImageUrl) {
        setDiagramRequestKey(`${item.id}:${mode}`);
        try {
          const response = await generateDiagramCrop({
            item_id: item.id,
            question_text: item.text || "",
            question_image_url: item.questionImageUrl || "",
          });
          const diagramLlmImageUrl = normalizeOcrImageUrl(response?.diagram_llm_image_url);
          if (diagramLlmImageUrl) {
            resolvedItem = { ...resolvedItem, diagramLlmImageUrl };
            patchOcrItem(item.id, { diagramLlmImageUrl });
          }
        } catch (err) {
          if (!silent) {
            setFailure(err?.message || `第 ${item.id} 题图示抠图生成失败`);
          }
          return false;
        } finally {
          setDiagramRequestKey("");
        }
      }

      const llmCropUrl = resolvedItem.diagramLlmImageUrl;
      if (!llmCropUrl) {
        if (!silent) {
          setFailure(`第 ${item.id} 题没有可用图示抠图，请切换到"原图抠图"或"LLM生成SVG"`);
        }
        return false;
      }
      setSelectedOcrId(resolvedItem.id);
      setForm((prev) => ({
        ...prev,
        title: prev.title || baseTitle,
        content: normalizedText || prev.content,
        image_data: llmCropUrl,
        image_name: `ocr-diagram-q${item.id}.png`,
      }));
      setOriginalImageData(llmCropUrl);
      if (!silent) {
        setSuccess(`已应用第 ${item.id} 题：使用 LLM 识别抠图`);
      }
      runQuestionAnalysis(normalizedText);
      return true;
    }

    const sourceImageData = item.questionImageUrl || item.diagramImageUrl || sourceImageSnapshot.data || "";
    const sourceImageName =
      (item.questionImageUrl ? `ocr-question-q${item.id}.png` : item.diagramImageUrl ? `ocr-diagram-q${item.id}.png` : "")
      || sourceImageSnapshot.name;
    setSelectedOcrId(item.id);
    setForm((prev) => ({
      ...prev,
      title: prev.title || baseTitle,
      content: normalizedText || prev.content,
      image_data: sourceImageData || prev.image_data,
      image_name: sourceImageName || prev.image_name,
    }));
    setOriginalImageData(sourceImageData || "");

    if (!silent) {
      setSuccess(`已应用第 ${item.id} 题：进入原图抠图模式（可继续精修）`);
    }
    runQuestionAnalysis(normalizedText);
    return true;
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
      return { ...prev, hiddenIds: Array.from(hiddenSet) };
    });
  };

  const onMarkAllElements = () => {
    setElementEditor((prev) => ({ ...prev, hiddenIds: prev.elements.map((element) => element.id) }));
  };

  const onClearElementMarks = () => {
    setElementEditor((prev) => ({ ...prev, hiddenIds: [] }));
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
      const erased = await eraseSelectedElements(
        elementEditor.sourceImage,
        elementEditor.elements,
        elementEditor.hiddenIds,
      );
      const cleaned = erased.dataUrl;
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
      setSuccess(
        erased.removedPixels > 0
          ? `已删除 ${elementEditor.hiddenIds.length} 个元素，擦除 ${erased.removedPixels} 个像素`
          : "已执行删除，但当前区域未检测到可擦除内容",
      );
    } catch (err) {
      setElementEditor((prev) => ({ ...prev, loading: false, error: err?.message || "应用删除失败" }));
      setFailure(err?.message || "应用删除失败");
    }
  };

  const buildRecognitionTarget = async () => {
    const file = latestImageFileRef.current;
    if (!file || !String(file.type || "").startsWith("image/")) {
      throw new Error("请先上传试卷图片");
    }

    if (recognitionScope === "full_page" || !sourceImageSnapshot.data) {
      return { file, label: sourceImageSnapshot.data ? "整张试卷" : "整张图片" };
    }

    if (!paperSelectionRect) {
      throw new Error("请先在卷面上框选一道题");
    }
    if (!paperImageMetrics.width || !paperImageMetrics.height) {
      throw new Error("卷面预览尚未完成，请稍后再试");
    }

    const croppedDataUrl = await cropDataUrlBySourceRect(sourceImageSnapshot.data, paperSelectionRect);
    const baseName = String(file.name || "paper").replace(/\.[^.]+$/, "");
    const croppedFile = await dataUrlToFile(croppedDataUrl, `${baseName}-selection.png`);
    return { file: croppedFile, label: "选中题目区域" };
  };

  const onRunRealOcr = async () => {
    let target;
    try {
      target = await buildRecognitionTarget();
    } catch (err) {
      setFailure(err?.message || "当前无法开始识别");
      return;
    }

    resetElementEditor();
    setOcrStatus("loading");
    setOcrError("");
    setOcrItems([]);
    setSelectedOcrId(null);
    setDiagramRequestKey("");
    setForm((prev) => ({
      ...INITIAL_FORM,
      subject: prev.subject,
      term: prev.term,
      category: prev.category,
      error_reason: prev.error_reason,
    }));
    setOriginalImageData("");
    setCropRect(null);
    setIsCropping(false);
    setCropStart(null);

    try {
      const response = await extractQuestions(target.file);
      const items = normalizeOcrItems(response?.items);
      if (!items.length) {
        setOcrStatus("empty");
        setSuccess(`${target.label}识别完成，但未提取到题目，请手动填写`);
        return;
      }

      setOcrItems(items);
      setOcrStatus("success");
      if (items.length === 1) {
        applyOcrTextOnly(items[0]);
        setSuccess(`识别完成：${target.label}已提取 1 题，可继续生成 SVG 或手动调整后保存`);
      } else {
        setSuccess(`识别完成：${target.label}共提取 ${items.length} 题，请先载入要处理的一题`);
      }
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
        setDiagramRequestKey("");
        resetElementEditor();
        resetPaperViewport();
        setRecognitionScope("manual_question");

        try {
          const compressed = await compressImage(file);
          setForm((prev) => ({
            ...INITIAL_FORM,
            subject: prev.subject,
            term: prev.term,
            category: prev.category,
            error_reason: prev.error_reason,
          }));
          setSourceImageSnapshot({ data: compressed, name: file.name });
          setOriginalImageData("");
          setCropRect(null);
          setIsCropping(false);
          setCropStart(null);
          setSuccess(`已通过${sourceLabel}载入试卷，请先框选一道题或切换为整张识别，再手动开始识别`);
        } catch {
          setForm((prev) => ({
            ...INITIAL_FORM,
            subject: prev.subject,
            term: prev.term,
            category: prev.category,
            error_reason: prev.error_reason,
            image_data: "",
            image_name: file.name,
            content: "",
          }));
          setSourceImageSnapshot({ data: "", name: file.name });
          setOriginalImageData("");
          setCropRect(null);
          setIsCropping(false);
          setCropStart(null);
          setRecognitionScope("full_page");
          if (isLikelyHeicFile(file)) {
            setSuccess(`已通过${sourceLabel}载入 HEIC 图片，但当前浏览器无法预览，可直接点击"整张识别"手动开始识别。`);
          } else {
            setSuccess(`已通过${sourceLabel}载入图片，但当前浏览器暂不支持预览，可直接点击"整张识别"手动开始识别。`);
          }
        }
      } else {
        setForm((prev) => ({
          ...prev,
          image_data: "",
          image_name: file.name,
          content: prev.content || `已上传附件：${file.name}`,
        }));
        setSourceImageSnapshot({ data: "", name: file.name });
        setOriginalImageData("");
        setCropRect(null);
        setIsCropping(false);
        setCropStart(null);
        setOcrStatus("idle");
        setOcrItems([]);
        setOcrError("");
        setSelectedOcrId(null);
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

  const persistWrongQuestion = async (keepSource = false) => {
    if (!studentId) return;

    setLoading(true);
    try {
      const matchedSubject = subjectOptions.find((item) => item === form.subject);
      const subjectsRes = await listSubjects({ limit: 100 });
      const subject = (subjectsRes?.items || []).find((item) => item.name === (matchedSubject || form.subject));
      const category = categoryOptions.find((item) => item.name === form.category);
      const selectedReasons = errorReasonOptions
        .filter((item) => item.name === form.error_reason || form.error_reason.split(/\s*\/\s*/).includes(item.name))
        .filter((item) => !category || !item.category_id || item.category_id === category.id);

      await createWrongQuestion({
        student_id: Number(studentId),
        title: form.title || undefined,
        content: form.content,
        subject_id: subject?.id,
        grade: profile.grade || undefined,
        difficulty: form.difficulty,
        category_id: category?.id,
        error_reason_ids: selectedReasons.map((item) => item.id),
        status: "new",
        source: "manual",
        notes: form.image_name ? `原始附件：${form.image_name}` : undefined,
        image_url: form.image_data || undefined,
        image_name: form.image_name || undefined,
      });

      setForm((prev) => ({
        ...INITIAL_FORM,
        subject: prev.subject,
        term: prev.term,
        category: prev.category,
        error_reason: prev.error_reason,
      }));
      setOriginalImageData("");
      setCropRect(null);
      setIsCropping(false);
      setCropStart(null);
      setOcrStatus("idle");
      setOcrItems([]);
      setOcrError("");
      setSelectedOcrId(null);
      setDiagramRequestKey("");
      resetElementEditor();
      resetPaperViewport();
      setRecognitionScope("manual_question");
      if (!keepSource) {
        setIsComposerOpen(false);
        setSourceImageSnapshot({ data: "", name: "" });
        latestImageFileRef.current = null;
      }
      await refresh();
      setSuccess(keepSource ? "错题已加入错题本，可继续框选下一题" : "错题已加入错题本");
    } catch (err) {
      setFailure(err?.message || "新增错题失败");
    } finally {
      setLoading(false);
    }
  };

  const onAddWrongQuestion = async (event) => {
    event.preventDefault();
    await persistWrongQuestion(false);
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
      const erased = await eraseSelectedElements(form.image_data, detected.elements, allIds, {
        mode: "handwriting",
        protectTextRows: true,
      });
      if (!erased.removedPixels) {
        setSuccess("自动去手写未找到可安全擦除像素，已保留原图，请改用手动框选精修");
        return;
      }

      const cleaned = erased.dataUrl;
      setOriginalImageData((prev) => prev || form.image_data);
      setForm((prev) => ({
        ...prev,
        image_data: cleaned,
        image_name: prev.image_name ? `clean-hand-${prev.image_name.replace(/^clean-hand-/, "")}` : "clean-handwriting.png",
      }));
      setCropRect(null);
      setSuccess(
        `已自动去除 ${detected.elements.length} 处手写标记（擦除 ${erased.removedPixels} 像素，保护 ${erased.protectedPixels} 像素）`,
      );
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

  // Paper mouse events
  const getPaperImageDisplayMetrics = () => {
    const imageEl = paperImageRef.current;
    if (!imageEl || !paperImageMetrics.width || !paperImageMetrics.height) return null;
    const rect = imageEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return { rect, displayWidth: rect.width, displayHeight: rect.height, sourceWidth: paperImageMetrics.width, sourceHeight: paperImageMetrics.height };
  };

  const getPointInPaperImage = (event) => {
    const metrics = getPaperImageDisplayMetrics();
    if (!metrics) return null;
    const { rect, displayWidth, displayHeight, sourceWidth, sourceHeight } = metrics;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > displayWidth || y > displayHeight) return null;
    return {
      displayX: x,
      displayY: y,
      sourceX: Math.max(0, Math.min(sourceWidth, Math.round((x / displayWidth) * sourceWidth))),
      sourceY: Math.max(0, Math.min(sourceHeight, Math.round((y / displayHeight) * sourceHeight))),
    };
  };

  const onPaperMouseDown = (event) => {
    if (!sourceImageSnapshot.data || recognitionScope !== "manual_question") return;
    const point = getPointInPaperImage(event);
    if (!point) return;
    event.preventDefault();
    setIsSelectingPaper(true);
    setPaperSelectionStart({ x: point.sourceX, y: point.sourceY });
    setPaperSelectionRect({ x: point.sourceX, y: point.sourceY, width: 0, height: 0 });
  };

  const onPaperMouseMove = (event) => {
    if (!isSelectingPaper || !paperSelectionStart) return;
    const point = getPointInPaperImage(event);
    if (!point) return;
    const left = Math.min(paperSelectionStart.x, point.sourceX);
    const top = Math.min(paperSelectionStart.y, point.sourceY);
    const width = Math.abs(paperSelectionStart.x - point.sourceX);
    const height = Math.abs(paperSelectionStart.y - point.sourceY);
    setPaperSelectionRect({ x: left, y: top, width, height });
  };

  const onPaperMouseUp = () => {
    if (!isSelectingPaper) return;
    setIsSelectingPaper(false);
    setPaperSelectionStart(null);
    setPaperSelectionRect((prev) => {
      if (!prev) return null;
      if (prev.width < 12 || prev.height < 12) return null;
      return prev;
    });
  };

  // Crop mouse events
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

  // Element stage mouse events
  const getPointInElementStage = (event) => {
    const stageEl = elementStageRef.current;
    if (!stageEl || !elementEditor.imageWidth || !elementEditor.imageHeight) return null;
    const rect = stageEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const viewX = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const viewY = Math.max(0, Math.min(event.clientY - rect.top, rect.height));
    const imageX = Math.max(0, Math.min(elementEditor.imageWidth, Math.round((viewX / rect.width) * elementEditor.imageWidth)));
    const imageY = Math.max(0, Math.min(elementEditor.imageHeight, Math.round((viewY / rect.height) * elementEditor.imageHeight)));
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
    setSuccess('已新增删除框，点击"应用删除到图片"后生效');
  };

  const canRunRecognition = Boolean(
    latestImageFileRef.current
    && (
      recognitionScope === "full_page"
      || !sourceImageSnapshot.data
      || paperSelectionRect
    ),
  );

  const paperZoomPercent = `${Math.round(paperZoom * 100)}%`;

  const paperSelectionDisplayRect = (() => {
    const imageEl = paperImageRef.current;
    if (!paperSelectionRect || !imageEl || !paperImageMetrics.width || !paperImageMetrics.height) {
      return null;
    }
    const displayWidth = imageEl.clientWidth;
    const displayHeight = imageEl.clientHeight;
    if (!displayWidth || !displayHeight) return null;
    return {
      x: (paperSelectionRect.x / paperImageMetrics.width) * displayWidth,
      y: (paperSelectionRect.y / paperImageMetrics.height) * displayHeight,
      width: (paperSelectionRect.width / paperImageMetrics.width) * displayWidth,
      height: (paperSelectionRect.height / paperImageMetrics.height) * displayHeight,
    };
  })();

  return {
    // Refs
    cameraInputRef,
    photoInputRef,
    uploadInputRef,
    paperImageRef,
    cropImageRef,
    elementStageRef,
    // State
    form,
    setForm,
    composerMode,
    setComposerMode,
    isComposerOpen,
    setIsComposerOpen,
    originalImageData,
    paperImageMetrics,
    setPaperImageMetrics,
    paperZoom,
    recognitionScope,
    setRecognitionScope,
    paperSelectionRect,
    cropRect,
    ocrStatus,
    ocrItems,
    ocrError,
    selectedOcrId,
    diagramRenderMode,
    diagramRequestKey,
    sourceImageSnapshot,
    elementEditor,
    elementDraftRect,
    analyzing,
    loading,
    // Computed
    canRunRecognition,
    paperZoomPercent,
    paperSelectionDisplayRect,
    // Actions
    onOpenComposer,
    onCloseComposer,
    onTriggerPick,
    onRemovePhoto,
    onApplyOcrItem,
    applyOcrTextOnly,
    onOpenElementEditor,
    onToggleElementHidden,
    onMarkAllElements,
    onClearElementMarks,
    onApplyElementErase,
    onRunRealOcr,
    onPickCamera,
    onPickPhoto,
    onPickUpload,
    persistWrongQuestion,
    onAddWrongQuestion,
    onApplyCrop,
    onWhitenBackground,
    onAutoRemoveHandwriting,
    onRestoreOriginalImage,
    updatePaperZoom,
    resetPaperSelection,
    resetElementEditor,
    // Paper events
    onPaperMouseDown,
    onPaperMouseMove,
    onPaperMouseUp,
    // Crop events
    onCropMouseDown,
    onCropMouseMove,
    onCropMouseUp,
    // Element stage events
    onElementStageMouseDown,
    onElementStageMouseMove,
    onElementStageMouseUp,
  };
}
