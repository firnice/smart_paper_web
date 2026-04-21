import { resolveAssetUrl } from "../../services/api.js";
import { getDefaultSchoolTerm } from "../../services/studentDemo.js";

export const DEFAULT_PROMPT =
  "你是一名小学教研老师。请围绕原题考查的同一知识点，生成 2 道难度接近但情境不同的练习题。题干要清晰，数字合理，保留小学书面表达风格；如果原题带图，请同步生成配套示意图。";

export const STEP_META = [
  { id: 1, title: "选择错题", hint: "勾选进入打印包的原题" },
  { id: 2, title: "配置练习", hint: "设置答案与 AI 同类题" },
  { id: 3, title: "预览与排版", hint: "拖拽微调后导出 PDF" },
];

export const ANSWER_MODES = [
  { id: "hidden", title: "隐藏答案", desc: "试卷不展示答案，适合直接重做。" },
  { id: "inline", title: "附参考答案", desc: "有答案数据时直接显示在题目下方。" },
  { id: "sheet", title: "单独答案页", desc: "题目区不显示答案，在末尾汇总答案。" },
];

const STATUS_TEXT = {
  new: "未掌握",
  reviewing: "复习中",
  mastered: "已掌握",
};

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function formatShortDate(isoLike) {
  if (!isoLike) return "";
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}

function inferTerm(dateLike, grade) {
  if (!dateLike) return "";
  return getDefaultSchoolTerm(dateLike, grade);
}

function svgMarkupToDataUrl(svg) {
  const markup = String(svg || "").trim();
  if (!markup) return "";
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

export function createEmptyConfig() {
  return {
    gen: false,
    loading: false,
    editingPrompt: false,
    prompt: DEFAULT_PROMPT,
    items: [],
    error: "",
  };
}

export function mapWrongQuestionToPrintQuestion(item, fallbackGrade = "") {
  const reasons = Array.isArray(item?.error_reasons) ? item.error_reasons : [];
  const answer =
    item?.answer
    || item?.reference_answer
    || item?.solution
    || item?.analysis_answer
    || "";
  const imageUrl = resolveAssetUrl(item?.image_url);
  const grade =
    item?.grade
    || item?.student?.student_profile?.grade
    || item?.student?.grade
    || fallbackGrade
    || "";

  return {
    id: String(item?.id || ""),
    rawId: item?.id,
    title: item?.title || "未命名错题",
    content: item?.content || "",
    subject: item?.subject?.name || "未分类学科",
    grade: grade || "未分级",
    term: inferTerm(item?.first_error_date || item?.created_at, grade),
    category: item?.category?.name || "未分类",
    mastery: STATUS_TEXT[item?.status] || item?.status || "未掌握",
    status: item?.status || "new",
    answer,
    answerAvailable: Boolean(String(answer || "").trim()),
    hasImg: Boolean(imageUrl),
    imageUrl,
    imageName: item?.image_name || "",
    printCount: item?.print_count || 0,
    lastPrintedAt: item?.last_printed_at || "",
    hasBeenPrinted: (item?.print_count || 0) > 0,
    errorReason: reasons.map((reason) => reason?.name).filter(Boolean).join(" / ") || "待分析",
    keywords: [
      item?.subject?.name,
      grade,
      item?.title,
      item?.content,
      item?.category?.name,
      reasons.map((reason) => reason?.name).join(" "),
    ]
      .filter(Boolean)
      .join(" "),
  };
}

export function normalizeVariantItem(raw, sourceId, index) {
  const base = typeof raw === "string" ? { text: raw } : raw || {};
  const text = base?.text || base?.content || base?.question_text || base?.question || "";
  const answer = base?.answer || base?.reference_answer || "";
  const hint = base?.hint || "";
  const imageUrl = resolveAssetUrl(base?.image_url || base?.img_url || "");
  const imgSvg = base?.svg || base?.img_svg || base?.imgSvg || "";
  const textHash = hashString(`${sourceId}-${index}-${text}`);

  return {
    id: `ai-${sourceId}-${index + 1}-${textHash.toString(36)}`,
    sourceId: String(sourceId),
    type: "ai",
    selected: true,
    text,
    answer,
    hint,
    answerAvailable: Boolean(String(answer || "").trim()),
    hasImg: Boolean(imageUrl || imgSvg),
    imageUrl,
    imgSvg,
  };
}

export function buildPreviewSourceKey(selectedQuestions, configs) {
  return JSON.stringify(
    selectedQuestions.map((question) => {
      const config = configs[question.id] || createEmptyConfig();
      return {
        id: question.id,
        gen: config.gen,
        items: config.gen ? config.items.map((item) => ({ id: item.id, selected: item.selected !== false })) : [],
      };
    }),
  );
}

export function buildPreviewItems(selectedQuestions, configs) {
  const items = [];

  selectedQuestions.forEach((question) => {
    items.push({
      id: `orig-${question.id}`,
      sourceId: question.id,
      type: "orig",
      text: question.content,
      answer: question.answer,
      answerAvailable: question.answerAvailable,
      hasImg: question.hasImg,
      imageUrl: question.imageUrl,
      imgSvg: "",
    });

    const config = configs[question.id] || createEmptyConfig();
    if (!config.gen || config.items.length === 0) return;

    config.items.filter((item) => item.selected !== false).forEach((item) => {
      items.push({
        ...item,
        sourceId: question.id,
      });
    });
  });

  return items;
}

export function estimatePages(items, answerMode) {
  const questionUnits = items.reduce((total, item) => {
    let units = 1.1 + Math.ceil(item.text.length / 34) * 0.45;
    if (item.hasImg) units += 1.45;
    if (answerMode === "inline" && item.answerAvailable) {
      units += 0.4 + Math.ceil(formatAnswerText(item).length / 32) * 0.22;
    }
    return total + units;
  }, 1.3);

  const questionPages = Math.max(1, Math.ceil(questionUnits / 7.4));
  const answerPages = answerMode === "sheet" ? Math.max(1, Math.ceil(items.length / 11)) : 0;
  return questionPages + answerPages;
}

export function formatAnswerText(item) {
  const answer = String(item?.answer || "").trim();
  if (answer) return answer;
  return "未提供参考答案";
}

function formatDateText(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildPrintExportPayload({ previewItems, answerMode, student }) {
  const dateText = formatDateText();

  return {
    title: `智能错题本-打印重做包-${dateText}`,
    student_id: student?.id || undefined,
    answer_mode: answerMode,
    include_images: true,
    paper_meta: {
      student_name: student?.name || "",
      class_name: student?.student_profile?.class_name || "",
      date: dateText,
    },
    items: previewItems.map((item, index) => ({
      id: item.id,
      source_question_id: Number.isFinite(Number(item.sourceId)) ? Number(item.sourceId) : null,
      type: item.type,
      order: index + 1,
      text: item.text,
      answer: item.answer || "",
      image_url: item.imageUrl || svgMarkupToDataUrl(item.imgSvg),
    })),
  };
}
