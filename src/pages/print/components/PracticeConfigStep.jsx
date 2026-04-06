import { ANSWER_MODES, DEFAULT_PROMPT, formatAnswerText } from "../helpers.js";

function StatusPill({ tone = "default", children }) {
  const toneClass =
    tone === "ready"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "loading"
        ? "bg-indigo-50 text-indigo-700"
        : tone === "error"
          ? "bg-rose-50 text-rose-700"
          : "bg-slate-100 text-slate-500";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${toneClass}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

function PracticeCard({
  question,
  index,
  config,
  onToggleAi,
  onToggleVariantSelection,
  onRemoveVariant,
  onPromptChange,
  onOpenPromptEditor,
  onClosePromptEditor,
  onConfirmPrompt,
  onRetryGenerate,
}) {
  const selectedCount = config.items.filter((item) => item.selected !== false).length;
  const statusTone = config.loading ? "loading" : config.error ? "error" : config.gen && config.items.length ? "ready" : "default";
  const statusText = config.loading
    ? "生成中"
    : config.error
      ? "生成失败"
      : config.gen && config.items.length > 0
        ? "已生成"
        : config.gen
          ? "未保留"
          : "仅原题";

  return (
    <article className={`overflow-hidden rounded-[12px] border bg-white transition ${config.gen ? "border-[#B3B0FF] shadow-[0_4px_12px_rgba(99,91,255,0.08)]" : "border-[#E8E8E8]"}`}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-indigo-50 text-[13px] font-semibold text-indigo-600">
            {index + 1}
          </div>
          <div className="min-w-0 flex-1">
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
            <h3 className="text-[14px] font-semibold text-slate-900">{question.title}</h3>
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

            {question.answerAvailable ? (
              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                原题答案：{formatAnswerText({ type: "orig", answer: question.answer })}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-[#F0F0F0] bg-[#FAFAFA] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => onToggleAi(question.id, false)}
              className={`px-4 py-2 text-[13px] font-medium transition ${config.gen ? "text-slate-600" : "bg-indigo-600 text-white"}`}
            >
              仅原题
            </button>
            <button
              type="button"
              onClick={() => onToggleAi(question.id, true)}
              className={`border-l border-slate-200 px-4 py-2 text-[13px] font-medium transition ${config.gen ? "bg-indigo-600 text-white" : "text-slate-600"}`}
            >
              ✦ 补充同类练习
            </button>
          </div>
          <StatusPill tone={statusTone}>{statusText}</StatusPill>
        </div>

        {config.gen && config.items.length > 0 ? (
          <div className="inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <span className="text-[13px] text-slate-500">纳入打印</span>
            <strong className="text-[13px] font-semibold text-slate-900">
              {selectedCount} / {config.items.length}
            </strong>
          </div>
        ) : null}
      </div>

      {config.gen ? (
        <div className="border-t border-indigo-100 bg-[#F8F9FF]">
          {config.loading ? (
            <div className="space-y-4 px-5 py-5">
              <div className="h-2 overflow-hidden rounded-full bg-indigo-100">
                <div className="h-full w-full animate-pulse rounded-full bg-indigo-500" />
              </div>
              <div className="rounded-xl border border-indigo-100 bg-white px-4 py-4">
                <div className="text-sm font-medium text-slate-900">正在请求后端生成 AI 同类题</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">系统正在根据当前题目和 Prompt 生成练习内容，请稍候。</p>
              </div>
            </div>
          ) : null}

          {!config.loading && config.error ? (
            <div className="space-y-3 px-5 py-5">
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {config.error}
              </div>
              <button
                type="button"
                onClick={() => onRetryGenerate(question.id)}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-5 text-[13px] font-medium text-white"
              >
                重新请求后端生成
              </button>
            </div>
          ) : null}

          {!config.loading && !config.error ? (
            <>
              <div className="flex flex-col gap-3 px-5 pt-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-indigo-700">AI 候选练习已就绪</div>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    本次共返回 {config.items.length} 道候选题，当前纳入打印 {selectedCount} 道。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenPromptEditor(question.id)}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
                >
                  ↻ 重新生成
                </button>
              </div>

              {config.editingPrompt ? (
                <div className="space-y-3 px-5 pt-4">
                  <label htmlFor={`prompt-${question.id}`} className="block text-sm font-medium text-slate-900">
                    自定义 Prompt
                  </label>
                  <textarea
                    id={`prompt-${question.id}`}
                    rows={5}
                    value={config.prompt || DEFAULT_PROMPT}
                    onChange={(event) => onPromptChange(question.id, event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                    修改后会直接作为本次重新生成的提示词提交到后端。
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => onClosePromptEditor(question.id)}
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-700"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={() => onConfirmPrompt(question.id)}
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-5 text-[13px] font-medium text-white"
                    >
                      确认生成
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="space-y-3 px-5 py-5">
                {config.items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                    当前没有保留的 AI 练习。你可以重新生成，或切换回“仅原题”。
                  </div>
                ) : null}

                {config.items.map((item, itemIndex) => (
                  <article
                    key={item.id}
                    className={`rounded-xl border p-4 transition ${
                      item.selected !== false
                        ? "border-indigo-100 bg-white"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          item.selected !== false
                            ? "bg-indigo-50 text-indigo-600"
                            : "bg-slate-200 text-slate-600"
                        }`}>
                          {item.selected !== false ? "纳入打印" : "不打印"}
                        </span>
                        <strong className="text-sm text-slate-900">练习 {itemIndex + 1}</strong>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleVariantSelection(question.id, item.id, item.selected === false)}
                          className={`inline-flex h-8 items-center justify-center rounded-lg px-3 text-[12px] font-medium transition ${
                            item.selected !== false
                              ? "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                              : "bg-indigo-600 text-white hover:bg-indigo-700"
                          }`}
                        >
                          {item.selected !== false ? "不纳入打印" : "纳入打印"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveVariant(question.id, item.id)}
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-rose-200 bg-white px-3 text-[12px] font-medium text-rose-600 transition hover:bg-rose-50"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    <div className={item.selected !== false ? "" : "opacity-70"}>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
                          AI 生成
                        </span>
                      </div>
                      <p className="text-sm leading-7 text-slate-700">{item.text}</p>

                      {item.hasImg ? (
                        <div className="mt-4 overflow-hidden rounded-xl border border-[#F0F0F0] bg-slate-50 p-4">
                          {item.imgSvg ? (
                            <div className="[&>svg]:max-h-72 [&>svg]:max-w-full [&>svg]:h-auto" dangerouslySetInnerHTML={{ __html: item.imgSvg }} />
                          ) : (
                            <img src={item.imageUrl} alt={`AI 练习 ${itemIndex + 1}`} className="max-h-72 w-full object-contain" />
                          )}
                        </div>
                      ) : null}

                      {(item.answer || item.hint) ? (
                        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                          {item.answer ? <div>答案：{item.answer}</div> : null}
                          {item.hint ? <div>提示：{item.hint}</div> : null}
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default function PracticeConfigStep({
  selectedQuestions,
  answerMode,
  configsById,
  generatingCount,
  aiReadyCount,
  onBack,
  onNext,
  onAnswerModeChange,
  onToggleAi,
  onToggleVariantSelection,
  onRemoveVariant,
  onPromptChange,
  onOpenPromptEditor,
  onClosePromptEditor,
  onConfirmPrompt,
  onRetryGenerate,
}) {
  return (
    <div className="space-y-4">
      <section className="print-workbench-panel overflow-hidden rounded-[16px] border border-[#F0F0F0] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-4 border-b border-[#F0F0F0] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="text-[14px] font-semibold text-slate-900">答案显示方式</div>
          <div className="flex flex-wrap gap-2 rounded-lg bg-[#F5F5F5] p-1">
            {ANSWER_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => onAnswerModeChange(mode.id)}
                className={`rounded-md px-4 py-2 text-[13px] font-medium transition ${
                  answerMode === mode.id
                    ? "bg-white text-indigo-600 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                    : "text-slate-600"
                }`}
              >
                {mode.title}
              </button>
            ))}
          </div>
        </div>

        <div className="print-workbench-panel-body space-y-4 bg-[#FAFAFA] px-5 py-5">
          {selectedQuestions.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center">
              <div className="text-base font-semibold text-slate-900">还没有选中错题</div>
              <p className="mt-2 text-sm text-slate-500">返回 Step 1 勾选题目后，才能配置练习内容。</p>
            </div>
          ) : null}

          {selectedQuestions.map((question, index) => (
            <PracticeCard
              key={question.id}
              question={question}
              index={index}
              config={configsById[question.id]}
              onToggleAi={onToggleAi}
              onToggleVariantSelection={onToggleVariantSelection}
              onRemoveVariant={onRemoveVariant}
              onPromptChange={onPromptChange}
              onOpenPromptEditor={onOpenPromptEditor}
              onClosePromptEditor={onClosePromptEditor}
              onConfirmPrompt={onConfirmPrompt}
              onRetryGenerate={onRetryGenerate}
            />
          ))}
        </div>

      </section>
    </div>
  );
}
