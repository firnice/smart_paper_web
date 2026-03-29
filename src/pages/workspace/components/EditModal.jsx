export default function EditModal({ editingItem, editForm, setEditForm, errorReasonOptions, onSubmitEdit, onClose }) {
  if (!editingItem) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] overflow-hidden rounded-t-3xl bg-white"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <h3 className="text-[17px] font-bold text-gray-900">编辑错题</h3>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmitEdit} className="px-5 pb-8 space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-gray-500">标题</label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] text-gray-900 outline-none focus:border-indigo-400 focus:bg-white"
              value={editForm.title}
              onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="错题标题"
            />
          </div>

          {/* Status */}
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-gray-500">掌握状态</label>
            <div className="flex gap-2">
              {[
                { value: "new", label: "未掌握", color: "#EF4444", bg: "#FEF2F2" },
                { value: "reviewing", label: "复习中", color: "#F59E0B", bg: "#FFFBEB" },
                { value: "mastered", label: "已掌握", color: "#10B981", bg: "#ECFDF5" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition"
                  style={
                    editForm.status === opt.value
                      ? { background: opt.color, color: "#fff" }
                      : { background: opt.bg, color: opt.color }
                  }
                  onClick={() => setEditForm((prev) => ({ ...prev, status: opt.value }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-gray-500">备注</label>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] text-gray-900 outline-none focus:border-indigo-400 focus:bg-white"
              value={editForm.notes}
              onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="补充备注（可选）"
            />
          </div>

          {/* Bookmark toggle */}
          <div
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
            onClick={() => setEditForm((prev) => ({ ...prev, is_bookmarked: !prev.is_bookmarked }))}
          >
            <div
              className="flex h-5 w-5 items-center justify-center rounded border-2 transition"
              style={editForm.is_bookmarked ? { borderColor: "#6366F1", background: "#6366F1" } : { borderColor: "#D1D5DB", background: "#fff" }}
            >
              {editForm.is_bookmarked && (
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="h-3 w-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-[14px] font-medium text-gray-700">收藏此错题</span>
          </div>

          {/* Error reasons */}
          {errorReasonOptions.length > 0 && (
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-gray-500">错误原因（可多选）</label>
              <div className="flex flex-wrap gap-2">
                {errorReasonOptions.map((item) => {
                  const checked = editForm.error_reason_ids.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="rounded-xl px-3 py-2 text-[13px] font-medium transition"
                      style={
                        checked
                          ? { background: "#6366F1", color: "#fff" }
                          : { background: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB" }
                      }
                      onClick={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          error_reason_ids: checked
                            ? prev.error_reason_ids.filter((id) => id !== item.id)
                            : [...prev.error_reason_ids, item.id],
                        }))
                      }
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="flex-1 rounded-xl border border-gray-200 py-3 text-[14px] font-semibold text-gray-500"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl py-3 text-[14px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
            >
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
