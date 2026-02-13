const DEMO_DB_KEY = "smart_paper_demo_db_v1";

const DEFAULT_GRADE = "未设置";

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

function createSeedData() {
  const createdAt = nowIso();
  return {
    nextStudentId: 2,
    nextWrongQuestionId: 5,
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
    wrongQuestions: [
      {
        id: 1,
        student_id: 1,
        title: "竖式进位加法",
        content: "38 + 27 = ?",
        subject: "数学",
        term: "2025春学期",
        grade: "二年级",
        category: "计算错误",
        error_reason: "粗心抄错",
        status: "reviewing",
        difficulty: "easy",
        review_count: 2,
        last_result: "correct",
        image_data: null,
        image_name: null,
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: 2,
        student_id: 1,
        title: "看图写话",
        content: "用 3 句话描述图中的春游场景。",
        subject: "语文",
        term: "2025春学期",
        grade: "二年级",
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
        id: 3,
        student_id: 1,
        title: "乘法口诀应用",
        content: "6 x 7 = ?",
        subject: "数学",
        term: "2025秋学期",
        grade: "二年级",
        category: "基础不牢",
        error_reason: "口诀不熟",
        status: "new",
        difficulty: "easy",
        review_count: 0,
        last_result: null,
        image_data: null,
        image_name: null,
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: 4,
        student_id: 1,
        title: "时态选择",
        content: "Yesterday I ___ to school by bus.",
        subject: "英语",
        term: "2025秋学期",
        grade: "二年级",
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
    ],
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
  localStorage.setItem(DEMO_DB_KEY, JSON.stringify(db));
}

function migrateDb(db) {
  return {
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
