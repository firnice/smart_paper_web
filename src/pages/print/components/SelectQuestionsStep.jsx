export default function SelectQuestionsStep({
  loading,
  error,
  questions,
  filteredQuestions,
  selectedIds,
  search,
  onSearchChange,
  onToggleQuestion,
  onNext,
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
              使用真实错题列表。图片题直接展示原图，不再额外显示“含图”标签。
            </p>
          </div>
          <div className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-[13px] font-medium text-slate-600">
            已选 {selectedQuestions.length} 题
          </div>
        </div>

        <div className="border-b border-[#F0F0F0] bg-[#FAFAFA] px-5 py-3">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="搜索学科、题干、错因或分类"
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
                return (
                  <label
                    key={question.id}
                    className={`grid cursor-pointer gap-4 rounded-xl border p-4 transition md:grid-cols-[20px_minmax(0,1fr)] ${
                      selected
                        ? "border-indigo-300 bg-indigo-50/70 shadow-[0_4px_12px_rgba(99,91,255,0.08)]"
                        : "border-[#F0F0F0] bg-white hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(event) => onToggleQuestion(question.id, event.target.checked)}
                      className="mt-1 h-4 w-4 accent-indigo-600"
                    />
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-600">
                          {question.subject}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                          {question.grade}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-md bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {question.mastery}
                        </span>
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
                  </label>
                );
              })
            : null}
        </div>

      </section>
    </div>
  );
}
