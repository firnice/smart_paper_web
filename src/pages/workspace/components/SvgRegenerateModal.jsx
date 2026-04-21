import useEscapeKey from "../../../hooks/useEscapeKey.js";

function isSvgAsset(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return false;
  return normalized.startsWith("data:image/svg+xml") || normalized.includes(".svg");
}

export default function SvgRegenerateModal({
  item,
  prompt,
  setPrompt,
  submitting,
  onSubmit,
  onClose,
}) {
  useEscapeKey(Boolean(item), onClose);

  if (!item) return null;

  const hasOriginalImage = Boolean(item.original_image_data);
  const hasLatestSvg = Boolean(item.svg_data) || isSvgAsset(item.image_data);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] overflow-hidden rounded-t-3xl bg-white"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <h3 className="text-[17px] font-bold text-gray-900">重新配图</h3>
            <p className="mt-1 text-[12px] text-gray-500">先填写本次修改要求，再提交生成。</p>
          </div>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500"
            onClick={onClose}
            disabled={submitting}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-5 pb-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[14px] font-semibold text-slate-900">{item.title || "未命名错题"}</p>
            {item.content && (
              <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-slate-500">{item.content}</p>
            )}
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-[12px] leading-5 text-indigo-700">
            系统会优先参考原图，并在有最新 SVG 时基于当前 SVG 增量修改。
          </div>

          {!hasOriginalImage && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-5 text-amber-700">
              当前没有保留原图，将退回使用现有配图作为参考。
            </div>
          )}

          {!hasLatestSvg && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[12px] leading-5 text-slate-500">
              当前没有最新 SVG 版本，本次会按“原图 + 修改要求”重新生成。
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-gray-500">本次修改要求</label>
            <textarea
              rows={5}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] text-gray-900 outline-none focus:border-indigo-400 focus:bg-white"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="例如：保持整体结构不变，只把下方括号改宽一点，并和原图位置对齐。"
              autoFocus
            />
            <p className="mt-2 text-[12px] text-gray-400">
              不填写修改要求时，不会直接重新生成。
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="flex-1 rounded-xl border border-gray-200 py-3 text-[14px] font-semibold text-gray-500"
              onClick={onClose}
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl py-3 text-[14px] font-bold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
              disabled={submitting || !String(prompt || "").trim()}
            >
              {submitting ? "生成中..." : "确认重新配图"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
