/**
 * 学期工具函数
 * 格式：2025上学期 / 2025下学期
 * 规则：2-7月 = 上学期，8-1月 = 下学期
 * 中国中小学惯例：上学期（秋季，9月-次年1月），下学期（春季，2月-7月）
 * 此处按常见习惯：上学期=秋季开学（年份为开学年），下学期=春季
 */

/**
 * 根据日期推算当前学期
 * 1-7月 → 下学期（当年）
 * 8-12月 → 上学期（当年，即本学年第一学期）
 */
export function getCurrentTerm(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  // 8-12月：本年上学期；1-7月：本年下学期
  return month >= 8 ? `${year}上学期` : `${year}下学期`;
}

/**
 * 生成学生从入学到现在经历的学期列表（倒序，最新在前）
 * grade: "高一" | "高二" | "高三" | "初一" 等
 */
export function getTermList(grade) {
  const GRADE_OFFSET = {
    初一: 0, 初二: 1, 初三: 2,
    高一: 0, 高二: 1, 高三: 2,
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const offset = GRADE_OFFSET[grade] ?? 0;

  // 推算入学年份（秋季开学）
  // 当前若是上学期（8-12月），入学年份 = 当前年 - offset
  // 当前若是下学期（1-7月），入学年份 = 当前年 - offset - 1（因为上学期已过）
  const enrollYear = currentMonth >= 8
    ? currentYear - offset
    : currentYear - offset - 1;

  const terms = [];
  for (let y = enrollYear; y <= currentYear; y++) {
    // 上学期（秋季，8-12月，该年开学）
    if (y < currentYear || (y === currentYear && currentMonth >= 8)) {
      terms.push(`${y}上学期`);
    }
    // 下学期（次年春季，1-7月）
    if (y < currentYear || (y === currentYear && currentMonth <= 7)) {
      terms.push(`${y}下学期`);
    }
  }

  // 去重倒序，最新在前
  return [...new Set(terms)].reverse();
}

/**
 * 简短显示，如 "25上" "26下"
 */
export function shortTerm(term) {
  return term.replace(/(\d{4})(上|下)学期/, (_, y, s) => `${String(y).slice(2)}${s}`);
}
