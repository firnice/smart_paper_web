export const QUESTIONS = [
  {
    id: "q1",
    subject: "数学",
    topic: "二次函数求最值",
    originalText: "已知抛物线 y = x^2 - 4x + 3，求其在闭区间 [0, 5] 上的最大值和最小值。",
    correctAnswer:
      "抛物线对称轴 x=2。当 x=2 时取得最小值 -1；当 x=5 时取得最大值 8。解题时需要同时检查对称轴和区间端点。",
    errorReason: "未考虑对称轴在区间内",
    date: "2026-03-10",
    isRecurring: true,
    recurringCount: 3,
  },
  {
    id: "q2",
    subject: "物理",
    topic: "牛顿第二定律应用",
    originalText: "质量为 m 的物体在倾角为 θ 的粗糙斜面上匀速下滑，求动摩擦因数 μ。",
    correctAnswer: "匀速下滑说明合力为 0，沿斜面方向列式可得 μ = tanθ。",
    errorReason: "受力分析遗漏支持力分量",
    date: "2026-03-09",
    isRecurring: false,
    recurringCount: 0,
  },
  {
    id: "q3",
    subject: "英语",
    topic: "虚拟语气",
    originalText: "If I (know) you were coming, I would have baked a cake.",
    correctAnswer: "应填 had known。该句表示与过去事实相反，主句用 would have done，从句用 had done。",
    errorReason: "时态倒退混淆",
    date: "2026-03-08",
    isRecurring: true,
    recurringCount: 2,
  },
  {
    id: "q4",
    subject: "化学",
    topic: "氧化还原反应配平",
    originalText: "在酸性条件下配平 MnO4- 与 Fe2+ 反应的离子方程式。",
    correctAnswer: "MnO4- + 5Fe2+ + 8H+ = Mn2+ + 5Fe3+ + 4H2O。",
    errorReason: "电子守恒步骤跳过",
    date: "2026-03-07",
    isRecurring: false,
    recurringCount: 0,
  },
];

export const SUBJECT_STATS = [
  { name: "数学", count: 12 },
  { name: "物理", count: 5 },
  { name: "英语", count: 8 },
  { name: "化学", count: 2 },
];

export const RECURRING_INSIGHTS = [
  {
    subject: "数学",
    topic: "二次函数求最值",
    count: 3,
    riskLevel: "高风险",
    description: "常在区间端点与对称轴的位置关系上漏检，导致最值判断不完整。",
    lastErrorDate: "2026-03-10",
  },
  {
    subject: "英语",
    topic: "虚拟语气",
    count: 2,
    riskLevel: "中风险",
    description: "容易把过去虚拟和现在虚拟混用，尤其在 if 从句里出现时态倒退错误。",
    lastErrorDate: "2026-03-08",
  },
  {
    subject: "物理",
    topic: "牛顿第二定律应用",
    count: 4,
    riskLevel: "高风险",
    description: "涉及斜面与摩擦力时常漏掉法向力或摩擦方向判断，建议回到受力图重练。",
    lastErrorDate: "2026-03-09",
  },
];

export const RADAR_DATA = [
  { subject: "数学", value: 85 },
  { subject: "物理", value: 72 },
  { subject: "英语", value: 90 },
  { subject: "化学", value: 65 },
  { subject: "语文", value: 78 },
];

export const TREND_DATA = [
  { name: "周一", mistakes: 8, solved: 5 },
  { name: "周二", mistakes: 6, solved: 6 },
  { name: "周三", mistakes: 4, solved: 7 },
  { name: "周四", mistakes: 9, solved: 4 },
  { name: "周五", mistakes: 5, solved: 8 },
  { name: "周六", mistakes: 12, solved: 10 },
  { name: "周日", mistakes: 3, solved: 15 },
];

export const SUBJECTS = ["全部", "数学", "物理", "英语", "化学"];
