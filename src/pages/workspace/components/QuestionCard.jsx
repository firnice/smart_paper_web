import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  onChangeStatus,
  onToggleBookmark,
  onStartEdit,
  onDelete,
}) {
  const [showFullImage, setShowFullImage] = useState(false);
  const navigate = useNavigate();

  const status = STATUS_STYLE[item.status] || STATUS_STYLE.new;
  const subjectStyle = getSubjectStyle(item.subject);
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
              className="max-h-72 w-full object-contain"
            />
          </div>
        )}
      </div>

      {/* View original photo link */}
      {item.original_image_data && (
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
              <img
                src={item.original_image_data}
                alt={item.original_image_name || item.title}
                className="max-h-[70vh] w-full object-contain"
              />
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
          onClick={() => onChangeStatus(item.id, isMastered ? "new" : "mastered")}
        >
          {isMastered
            ? <CheckCircle2 className="h-3.5 w-3.5" />
            : <Circle className="h-3.5 w-3.5" />
          }
          {isMastered ? "标记未掌握" : "标记已掌握"}
        </button>

        {/* Quick Train Button */}
        <button
          type="button"
          className="ml-auto flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold text-white transition active:scale-95"
          style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", boxShadow: "0 2px 8px rgba(99,102,241,0.3)" }}
          onClick={() => navigate(`/print?ids=${item.id}`)}
        >
          <Dumbbell className="h-3.5 w-3.5" />
          快速训练
        </button>
      </div>

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
