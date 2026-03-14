export const MOCK_QUESTIONS = [
  {
    id: "q1",
    subject: "数学",
    topic: "二次函数求最值",
    originalText: "已知抛物线 y = x^2 - 4x + 3，求其在闭区间 [0, 5] 上的最大值和最小值。",
    correctAnswer: "解：抛物线对称轴 x=2。当x=2时，y(min) = -1。当x=5时，y(max) = 8。",
    errorReason: "未考虑对称轴在区间内",
    date: "2023-10-15",
    isRecurring: true,
    recurringCount: 3,
  },
  {
    id: "q2",
    subject: "物理",
    topic: "牛顿第二定律应用",
    originalText: "质量为m的物体在倾角为θ的粗糙斜面上匀速下滑，求动摩擦因数μ。",
    correctAnswer: "μ = tanθ",
    errorReason: "受力分析遗漏支持力分量",
    date: "2023-10-14",
    isRecurring: false,
  },
  {
    id: "q3",
    subject: "数学",
    topic: "三角函数诱导公式",
    originalText: "化简：sin(π/2 + α)cos(π - α) + cos(π/2 - α)sin(-α)",
    correctAnswer: "化简结果为 -1",
    errorReason: "符号判断错误",
    date: "2023-10-12",
    isRecurring: true,
    recurringCount: 2,
  },
  {
    id: "q4",
    subject: "英语",
    topic: "虚拟语气",
    originalText: "If I (know) you were coming, I would have baked a cake.",
    correctAnswer: "had known",
    errorReason: "时态倒退混淆",
    date: "2023-10-10",
    isRecurring: false,
  },
];

export const RECURRING_INSIGHTS = [
  {
    topic: "二次函数求最值",
    count: 3,
    riskLevel: "高危",
    description: "常在考虑闭区间端点与对称轴位置关系时出错。",
  },
  {
    topic: "三角函数符号判断",
    count: 2,
    riskLevel: "中危",
    description: "第四象限余弦值为正经常遗忘。",
  },
];

export const RADAR_DATA = [
  { subject: "数学", value: 85 },
  { subject: "物理", value: 72 },
  { subject: "英语", value: 90 },
  { subject: "化学", value: 65 },
  { subject: "生物", value: 78 },
];
