export const BRAND = {
  name: "JuYiFanSan",
  headline: "举一反三 · 智能错题重构助手",
  description:
    "拍照即录入，自动去手写、裁剪插图、生成同类题，为小学阶段建立高效练习闭环。",
};

export const PIPELINE_STEPS = [
  {
    title: "上传",
    detail: "拍照或上传试卷/作业图片。",
    action: "支持相机与相册",
  },
  {
    title: "提取",
    detail: "OCR + 版面分析，忽略手写痕迹。",
    action: "返回题干与插图坐标",
  },
  {
    title: "生成",
    detail: "基于错题生成 3 道同类题。",
    action: "可调节题量与难度",
  },
  {
    title: "导出",
    detail: "一键生成可打印文档。",
    action: "PDF / Word",
  },
];

export const FEATURES = [
  {
    title: "智能识别",
    detail: "识别试卷题干，自动过滤手写答案与批改痕迹。",
  },
  {
    title: "图文分离",
    detail: "检测题目插图并自动裁剪保存，解决图文混排。",
  },
  {
    title: "同类题生成",
    detail: "根据知识点生成同类变式题，快速完成巩固练习。",
  },
  {
    title: "错题本导出",
    detail: "将原题与变式题组合输出，支持打印与分享。",
  },
];

export const TECH_STACK = [
  {
    name: "Qwen2.5-VL",
    detail: "OCR + 版面分析，返回题干与插图坐标",
  },
  {
    name: "OpenCV / PIL",
    detail: "按坐标裁剪插图并上传到对象存储",
  },
  {
    name: "DeepSeek-V3 / GPT-4o",
    detail: "基于题干生成同类变式题",
  },
];
