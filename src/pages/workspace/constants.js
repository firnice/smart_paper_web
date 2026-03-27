export const INITIAL_FORM = {
  title: "",
  content: "",
  subject: "数学",
  term: "",
  category: "计算错误",
  error_reason: "粗心抄错",
  difficulty: "medium",
  image_data: "",
  image_name: "",
};

export const STATUS_LABEL = {
  new: "新错题",
  reviewing: "复习中",
  mastered: "已掌握",
};

export const EDIT_INITIAL = {
  id: null,
  title: "",
  notes: "",
  status: "new",
  is_bookmarked: false,
  error_reason_ids: [],
};

export const DEFAULT_SUBJECT_OPTIONS = ["数学", "语文", "英语", "科学"];

export const ENTRY_MODES = [
  { id: "camera", label: "拍照" },
  { id: "photo", label: "照片" },
  { id: "upload", label: "上传" },
  { id: "text", label: "输入" },
];

export const RECOGNITION_SCOPES = [
  {
    id: "manual_question",
    label: "手动截一道题",
    hint: "先在整张卷子上拖拽框出一道题，再手动开始识别。",
  },
  {
    id: "full_page",
    label: "整张识别",
    hint: "直接识别整页，适合先快速查看这张卷子的题目列表。",
  },
];

export const PAPER_ZOOM_MIN = 0.5;
export const PAPER_ZOOM_MAX = 3;
export const PAPER_ZOOM_STEP = 0.25;

export const DIAGRAM_RENDER_MODES = [
  {
    id: "original_crop",
    label: "原图抠图",
    hint: "使用上传原图进行手动/自动抠图后入卡片",
  },
  {
    id: "llm_crop",
    label: "LLM识别抠图",
    hint: "直接使用识别返回的图示抠图",
  },
  {
    id: "llm_svg",
    label: "LLM生成SVG",
    hint: "根据识别文字生成新的SVG替代图示",
  },
];

export function createElementEditorInitial() {
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
