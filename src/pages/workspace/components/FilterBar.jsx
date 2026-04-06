import { useTerm } from "../../../context/TermContext.jsx";

export default function FilterBar({ filters, setFilters, filterSubjectOptions }) {
  const { currentTerm } = useTerm();

  const statusOptions = [
    { value: "", label: "全部" },
    { value: "new", label: "未掌握" },
    { value: "mastered", label: "已掌握" },
  ];

  return (
    <div className="mb-5 space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
      {/* Current term indicator */}
      {currentTerm && (
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-gray-400">当前学期</span>
          <span
            className="rounded-full px-2.5 py-0.5 text-[12px] font-semibold"
            style={{ background: "#EEF2FF", color: "#6366F1" }}
          >
            {currentTerm.name}
          </span>
          <span className="text-[11px] text-gray-400">（在「我的」页面切换）</span>
        </div>
      )}

      {/* Segmented Control: 掌握状态 */}
      <div
        className="flex rounded-2xl p-1"
        style={{ background: "rgba(99,102,241,0.08)" }}
      >
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className="flex-1 rounded-lg py-1.5 text-[13px] font-semibold transition-all"
            style={
              filters.status === opt.value
                ? { background: "#6366F1", color: "#fff", boxShadow: "0 2px 6px rgba(99,102,241,0.3)" }
                : { background: "transparent", color: "#6B7280" }
            }
            onClick={() => setFilters((prev) => ({ ...prev, status: opt.value }))}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Dropdowns Row */}
      <div className="grid gap-3">
        <div className="relative flex-1">
          <select
            className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-7 text-[13px] font-medium text-gray-700 outline-none"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
            value={filters.subject}
            onChange={(e) => setFilters((prev) => ({ ...prev, subject: e.target.value }))}
          >
            <option value="">全部学科</option>
            {filterSubjectOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Keyword search */}
      <div className="relative">
        <svg className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-[13px] text-gray-700 outline-none"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
          placeholder="搜索标题 / 内容 / 错误原因"
          value={filters.keyword}
          onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
        />
      </div>
    </div>
  );
}
