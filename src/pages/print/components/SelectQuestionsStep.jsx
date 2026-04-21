import { formatShortDate } from "../helpers.js";

function renderMetaBadge(text, tone = "slate") {
  const toneClassMap = {
    indigo: "bg-indigo-50 text-indigo-600",
    slate: "bg-slate-100 text-slate-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <span className={`rounded-md px-2.5 py-1 text-[11px] font-medium ${toneClassMap[tone] || toneClassMap.slate}`}>
      {text}
    </span>
  );
}

function PrintedBadge({ question }) {
  if (!question?.hasBeenPrinted) return null;
  const dateText = formatShortDate(question.lastPrintedAt);
  const suffix = dateText ? ` · 最近 ${dateText}` : "";
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      已打印 {question.printCount} 次{suffix}
    </span>
  );
}

function FullQuestionCard({ question }) {
  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap gap-2">
        {renderMetaBadge(question.subject, "indigo")}
        {renderMetaBadge(question.grade)}
        <span className="inline-flex items-center gap-2 rounded-md bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-600">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {question.mastery}
        </span>
        <PrintedBadge question={question} />
      </div>
      <h4 className="text-[14px] font-semibold text-slate-900">{question.title}</h4>
      <p className="mt-2 whitespace-pre-line text-[14px] leading-7 text-slate-700">{question.content}</p>

      {question.hasImg ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-[#F0F0F0] bg-slate-50 p-4">
          <img
            src={question.imageUrl}
            alt={question.imageName || question.title}
            className="max-h-80 w-full object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}

function CompactQuestionCard({ question }) {
  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap gap-2">
        {renderMetaBadge(question.subject, "indigo")}
        {renderMetaBadge(question.grade)}
        {renderMetaBadge(question.category, "amber")}
        <span className="inline-flex items-center gap-2 rounded-md bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-600">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {question.mastery}
        </span>
        <PrintedBadge question={question} />
      </div>
      <h4 className="text-[14px] font-semibold leading-6 text-slate-900 line-clamp-1">{question.title}</h4>
      <p className="mt-2 text-[13px] leading-6 text-slate-600 line-clamp-2">{question.content}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-slate-500">
        <span>错因：{question.errorReason}</span>
        {question.term ? <span>学期：{question.term}</span> : null}
      </div>
    </div>
  );
}

function ListQuestionRow({ question }) {
  return (
    <>
      <span className="inline-flex h-7 items-center justify-center rounded-md bg-indigo-50 px-2 text-[11px] font-medium text-indigo-600">
        {question.subject}
      </span>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold text-slate-900">{question.title}</div>
      </div>
      <div className="hidden truncate text-[12px] text-slate-500 md:block">{question.category}</div>
      <div className="hidden text-[12px] text-slate-500 md:block">{question.grade}</div>
      <div className="hidden md:block">
        <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-600">
          {question.mastery}
        </span>
      </div>
      <div className="hidden md:block">
        <PrintedBadge question={question} />
      </div>
    </>
  );
}

export default function SelectQuestionsStep({
  loading,
  error,
  questions,
  filteredQuestions,
  selectedIds,
  search,
  subjectFilter,
  subjectOptions,
  viewMode,
  viewModes,
  onSearchChange,
  onSubjectFilterChange,
  onViewModeChange,
  onToggleQuestion,
  onRefresh,
}) {
  const selectedQuestions = questions.filter((item) => selectedIds.includes(item.id));

  return (
    <div>
      <section className="print-workbench-panel overflow-hidden rounded-[16px] border border-[#F0F0F0] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-4 border-b border-[#F0F0F0] px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Step 1 · 选择要打印的错题</h2>
            <p className="mt-2 text-[13px] leading-6 text-slate-500">
              支持全信息、简略信息、列表形式三种展示密度，便于在首屏快速挑题。
            </p>
          </div>
          <div className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-[13px] font-medium text-slate-600">
            已选 {selectedQuestions.length} 题
          </div>
        </div>

        <div className="border-b border-[#F0F0F0] bg-[#FAFAFA] px-5 py-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex flex-1 flex-col gap-3 md:flex-row">
              <div className="relative">
                <select
                  value={subjectFilter}
                  onChange={(e) => onSubjectFilterChange(e.target.value)}
                  className="h-10 appearance-none rounded-lg border border-slate-200 bg-white py-0 pl-3 pr-8 text-[13px] font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
                >
                  <option value="">全部学科</option>
                  {subjectOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="搜索题干、错因或分类"
                className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-4 text-[13px] text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
              >
                刷新数据
              </button>
            </div>

            <div className="print-workbench-view-switch">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onViewModeChange(mode.id)}
                  className={viewMode === mode.id ? "is-active" : ""}
                >
                  {mode.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="print-workbench-panel-body space-y-4 px-5 py-4">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-12 text-center text-sm text-slate-500">
              正在加载真实错题列表...
            </div>
          ) : null}

          {!loading && filteredQuestions.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-12 text-center">
              <div className="text-base font-semibold text-slate-900">没有找到匹配题目</div>
              <p className="mt-2 text-sm text-slate-500">换个关键词，或刷新后再试。</p>
            </div>
          ) : null}

          {!loading
            ? filteredQuestions.map((question) => {
                const selected = selectedIds.includes(question.id);
                const isListMode = viewMode === "list";

                return (
                  <label
                    key={question.id}
                    className={`cursor-pointer rounded-xl border transition ${
                      selected
                        ? "border-indigo-300 bg-indigo-50/70 shadow-[0_4px_12px_rgba(99,91,255,0.08)]"
                        : "border-[#F0F0F0] bg-white hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                    } ${
                      isListMode
                        ? "grid items-center gap-3 px-3 py-3 grid-cols-[20px_72px_minmax(0,1fr)] md:grid-cols-[20px_92px_minmax(0,1fr)_112px_88px_96px_140px]"
                        : "grid gap-4 p-4 md:grid-cols-[20px_minmax(0,1fr)]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(event) => onToggleQuestion(question.id, event.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-indigo-600"
                    />

                    {viewMode === "full" ? <FullQuestionCard question={question} /> : null}
                    {viewMode === "compact" ? <CompactQuestionCard question={question} /> : null}
                    {viewMode === "list" ? <ListQuestionRow question={question} /> : null}
                  </label>
                );
              })
            : null}
        </div>
      </section>
    </div>
  );
}
