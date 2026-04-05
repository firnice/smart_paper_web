import { useRef, useState } from "react";
import { getDefaultSchoolTerm } from "../../../services/studentDemo.js";
import {
  analyzeQuestion,
  createWrongQuestion,
  extractQuestions,
  generateDiagramSvg,
  listSubjects,
} from "../../../services/api.js";
import {
  buildDiagramReplacementDataUrl,
  compressImage,
  cropDataUrlBySourceRect,
  dataUrlToFile,
  loadImageFromDataUrl,
  normalizeOcrImageUrl,
  normalizeOcrItems,
  normalizeTextForCard,
  rotateImageDataUrl,
} from "../../../utils/imageProcessing.js";

const DEFAULT_PAPER_CROP = { x: 18, y: 20, w: 60, h: 28 };
const DEFAULT_SVG_CROP = { x: 24, y: 24, w: 36, h: 28 };
const GRADE_OPTIONS = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"];

function getErrorMessage(error) {
  return String(error?.message || error || "操作失败");
}

function isBackendUnavailable(message) {
  return /无法连接后端服务|failed to fetch|networkerror|not found|404/i.test(String(message || ""));
}

function buildDefaultPrompt(questionText, questionId) {
  const snippet = normalizeTextForCard(questionText).split("\n")[0]?.slice(0, 48) || `第 ${questionId} 题`;
  return `根据题目内容“${snippet}”生成一张清晰、规范、适合打印的 SVG 配图，保留关键几何关系或坐标信息。`;
}

function buildQuestionTitle(questionText, questionId) {
  const firstLine = normalizeTextForCard(questionText).split("\n")[0] || "";
  const cleaned = firstLine.replace(/^\d+[\.\)、]\s*/, "").trim();
  return cleaned.slice(0, 28) || `第${questionId}题`;
}

function createDemoRecognitionItems() {
  return [
    {
      id: 1,
      text: "1. 已知函数 f(x)=x²-2x+1，求 f(3) 的值。",
      questionImageUrl: "",
      diagramImageUrl: "",
      diagramLocalImageUrl: "",
      diagramSvgUrl: "",
    },
    {
      id: 2,
      text: "2. 如图所示，在△ABC 中，AB=AC，∠A=36°，求∠B 的度数，并写出解题过程。",
      questionImageUrl: "",
      diagramImageUrl: "",
      diagramLocalImageUrl: "",
      diagramSvgUrl: "",
    },
    {
      id: 3,
      text: "3. 解方程：2x + 5 = 15。",
      questionImageUrl: "",
      diagramImageUrl: "",
      diagramLocalImageUrl: "",
      diagramSvgUrl: "",
    },
  ];
}

function resolveImageName(question, sourceName) {
  if (question.svgStatus === "generated") {
    return question.svgPreviewUrl?.startsWith("data:image/svg+xml")
      ? `q${question.id}-diagram.svg`
      : `q${question.id}-diagram.png`;
  }
  if (question.questionImageUrl || question.diagramImageUrl) {
    return `q${question.id}-source.png`;
  }
  return sourceName || `q${question.id}-paper.png`;
}

export default function useComposer({
  studentId,
  profile,
  subjectOptions,
  categoryOptions,
  errorReasonOptions,
  refresh,
  setSuccess,
  setFailure,
}) {
  const uploadInputRef = useRef(null);

  const [form, setForm] = useState({ term: "" });
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [sourceImage, setSourceImage] = useState({
    data: "",
    name: "",
    width: 0,
    height: 0,
  });
  const [paperCrop, setPaperCrop] = useState(DEFAULT_PAPER_CROP);
  const [isRotatingPaper, setIsRotatingPaper] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizeError, setRecognizeError] = useState("");
  const [lastRecognitionMode, setLastRecognitionMode] = useState("selection");
  const [questions, setQuestions] = useState([]);
  const [expandedPaperId, setExpandedPaperId] = useState(null);
  const [expandedPromptId, setExpandedPromptId] = useState(null);
  const [croppingSvgId, setCroppingSvgId] = useState(null);
  const [saveState, setSaveState] = useState({
    status: "idle",
    error: "",
    savedCount: 0,
    total: 0,
  });

  const resetComposerState = () => {
    setStep(1);
    setSourceImage({ data: "", name: "", width: 0, height: 0 });
    setPaperCrop(DEFAULT_PAPER_CROP);
    setIsRotatingPaper(false);
    setIsRecognizing(false);
    setRecognizeError("");
    setLastRecognitionMode("selection");
    setQuestions([]);
    setExpandedPaperId(null);
    setExpandedPromptId(null);
    setCroppingSvgId(null);
    setSaveState({ status: "idle", error: "", savedCount: 0, total: 0 });
  };

  const onOpenComposer = () => {
    resetComposerState();
    setIsComposerOpen(true);
  };

  const onCloseComposer = () => {
    resetComposerState();
    setIsComposerOpen(false);
  };

  const onTriggerUpload = () => {
    uploadInputRef.current?.click();
  };

  const onUseFile = async (file) => {
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) {
      setFailure("当前弹窗仅支持上传试卷图片");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setFailure("文件过大，请选择 12MB 以内图片");
      return;
    }

    try {
      const compressedData = await compressImage(file);
      const image = await loadImageFromDataUrl(compressedData);
      setSourceImage({
        data: compressedData,
        name: file.name || "paper-image.jpg",
        width: image.width,
        height: image.height,
      });
      setPaperCrop(DEFAULT_PAPER_CROP);
      setQuestions([]);
      setExpandedPaperId(null);
      setExpandedPromptId(null);
      setCroppingSvgId(null);
      setRecognizeError("");
      setSaveState({ status: "idle", error: "", savedCount: 0, total: 0 });
      setStep(2);
      setSuccess("试卷图片已加载，可以直接框选题目或识别整页");
    } catch (error) {
      setFailure(getErrorMessage(error) || "图片处理失败");
    }
  };

  const onPickUpload = async (event) => {
    const file = event.target.files?.[0];
    await onUseFile(file);
    event.target.value = "";
  };

  const buildRecognitionFile = async (mode) => {
    if (!sourceImage.data) {
      throw new Error("请先上传试卷图片");
    }

    if (mode === "full_page") {
      return dataUrlToFile(sourceImage.data, sourceImage.name || "paper-image.jpg");
    }

    const sourceRect = {
      x: Math.round((paperCrop.x / 100) * sourceImage.width),
      y: Math.round((paperCrop.y / 100) * sourceImage.height),
      width: Math.round((paperCrop.w / 100) * sourceImage.width),
      height: Math.round((paperCrop.h / 100) * sourceImage.height),
    };
    const croppedDataUrl = await cropDataUrlBySourceRect(sourceImage.data, sourceRect);
    const baseName = String(sourceImage.name || "paper-image").replace(/\.[^.]+$/, "");
    return dataUrlToFile(croppedDataUrl, `${baseName}-selection.png`);
  };

  const enrichQuestions = async (ocrItems) => {
    const analysisResults = await Promise.allSettled(
      ocrItems.map((item) =>
        item.text
          ? analyzeQuestion({
            question_text: item.text,
            grade: profile.grade || "",
          })
          : Promise.resolve(null),
      ),
    );

    return ocrItems.map((item, index) => {
      const analysis = analysisResults[index]?.status === "fulfilled" ? analysisResults[index].value : null;
      const questionId = Number(item.id) || index + 1;
      return {
        id: questionId,
        ocrItemId: questionId,
        text: normalizeTextForCard(item.text) || `第${questionId}题`,
        subject: analysis?.subject || subjectOptions[0] || "数学",
        grade: profile.grade || "三年级",
        errorType: analysis?.category || categoryOptions[0]?.name || "计算错误",
        reason: analysis?.error_reason || errorReasonOptions[0]?.name || "粗心抄错",
        selected: true,
        prompt: buildDefaultPrompt(item.text, questionId),
        svgStatus: item.diagramSvgUrl ? "generated" : "none",
        svgPreviewUrl: item.diagramSvgUrl || "",
        questionImageUrl: item.questionImageUrl || "",
        diagramImageUrl: item.diagramLocalImageUrl || item.diagramImageUrl || "",
        svgCrop: DEFAULT_SVG_CROP,
      };
    });
  };

  const onRecognize = async (mode) => {
    setIsRecognizing(true);
    setRecognizeError("");
    setLastRecognitionMode(mode);
    setExpandedPaperId(null);
    setExpandedPromptId(null);

    try {
      const file = await buildRecognitionFile(mode);
      let items = [];
      let isDemoFallback = false;

      try {
        const response = await extractQuestions(file);
        items = normalizeOcrItems(response?.items);
      } catch (error) {
        const message = getErrorMessage(error);
        if (!isBackendUnavailable(message)) {
          throw error;
        }
        items = createDemoRecognitionItems();
        isDemoFallback = true;
      }

      if (!items.length) {
        items = createDemoRecognitionItems();
        isDemoFallback = true;
      }

      const nextQuestions = await enrichQuestions(items);
      setQuestions(nextQuestions);
      setStep(3);
      if (isDemoFallback) {
        setSuccess("识别接口尚未接通，当前先使用前端演示题目结果");
      } else {
        setSuccess(`识别完成，共提取 ${nextQuestions.length} 道题`);
      }
    } catch (error) {
      setRecognizeError(getErrorMessage(error) || "识别失败");
    } finally {
      setIsRecognizing(false);
    }
  };

  const onRotatePaper = async (direction) => {
    if (!sourceImage.data || isRotatingPaper) return;

    setIsRotatingPaper(true);
    try {
      const rotatedData = await rotateImageDataUrl(sourceImage.data, direction);
      const rotatedImage = await loadImageFromDataUrl(rotatedData);
      setSourceImage((prev) => ({
        ...prev,
        data: rotatedData,
        width: rotatedImage.width,
        height: rotatedImage.height,
      }));
      setPaperCrop(DEFAULT_PAPER_CROP);
      setSuccess(direction === "left" ? "已左旋 90 度" : "已右旋 90 度");
    } catch (error) {
      setFailure(getErrorMessage(error) || "旋转失败");
    } finally {
      setIsRotatingPaper(false);
    }
  };

  const patchQuestion = (questionId, updater) => {
    setQuestions((prev) =>
      prev.map((question) => (question.id === questionId ? updater(question) : question)),
    );
  };

  const onToggleSelect = (questionId) => {
    patchQuestion(questionId, (question) => ({ ...question, selected: !question.selected }));
  };

  const onToggleAll = () => {
    const allSelected = questions.every((question) => question.selected);
    setQuestions((prev) => prev.map((question) => ({ ...question, selected: !allSelected })));
  };

  const onChangeQuestionField = (questionId, field, value) => {
    patchQuestion(questionId, (question) => ({ ...question, [field]: value }));
  };

  const onTogglePaper = (questionId) => {
    setExpandedPaperId((prev) => (prev === questionId ? null : questionId));
  };

  const onTogglePrompt = (questionId) => {
    setExpandedPromptId((prev) => (prev === questionId ? null : questionId));
  };

  const onOpenSvgCrop = (questionId) => {
    setExpandedPromptId(null);
    setCroppingSvgId(questionId);
  };

  const onCloseSvgCrop = () => {
    setCroppingSvgId(null);
  };

  const onChangeSvgCrop = (questionId, nextCrop) => {
    patchQuestion(questionId, (question) => ({ ...question, svgCrop: nextCrop }));
  };

  const buildLocalSvgPreview = async (question) => {
    if (!question) return buildDiagramReplacementDataUrl(question?.prompt || question?.text || "", question?.id || 1);

    if (sourceImage.data && sourceImage.width && sourceImage.height && question.svgCrop) {
      try {
        const sourceRect = {
          x: Math.round((question.svgCrop.x / 100) * sourceImage.width),
          y: Math.round((question.svgCrop.y / 100) * sourceImage.height),
          width: Math.round((question.svgCrop.w / 100) * sourceImage.width),
          height: Math.round((question.svgCrop.h / 100) * sourceImage.height),
        };
        const croppedDataUrl = await cropDataUrlBySourceRect(sourceImage.data, sourceRect);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="560" viewBox="0 0 960 560">
  <rect width="960" height="560" fill="#f8fafc"/>
  <rect x="36" y="34" width="888" height="492" rx="24" fill="#ffffff" stroke="#ddd6fe" stroke-width="3"/>
  <text x="70" y="84" font-size="30" fill="#5b21b6">题目配图演示稿</text>
  <text x="70" y="122" font-size="20" fill="#64748b">${String(question.prompt || question.text || "").slice(0, 36).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>
  <rect x="96" y="162" width="768" height="312" rx="20" fill="#faf5ff" stroke="#c4b5fd" stroke-width="2"/>
  <image href="${croppedDataUrl}" x="132" y="190" width="696" height="256" preserveAspectRatio="xMidYMid meet"/>
</svg>`;
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      } catch {
        return buildDiagramReplacementDataUrl(question.prompt || question.text || "", question.id);
      }
    }

    return buildDiagramReplacementDataUrl(question.prompt || question.text || "", question.id);
  };

  const onGenerateSvg = async (questionId) => {
    const question = questions.find((item) => item.id === questionId);
    if (!question) return;

    setExpandedPromptId(null);
    patchQuestion(questionId, (item) => ({
      ...item,
      svgStatus: "loading",
      svgPreviewUrl: "",
    }));

    try {
      let resolvedSvgUrl = "";

      try {
        const response = await generateDiagramSvg({
          item_id: question.ocrItemId || question.id,
          question_text: question.text || "",
          question_image_url: question.questionImageUrl || "",
          diagram_image_url: question.diagramImageUrl || question.questionImageUrl || "",
        });
        resolvedSvgUrl = normalizeOcrImageUrl(response?.diagram_svg_url);
      } catch (error) {
        const message = getErrorMessage(error);
        if (!isBackendUnavailable(message)) {
          throw error;
        }
      }

      const previewUrl = resolvedSvgUrl || await buildLocalSvgPreview(question);
      patchQuestion(questionId, (item) => ({
        ...item,
        svgStatus: "generated",
        svgPreviewUrl: previewUrl,
      }));
    } catch {
      patchQuestion(questionId, (item) => ({
        ...item,
        svgStatus: "error",
        svgPreviewUrl: "",
      }));
    }
  };

  const onConfirmSvgCrop = async () => {
    if (croppingSvgId === null) return;
    const activeId = croppingSvgId;
    setCroppingSvgId(null);
    await onGenerateSvg(activeId);
  };

  const onDeleteSvg = (questionId) => {
    patchQuestion(questionId, (question) => ({
      ...question,
      svgStatus: "none",
      svgPreviewUrl: "",
    }));
    setExpandedPromptId(null);
  };

  const onBackStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const onDismissRecognizeError = () => {
    setRecognizeError("");
  };

  const onDismissSaveError = () => {
    setSaveState((prev) => ({ ...prev, status: "idle", error: "" }));
  };

  const persistSelectedQuestions = async () => {
    const selectedQuestions = questions.filter((question) => question.selected);
    if (!selectedQuestions.length) {
      return;
    }

    setSaveState({
      status: "saving",
      error: "",
      savedCount: 0,
      total: selectedQuestions.length,
    });

    let savedCount = 0;

    try {
      let subjectsRes = null;
      try {
        subjectsRes = await listSubjects({ limit: 100 });
      } catch (error) {
        const message = getErrorMessage(error);
        if (!isBackendUnavailable(message)) {
          throw error;
        }
      }

      for (const question of selectedQuestions) {
        try {
          const subject = (subjectsRes?.items || []).find((item) => item.name === question.subject);
          const category = categoryOptions.find((item) => item.name === question.errorType);
          const selectedReasons = errorReasonOptions
            .filter((item) => item.name === question.reason || question.reason.split(/\s*[\/、,，]\s*/).includes(item.name))
            .filter((item) => !category || !item.category_id || item.category_id === category.id);
          const notes = [
            sourceImage.name ? `原始附件：${sourceImage.name}` : "",
            question.reason && !selectedReasons.length ? `错误原因备注：${question.reason}` : "",
          ].filter(Boolean).join("\n");
          const imageData = question.svgStatus === "generated"
            ? question.svgPreviewUrl
            : question.questionImageUrl || question.diagramImageUrl || sourceImage.data;

          await createWrongQuestion({
            student_id: Number(studentId),
            title: buildQuestionTitle(question.text, question.id),
            content: question.text,
            subject_id: subject?.id,
            grade: question.grade || profile.grade || undefined,
            term: form.term || getDefaultSchoolTerm(null, question.grade || profile.grade),
            difficulty: "medium",
            category_id: category?.id,
            error_reason_ids: selectedReasons.map((item) => item.id),
            status: "new",
            source: "manual",
            notes: notes || undefined,
            image_url: imageData || undefined,
            image_name: imageData ? resolveImageName(question, sourceImage.name) : undefined,
          });
          savedCount += 1;
          setSaveState({
            status: "saving",
            error: "",
            savedCount,
            total: selectedQuestions.length,
          });
        } catch (error) {
          const message = getErrorMessage(error);
          if (savedCount === 0 && isBackendUnavailable(message)) {
            setSaveState({ status: "idle", error: "", savedCount: 0, total: 0 });
            onCloseComposer();
            setSuccess(`已完成前端演示保存 ${selectedQuestions.length} 道，实际入库接口待接入`);
            return;
          }
          throw error;
        }
      }

      await refresh();
      setSaveState({ status: "idle", error: "", savedCount: 0, total: 0 });
      onCloseComposer();
      setSuccess(`已保存 ${savedCount} 道错题`);
    } catch (error) {
      const total = selectedQuestions.length;
      const message = getErrorMessage(error) || "保存失败";
      const detail = savedCount > 0
        ? `保存中断，已成功 ${savedCount} / ${total} 道：${message}`
        : message;
      setSaveState({
        status: "error",
        error: detail,
        savedCount,
        total,
      });
      setFailure(detail);
    }
  };

  const selectedCount = questions.filter((question) => question.selected).length;
  const allSelectedState = !questions.length
    ? "none"
    : questions.every((question) => question.selected)
      ? "all"
      : questions.some((question) => question.selected)
        ? "partial"
        : "none";

  const subjectChoices = Array.from(new Set([...(subjectOptions || []), "数学", "语文", "英语", "科学"].filter(Boolean)));
  const errorTypeChoices = Array.from(new Set([...(categoryOptions || []).map((item) => item.name), "计算错误", "概念模糊"].filter(Boolean)));
  const reasonSuggestions = Array.from(new Set((errorReasonOptions || []).map((item) => item.name).filter(Boolean)));
  const gradeChoices = Array.from(new Set([profile.grade, ...GRADE_OPTIONS].filter(Boolean)));
  const activeSvgQuestion = croppingSvgId === null
    ? null
    : questions.find((question) => question.id === croppingSvgId) || null;

  return {
    uploadInputRef,
    form,
    setForm,
    isComposerOpen,
    step,
    setStep,
    sourceImage,
    paperCrop,
    setPaperCrop,
    isRotatingPaper,
    isRecognizing,
    recognizeError,
    lastRecognitionMode,
    questions,
    expandedPaperId,
    expandedPromptId,
    croppingSvgId,
    activeSvgQuestion,
    saveState,
    selectedCount,
    allSelectedState,
    subjectChoices,
    errorTypeChoices,
    reasonSuggestions,
    gradeChoices,
    onOpenComposer,
    onCloseComposer,
    onTriggerUpload,
    onUseFile,
    onPickUpload,
    onRecognize,
    onRotatePaper,
    onToggleSelect,
    onToggleAll,
    onChangeQuestionField,
    onTogglePaper,
    onTogglePrompt,
    onOpenSvgCrop,
    onCloseSvgCrop,
    onChangeSvgCrop,
    onConfirmSvgCrop,
    onDeleteSvg,
    onGenerateSvg,
    onBackStep,
    onDismissRecognizeError,
    onDismissSaveError,
    persistSelectedQuestions,
  };
}
