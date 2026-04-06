import { getDefaultSchoolTerm } from "../../services/studentDemo.js";
import { resolveAssetUrl } from "../../services/api.js";
import { resolveOriginalImageForQuestion } from "./originalImageCache.js";

export function inferSchoolTerm(dateLike, grade) {
  if (!dateLike) return "";
  return getDefaultSchoolTerm(dateLike, grade);
}

export function buildStats(summary, listItems) {
  const total = Number(summary?.total_wrong_questions || 0);
  const mastered = Number(summary?.mastered_count || 0);
  const reviewing = Number(summary?.reviewing_count || 0);
  const newCount = Number(summary?.new_count || 0);
  const totalReviews = Number(summary?.study_records_count || 0);
  const masteryRate = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return {
    total,
    new_count: newCount,
    reviewing_count: reviewing,
    mastered_count: mastered,
    mastery_rate: masteryRate,
    total_reviews: totalReviews,
    total_error_count: Number(summary?.total_error_count || 0),
    list_count: Array.isArray(listItems) ? listItems.length : 0,
  };
}

export function formatStudyResult(result) {
  if (result === "correct") return "做对";
  if (result === "incorrect") return "做错";
  if (result === "skipped") return "跳过";
  return result || "-";
}

export function mapWrongQuestionItem(item) {
  const reasons = Array.isArray(item?.error_reasons) ? item.error_reasons : [];
  const firstReason = reasons[0]?.name || "待分析";
  const subjectName = item?.subject?.name || "未分类学科";
  const term = inferSchoolTerm(item?.first_error_date || item?.created_at, item?.grade);
  const originalImage = resolveOriginalImageForQuestion({
    id: item?.id,
    title: item?.title,
    content: item?.content,
    imageData: resolveAssetUrl(item?.original_image_url),
    imageName: "",
  });

  return {
    id: item.id,
    title: item.title || "未命名错题",
    content: item.content || "",
    subject: subjectName,
    subject_id: item?.subject?.id || null,
    term,
    grade: item?.grade || "",
    category: item?.category?.name || "未分类",
    category_id: item?.category?.id || null,
    error_reason: reasons.map((reason) => reason.name).join(" / ") || firstReason,
    error_reason_ids: reasons.map((reason) => reason.id),
    status: item?.status || "new",
    difficulty: item?.difficulty || "medium",
    notes: item?.notes || "",
    is_bookmarked: Boolean(item?.is_bookmarked),
    error_count: Number(item?.error_count || 0),
    review_count: 0,
    image_data: resolveAssetUrl(item?.image_url),
    original_image_data: originalImage?.data || "",
  };
}
