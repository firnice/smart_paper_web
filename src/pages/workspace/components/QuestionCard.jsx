import { useState } from "react";
import { Dumbbell, Trash2, Pencil, Bookmark, BookmarkCheck, CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react";

const STATUS_STYLE = {
  new: { bg: "#FEF2F2", color: "#EF4444", label: "未掌握" },
  reviewing: { bg: "#FFFBEB", color: "#F59E0B", label: "复习中" },
  mastered: { bg: "#ECFDF5", color: "#10B981", label: "已掌握" },
};

const SUBJECT_COLORS = {
  数学: { bg: "#EEF2FF", color: "#6366F1" },
  语文: { bg: "#FEF3C7", color: "#D97706" },
  英语: { bg: "#ECFDF5", color: "#059669" },
  科学: { bg: "#EFF6FF", color: "#3B82F6" },
  物理: { bg: "#F5F3FF", color: "#7C3AED" },
  化学: { bg: "#FFF7ED", color: "#EA580C" },
  生物: { bg: "#F0FDF4", color: "#16A34A" },
  历史: { bg: "#FFF1F2", color: "#E11D48" },
  地理: { bg: "#F0FDFA", color: "#0D9488" },
};

function getSubjectStyle(subject) {
  return SUBJECT_COLORS[subject] || { bg: "#F3F4F6", color: "#6B7280" };
}

export default function QuestionCard({
  item,
  studyRecords,
  studyRecordTotal,
  onPractice,
  onChangeStatus,
  onToggleBookmark,
  onStartEdit,
  onDelete,
}) {
  const [showQuickTrain, setShowQuickTrain] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const status = STATUS_STYLE[item.status] || STATUS_STYLE.new;
  const subjectStyle = getSubjectStyle(item.subject);
  const total = studyRecordTotal ?? (studyRecords || []).length;
  const isMastered = item.status === "mastered";

  return (
    <article
      className="mb-3 overflow-hidden rounded-2xl bg-white"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.05)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {item.subject && (
            <span
              className="rounded-lg px-2.5 py-1 text-[12px] font-bold"
              style={{ background: subjectStyle.bg, color: subjectStyle.color }}
            >
              {item.subject}
            </span>
          )}
          {item.term && (
            <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[12px] font-medium text-gray-500">
              {item.term}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mastery status dot badge */}
          <span
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ background: status.bg, color: status.color }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: status.color }} />
            {status.label}
          </span>
          {/* Bookmark */}
          <button
            type="button"
            className="flex items-center justify-center text-gray-300 transition active:scale-90"
            onClick={() => onToggleBookmark(item)}
          >
            {item.is_bookmarked
              ? <BookmarkCheck className="h-4 w-4 text-indigo-400" />
              : <Bookmark className="h-4 w-4" />
            }
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        <p className="mb-2 text-[15px] font-semibold leading-snug text-gray-900 line-clamp-2">
          {item.title || "未命名错题"}
        </p>
        {item.content && (
          <p className="text-[13px] leading-relaxed text-gray-500 line-clamp-3">{item.content}</p>
        )}
        {item.image_data && (
          <div className="mt-3 overflow-hidden rounded-xl bg-gray-50">
            <img
              src={item.image_data}
              alt={item.image_name || item.title}
              className="h-32 w-full object-cover"
            />
          </div>
        )}
      </div>

      {/* View original photo link */}
      {item.image_data && (
        <div className="border-t border-gray-50 px-4 py-2">
          <button
            type="button"
            className="flex items-center gap-1 text-[12px] font-medium text-indigo-500"
            onClick={() => setShowFullImage((v) => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            查看原图
            {showFullImage ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showFullImage && (
            <div className="mt-2 overflow-hidden rounded-xl">
              <img src={item.image_data} alt={item.title} className="w-full" />
            </div>
          )}
        </div>
      )}

      {/* Actions Row */}
      <div className="flex items-center gap-2 border-t border-gray-50 px-4 py-3">
        {/* Mastered Toggle */}
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition active:scale-95"
          style={
            isMastered
              ? { background: "#ECFDF5", color: "#10B981" }
              : { background: "#F3F4F6", color: "#6B7280" }
          }
          onClick={() => onChangeStatus(item.id, isMastered ? "reviewing" : "mastered")}
        >
          {isMastered
            ? <CheckCircle2 className="h-3.5 w-3.5" />
            : <Circle className="h-3.5 w-3.5" />
          }
          {isMastered ? "已掌握" : "标记掌握"}
        </button>

        {/* Quick Train Button */}
        <button
          type="button"
          className="ml-auto flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold text-white transition active:scale-95"
          style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", boxShadow: "0 2px 8px rgba(99,102,241,0.3)" }}
          onClick={() => setShowQuickTrain((v) => !v)}
        >
          <Dumbbell className="h-3.5 w-3.5" />
          快速训练
        </button>
      </div>

      {/* Quick Train Panel */}
      {showQuickTrain && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          <p className="mb-2.5 text-[12px] font-semibold text-gray-400">选择训练方式</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-center transition active:scale-95"
              onClick={() => { onPractice(item.id, "correct"); setShowQuickTrain(false); }}
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="text-[11px] font-semibold text-gray-700">本次做对</span>
            </button>
            <button
              type="button"
              className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-center transition active:scale-95"
              onClick={() => { onPractice(item.id, "incorrect"); setShowQuickTrain(false); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} className="h-5 w-5">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" d="M15 9l-6 6M9 9l6 6" />
              </svg>
              <span className="text-[11px] font-semibold text-gray-700">仍然做错</span>
            </button>
            <button
              type="button"
              className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 py-3 text-center transition active:scale-95"
              onClick={() => setShowQuickTrain(false)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth={2} className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-[11px] font-semibold text-indigo-600">
                AI 变式
                <span className="ml-0.5 inline-block rounded bg-indigo-500 px-1 text-[9px] text-white">New</span>
              </span>
            </button>
          </div>
          {total > 0 && (
            <p className="mt-2 text-center text-[11px] text-gray-400">累计练习 {total} 次</p>
          )}
        </div>
      )}

      {/* Edit / Delete */}
      <div className="flex justify-end gap-4 border-t border-gray-50 px-4 py-2.5">
        <button
          type="button"
          className="flex items-center gap-1 text-[12px] text-gray-400 transition active:text-indigo-500"
          onClick={() => onStartEdit(item)}
        >
          <Pencil className="h-3.5 w-3.5" /> 编辑
        </button>
        <button
          type="button"
          className="flex items-center gap-1 text-[12px] text-gray-400 transition active:text-red-500"
          onClick={() => onDelete(item)}
        >
          <Trash2 className="h-3.5 w-3.5" /> 删除
        </button>
      </div>
    </article>
  );
}
