import { useState } from "react";
import { ANSWER_MODES, formatAnswerText } from "../helpers.js";

function SidebarCard({ title, children }) {
  return (
    <section className="rounded-[12px] border border-[#F0F0F0] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <h3 className="mb-4 border-b border-[#F0F0F0] pb-3 text-[14px] font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

function PreviewQuestion({ item, index, answerMode, isDragging, onMove, onDelete, onDragStart, onDragEnd }) {
  return (
    <article className={`print-workbench-question rounded-[18px] border border-transparent bg-white p-5 ${isDragging ? "dragging" : ""}`} data-preview-id={item.id}>
      <div className="print-workbench-toolbar print-workbench-screen-only">
        <button type="button" draggable onDragStart={onDragStart} onDragEnd={onDragEnd} title="拖拽排序">
          ↕
        </button>
        <button type="button" onClick={() => onMove(item.id, -1)} title="上移">
          ↑
        </button>
        <button type="button" onClick={() => onMove(item.id, 1)} title="下移">
          ↓
        </button>
        <button type="button" onClick={() => onDelete(item.id)} title="删除">
          ✕
        </button>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${item.type === "orig" ? "bg-slate-100 text-slate-600" : "bg-indigo-50 text-indigo-600"}`}>
          {item.type === "orig" ? "原题" : "AI 生成"}
        </span>
        <strong className="text-base text-black">{index + 1}.</strong>
      </div>

      <div className="text-sm leading-8 text-black">
        <p>{item.text}</p>
        {item.hasImg ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {item.imgSvg ? (
              <div className="[&>svg]:max-h-[340px] [&>svg]:max-w-full [&>svg]:h-auto" dangerouslySetInnerHTML={{ __html: item.imgSvg }} />
            ) : (
              <img src={item.imageUrl} alt={`第 ${index + 1} 题插图`} className="max-h-[340px] w-full object-contain" />
            )}
          </div>
        ) : null}
        {answerMode === "inline" && item.answerAvailable ? (
          <div className="mt-4 rounded-2xl border-l-4 border-slate-400 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            参考答案：{formatAnswerText(item)}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function PreviewArrangeStep({
  previewItems,
  answerMode,
  estimatedPages,
  exporting,
  exportUrl,
  onBack,
  onExport,
  onMoveItem,
  onDeleteItem,
  onReorderItems,
}) {
  const [draggingId, setDraggingId] = useState("");
  const answerModeTitle = ANSWER_MODES.find((item) => item.id === answerMode)?.title;
  const origCount = previewItems.filter((item) => item.type === "orig").length;
  const aiCount = previewItems.filter((item) => item.type === "ai").length;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="print-workbench-panel overflow-hidden rounded-[16px] border border-[#F0F0F0] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="print-workbench-screen-only border-b border-[#F0F0F0] px-5 py-5">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Step 3 · 预览与排版</h2>
            <p className="mt-2 text-[13px] leading-6 text-slate-500">
              支持拖拽排序、上移下移和删除，题号会自动连续重排。
            </p>
          </div>
        </div>

        <div className="print-workbench-screen-only border-b border-[#F0F0F0] bg-[#FAFAFA] px-5 py-3 text-[13px] leading-6 text-slate-500">
          导出时会按当前预览顺序与答案方式生成正式 PDF 文件。
        </div>

        <div className="print-workbench-preview-canvas print-workbench-panel-body p-5">
          <article className="print-workbench-sheet mx-auto rounded-[10px] bg-white p-10">
            <h1 className="text-center text-[28px] font-black text-black">智能错题本 · 打印重做包</h1>
            <div className="mt-6 grid gap-4 border-b-2 border-slate-900 pb-5 text-sm text-slate-900 md:grid-cols-3">
              <div className="flex items-center gap-2">
                <span>姓名</span>
                <span className="h-px flex-1 bg-slate-300" />
              </div>
              <div className="flex items-center gap-2">
                <span>班级</span>
                <span className="h-px flex-1 bg-slate-300" />
              </div>
              <div className="flex items-center gap-2">
                <span>日期</span>
                <span className="h-px flex-1 bg-slate-300" />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {previewItems.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-12 text-center">
                  <div className="text-base font-semibold text-slate-900">试卷里还没有内容</div>
                  <p className="mt-2 text-sm text-slate-500">返回前两步选择题目或启用 AI 练习。</p>
                </div>
              ) : null}

              {previewItems.map((item, index) => (
                <div
                  key={item.id}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const fromId = event.dataTransfer.getData("text/plain");
                    setDraggingId("");
                    if (fromId && fromId !== item.id) {
                      onReorderItems(fromId, item.id);
                    }
                  }}
                >
                  <PreviewQuestion
                    item={item}
                    index={index}
                    answerMode={answerMode}
                    isDragging={draggingId === item.id}
                    onMove={onMoveItem}
                    onDelete={onDeleteItem}
                    onDragStart={(event) => {
                      setDraggingId(item.id);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", item.id);
                    }}
                    onDragEnd={() => setDraggingId("")}
                  />
                </div>
              ))}
            </div>

            {answerMode === "sheet" && previewItems.length > 0 ? (
              <section className="mt-8 break-before-page border-t-2 border-dashed border-slate-300 pt-6">
                <h3 className="text-xl font-black text-black">参考答案</h3>
                <ol className="mt-4 space-y-3 pl-6 text-sm leading-7 text-slate-900">
                  {previewItems.map((item, index) => (
                    <li key={`answer-${item.id}`}>
                      <strong>{index + 1}.</strong> {formatAnswerText(item)}
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </article>
        </div>

      </section>

      <aside className="print-workbench-screen-only xl:sticky xl:top-6 xl:self-start">
        <SidebarCard title="导出确认">
          <div className="space-y-1">
            <div className="flex items-center justify-between py-3 text-sm">
              <span className="text-slate-500">最终题数</span>
              <strong className="text-indigo-600">{previewItems.length} 题</strong>
            </div>
            <div className="flex items-center justify-between border-t border-[#F5F5F5] py-3 text-sm">
              <span className="text-slate-500">原题 / AI 题</span>
              <strong className="text-slate-900">
                {origCount} / {aiCount}
              </strong>
            </div>
            <div className="flex items-center justify-between border-t border-[#F5F5F5] py-3 text-sm">
              <span className="text-slate-500">预计页数</span>
              <strong className="text-slate-900">{estimatedPages} 页</strong>
            </div>
            <div className="flex items-center justify-between border-t border-[#F5F5F5] py-3 text-sm">
              <span className="text-slate-500">答案方式</span>
              <strong className="text-slate-900">{answerModeTitle}</strong>
            </div>
          </div>
          <p className="mt-4 text-[13px] leading-6 text-slate-500">
            预览区的排序和删除结果会直接带入本次导出。
          </p>
          {exportUrl ? (
            <a
              href={exportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-[13px] font-medium text-indigo-600 transition hover:text-indigo-700"
            >
              查看最近一次导出结果
            </a>
          ) : null}
        </SidebarCard>
      </aside>
    </div>
  );
}
