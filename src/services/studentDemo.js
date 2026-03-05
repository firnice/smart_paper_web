const DEMO_DB_KEY = "smart_paper_demo_db_v1";

const DEFAULT_GRADE = "未设置";
const DEFAULT_SUBJECTS = ["数学", "语文", "英语", "科学"];

function nowIso() {
  return new Date().toISOString();
}

export function getDefaultSchoolTerm(dateLike) {
  const date = dateLike ? new Date(dateLike) : new Date();
  const fallbackDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const year = fallbackDate.getFullYear();
  const month = fallbackDate.getMonth() + 1;
  const season = month <= 7 ? "春学期" : "秋学期";
  return `${year}${season}`;
}

function toSvgDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function buildMathSetDiagramDataUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420">
  <rect width="800" height="420" fill="#ffffff"/>
  <text x="40" y="52" font-size="28" fill="#0f172a" font-family="Arial, sans-serif">Set Diagram (A, B)</text>
  <rect x="110" y="84" width="580" height="280" rx="18" fill="#f8fafc" stroke="#94a3b8" stroke-width="3"/>
  <circle cx="340" cy="224" r="110" fill="rgba(14,165,233,0.22)" stroke="#0284c7" stroke-width="3"/>
  <circle cx="460" cy="224" r="110" fill="rgba(16,185,129,0.22)" stroke="#059669" stroke-width="3"/>
  <text x="285" y="150" font-size="30" fill="#0369a1" font-family="Arial, sans-serif">A</text>
  <text x="500" y="150" font-size="30" fill="#047857" font-family="Arial, sans-serif">B</text>
  <text x="245" y="228" font-size="30" fill="#0f172a" font-family="Arial, sans-serif">1, 2</text>
  <text x="385" y="228" font-size="30" fill="#0f172a" font-family="Arial, sans-serif">3, 4</text>
  <text x="532" y="228" font-size="30" fill="#0f172a" font-family="Arial, sans-serif">5, 6</text>
  <text x="132" y="116" font-size="20" fill="#334155" font-family="Arial, sans-serif">U = {1,2,3,4,5,6}</text>
  </svg>`;
  return toSvgDataUrl(svg);
}

function buildMathGeometryDiagramDataUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420">
  <rect width="800" height="420" fill="#ffffff"/>
  <text x="40" y="52" font-size="28" fill="#0f172a" font-family="Arial, sans-serif">Geometry Diagram (Triangle)</text>
  <line x1="180" y1="320" x2="640" y2="320" stroke="#334155" stroke-width="4"/>
  <line x1="220" y1="320" x2="460" y2="120" stroke="#2563eb" stroke-width="4"/>
  <line x1="460" y1="120" x2="620" y2="320" stroke="#2563eb" stroke-width="4"/>
  <line x1="460" y1="120" x2="460" y2="320" stroke="#f97316" stroke-width="3" stroke-dasharray="10 7"/>
  <rect x="460" y="304" width="16" height="16" fill="#f8fafc" stroke="#f97316" stroke-width="2"/>
  <text x="210" y="350" font-size="26" fill="#0f172a" font-family="Arial, sans-serif">A</text>
  <text x="452" y="104" font-size="26" fill="#0f172a" font-family="Arial, sans-serif">B</text>
  <text x="628" y="350" font-size="26" fill="#0f172a" font-family="Arial, sans-serif">C</text>
  <text x="486" y="230" font-size="24" fill="#ea580c" font-family="Arial, sans-serif">h</text>
  <text x="355" y="366" font-size="24" fill="#0f172a" font-family="Arial, sans-serif">base = 8</text>
  </svg>`;
  return toSvgDataUrl(svg);
}

const MATH_SET_IMAGE = buildMathSetDiagramDataUrl();
const MATH_GEOMETRY_IMAGE = buildMathGeometryDiagramDataUrl();

function createStarterWrongQuestions({
  studentId,
  startId,
  createdAt,
  grade,
}) {
  const baseDate = new Date(createdAt);
  const year = Number.isNaN(baseDate.getTime()) ? new Date().getFullYear() : baseDate.getFullYear();
  const springTerm = `${year}春学期`;
  const fallTerm = `${year}秋学期`;
  const studentGrade = grade || DEFAULT_GRADE;

  return [
    {
      id: startId,
      student_id: studentId,
      title: "集合交集判断",
      content: "已知 A={1,2,3,4}, B={3,4,5,6}，请写出 A∩B。",
      subject: "数学",
      term: springTerm,
      grade: studentGrade,
      category: "集合概念",
      error_reason: "交集概念混淆",
      status: "new",
      difficulty: "medium",
      review_count: 0,
      last_result: null,
      image_data: MATH_SET_IMAGE,
      image_name: "math-set-diagram.svg",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: startId + 1,
      student_id: studentId,
      title: "三角形高与面积",
      content: "根据图示，底边=8，高=h，写出面积表达式。",
      subject: "数学",
      term: fallTerm,
      grade: studentGrade,
      category: "几何图示",
      error_reason: "公式套用错误",
      status: "reviewing",
      difficulty: "medium",
      review_count: 1,
      last_result: "incorrect",
      image_data: MATH_GEOMETRY_IMAGE,
      image_name: "math-geometry-diagram.svg",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: startId + 2,
      student_id: studentId,
      title: "看图写话",
      content: "用 3 句话描述图中的春游场景。",
      subject: "语文",
      term: springTerm,
      grade: studentGrade,
      category: "表达不完整",
      error_reason: "审题不清",
      status: "new",
      difficulty: "medium",
      review_count: 0,
      last_result: null,
      image_data: null,
      image_name: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: startId + 3,
      student_id: studentId,
      title: "时态选择",
      content: "Yesterday I ___ to school by bus.",
      subject: "英语",
      term: fallTerm,
      grade: studentGrade,
      category: "语法错误",
      error_reason: "规则混淆",
      status: "mastered",
      difficulty: "medium",
      review_count: 3,
      last_result: "correct",
      image_data: null,
      image_name: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: startId + 4,
      student_id: studentId,
      title: "植物蒸腾作用判断",
      content: "实验中叶片套袋后出现水珠，现象说明了什么？",
      subject: "科学",
      term: springTerm,
      grade: studentGrade,
      category: "实验分析",
      error_reason: "因果关系判断错误",
      status: "new",
      difficulty: "easy",
      review_count: 0,
      last_result: null,
      image_data: null,
      image_name: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
  ];
}

function ensureStudentStarterQuestions(db, studentId, grade) {
  const existing = (db.wrongQuestions || []).filter((item) => item.student_id === studentId);

  const createdAt = nowIso();
  const maxExistingId = (db.wrongQuestions || []).reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
  const startId = Math.max(Number(db.nextWrongQuestionId) || 1, maxExistingId + 1);
  const starters = createStarterWrongQuestions({
    studentId,
    startId,
    createdAt,
    grade: grade || DEFAULT_GRADE,
  });

  const toAdd = starters.filter((candidate) => {
    return !existing.some((item) => {
      if (candidate.image_name && item.image_name === candidate.image_name) return true;
      return item.subject === candidate.subject && item.title === candidate.title;
    });
  });

  if (!toAdd.length) return;

  db.wrongQuestions = [...(db.wrongQuestions || []), ...toAdd];
  const maxAddedId = toAdd.reduce((max, item) => Math.max(max, Number(item.id) || 0), startId);
  db.nextWrongQuestionId = Math.max(Number(db.nextWrongQuestionId) || 1, maxAddedId + 1);
}

function createSeedData() {
  const createdAt = nowIso();
  const wrongQuestions = createStarterWrongQuestions({
    studentId: 1,
    startId: 1,
    createdAt,
    grade: "二年级",
  });
  return {
    nextStudentId: 2,
    nextWrongQuestionId: wrongQuestions.length + 1,
    nextPracticeId: 1,
    students: [
      {
        id: 1,
        name: "小红",
        student_no: "S1001",
        grade: "二年级",
        class_name: "2班",
        school_name: "实验小学",
        created_at: createdAt,
      },
    ],
    wrongQuestions,
    practices: [],
  };
}

function loadDb() {
  const raw = localStorage.getItem(DEMO_DB_KEY);
  if (!raw) {
    const seeded = createSeedData();
    localStorage.setItem(DEMO_DB_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = migrateDb(JSON.parse(raw));
    if (!parsed?.students || !parsed?.wrongQuestions) {
      throw new Error("Invalid demo db");
    }
    saveDb(parsed);
    return parsed;
  } catch {
    const seeded = createSeedData();
    localStorage.setItem(DEMO_DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function saveDb(db) {
  try {
    localStorage.setItem(DEMO_DB_KEY, JSON.stringify(db));
  } catch (error) {
    if (error?.name === "QuotaExceededError") {
      throw new Error("本地存储空间不足，请压缩图片或重置演示数据后重试");
    }
    throw error;
  }
}

function migrateDb(db) {
  const migrated = {
    ...db,
    wrongQuestions: (db.wrongQuestions || []).map((item) => ({
      ...item,
      term:
        sanitizeText(item.term) && sanitizeText(item.term) !== "未分期"
          ? sanitizeText(item.term)
          : getDefaultSchoolTerm(item.created_at || item.updated_at),
      image_data: item.image_data || null,
      image_name: item.image_name || null,
    })),
  };
  const students = migrated.students || [];
  for (const student of students) {
    ensureStudentStarterQuestions(migrated, student.id, student.grade);
  }
  return migrated;
}

function uniqueValues(list) {
  return Array.from(new Set(list.filter(Boolean)));
}

function buildStudentPayload(student) {
  return {
    id: student.id,
    name: student.name,
    role: "student",
    status: "active",
    created_at: student.created_at,
    student_profile: {
      student_no: student.student_no || null,
      grade: student.grade || DEFAULT_GRADE,
      class_name: student.class_name || null,
      school_name: student.school_name || null,
    },
  };
}

function sanitizeText(value) {
  return String(value || "").trim();
}

function normalizeStudentNo(value) {
  return sanitizeText(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function studentNoMatches(left, right) {
  const a = normalizeStudentNo(left);
  const b = normalizeStudentNo(right);
  if (!a || !b) return false;
  if (a === b) return true;
  const digitsA = a.replace(/\D/g, "");
  const digitsB = b.replace(/\D/g, "");
  return Boolean(digitsA) && digitsA === digitsB;
}

export function demoStudentLogin(payload) {
  const name = sanitizeText(payload?.name);
  const studentNo = sanitizeText(payload?.student_no);
  const grade = sanitizeText(payload?.grade);

  if (!name) {
    throw new Error("请输入学生姓名");
  }

  const db = loadDb();
  const candidates = db.students.filter((item) => item.name === name);

  let student = null;

  if (candidates.length > 1) {
    if (!studentNo) {
      throw new Error("同名学生较多，请输入学号");
    }
    student = candidates.find((item) => studentNoMatches(item.student_no, studentNo)) || null;
    if (!student) {
      throw new Error("学号与姓名不匹配");
    }
  }

  if (!student && candidates.length === 1) {
    student = candidates[0];
    if (studentNo && !student.student_no) {
      student.student_no = studentNo;
    }
    if (studentNo && student.student_no && !studentNoMatches(student.student_no, studentNo)) {
      // Demo 模式下不做硬校验，允许用当前输入覆盖学号，避免阻塞演示。
      student.student_no = studentNo;
    }
  }

  let created = false;
  if (!student) {
    created = true;
    student = {
      id: db.nextStudentId,
      name,
      student_no: studentNo || "",
      grade: grade || DEFAULT_GRADE,
      class_name: "",
      school_name: "",
      created_at: nowIso(),
    };
    db.nextStudentId += 1;
    db.students.push(student);
  }

  if (grade && (!student.grade || student.grade === DEFAULT_GRADE)) {
    student.grade = grade;
  }

  ensureStudentStarterQuestions(db, student.id, student.grade);

  saveDb(db);

  return {
    success: true,
    created,
    message: created ? "首次登录成功（Demo）" : "登录成功（Demo）",
    session_token: `demo-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    student: buildStudentPayload(student),
  };
}

function computeStats(items) {
  const total = items.length;
  const newCount = items.filter((item) => item.status === "new").length;
  const reviewingCount = items.filter((item) => item.status === "reviewing").length;
  const masteredCount = items.filter((item) => item.status === "mastered").length;

  const subjectSummary = {};
  const termSummary = {};
  const categorySummary = {};
  const reasonSummary = {};

  for (const item of items) {
    subjectSummary[item.subject] = (subjectSummary[item.subject] || 0) + 1;
    termSummary[item.term] = (termSummary[item.term] || 0) + 1;
    categorySummary[item.category] = (categorySummary[item.category] || 0) + 1;
    reasonSummary[item.error_reason] = (reasonSummary[item.error_reason] || 0) + 1;
  }

  return {
    total,
    new_count: newCount,
    reviewing_count: reviewingCount,
    mastered_count: masteredCount,
    mastery_rate: total ? Math.round((masteredCount / total) * 100) : 0,
    total_reviews: items.reduce((acc, item) => acc + (item.review_count || 0), 0),
    by_subject: subjectSummary,
    by_term: termSummary,
    by_category: categorySummary,
    by_reason: reasonSummary,
  };
}

function sortQuestions(items) {
  return items
    .slice()
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export function getStudentDashboardData(studentId, filters = {}) {
  const db = loadDb();
  const sid = Number(studentId);

  let items = db.wrongQuestions.filter((item) => item.student_id === sid);

  const keyword = sanitizeText(filters.keyword);
  const subject = sanitizeText(filters.subject);
  const term = sanitizeText(filters.term);
  const status = sanitizeText(filters.status);

  if (keyword) {
    const lowered = keyword.toLowerCase();
    items = items.filter(
      (item) =>
        item.title?.toLowerCase().includes(lowered) ||
        item.content?.toLowerCase().includes(lowered) ||
        item.term?.toLowerCase().includes(lowered) ||
        item.error_reason?.toLowerCase().includes(lowered) ||
        item.image_name?.toLowerCase().includes(lowered),
    );
  }

  if (subject) {
    items = items.filter((item) => item.subject === subject);
  }
  if (term) {
    items = items.filter((item) => item.term === term);
  }

  if (status) {
    items = items.filter((item) => item.status === status);
  }

  const allStudentItems = db.wrongQuestions.filter((item) => item.student_id === sid);

  return {
    stats: computeStats(allStudentItems),
    items: sortQuestions(items),
    subject_options: uniqueValues(allStudentItems.map((item) => item.subject)),
    default_subject_options: DEFAULT_SUBJECTS,
    term_options: uniqueValues(allStudentItems.map((item) => item.term)),
    category_options: uniqueValues(allStudentItems.map((item) => item.category)),
  };
}

export function createStudentWrongQuestion(studentId, payload) {
  const db = loadDb();
  const sid = Number(studentId);

  const content = sanitizeText(payload?.content);
  const imageData = sanitizeText(payload?.image_data);
  const imageName = sanitizeText(payload?.image_name);

  if (!content && !imageData) {
    throw new Error("请上传错题照片或填写错题内容");
  }

  const now = nowIso();
  const item = {
    id: db.nextWrongQuestionId,
    student_id: sid,
    title: sanitizeText(payload?.title) || "未命名错题",
    content: content || "已通过照片录入，待补充文字内容",
    subject: sanitizeText(payload?.subject) || "未分类学科",
    term: sanitizeText(payload?.term) || getDefaultSchoolTerm(now),
    grade: sanitizeText(payload?.grade) || DEFAULT_GRADE,
    category: sanitizeText(payload?.category) || "未分类",
    error_reason: sanitizeText(payload?.error_reason) || "待分析",
    status: "new",
    difficulty: sanitizeText(payload?.difficulty) || "medium",
    review_count: 0,
    last_result: null,
    image_data: imageData || null,
    image_name: imageName || null,
    created_at: now,
    updated_at: now,
  };

  db.nextWrongQuestionId += 1;
  db.wrongQuestions.push(item);
  saveDb(db);

  return item;
}

export function setWrongQuestionStatus(studentId, wrongQuestionId, status) {
  const db = loadDb();
  const sid = Number(studentId);
  const wid = Number(wrongQuestionId);

  const target = db.wrongQuestions.find((item) => item.id === wid && item.student_id === sid);
  if (!target) {
    throw new Error("错题不存在");
  }

  target.status = status;
  target.updated_at = nowIso();
  saveDb(db);

  return target;
}

export function addPracticeRecord(studentId, wrongQuestionId, result) {
  const db = loadDb();
  const sid = Number(studentId);
  const wid = Number(wrongQuestionId);

  const target = db.wrongQuestions.find((item) => item.id === wid && item.student_id === sid);
  if (!target) {
    throw new Error("错题不存在");
  }

  const now = nowIso();
  target.review_count = (target.review_count || 0) + 1;
  target.last_result = result;
  target.updated_at = now;

  if (result === "correct") {
    target.status = target.review_count >= 3 ? "mastered" : "reviewing";
  } else {
    target.status = "reviewing";
  }

  db.practices.push({
    id: db.nextPracticeId,
    student_id: sid,
    wrong_question_id: wid,
    result,
    created_at: now,
  });
  db.nextPracticeId += 1;

  saveDb(db);

  return target;
}

export function resetStudentDemoData() {
  localStorage.removeItem(DEMO_DB_KEY);
}
