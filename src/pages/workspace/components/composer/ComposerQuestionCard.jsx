import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  EyeOff,
  FileImage,
  Loader2,
  RefreshCw,
  Trash2,
  Wand2,
} from "lucide-react";
import AutoTextarea from "./AutoTextarea.jsx";

export default function ComposerQuestionCard({
  question,
  paperImageUrl,
  subjectOptions,
  errorTypeOptions,
  isPaperExpanded,
  isPromptExpanded,
  onToggleSelect,
  onChangeField,
  onTogglePaper,
  onOpenSvgCrop,
  onTogglePrompt,
  onGenerateSvg,
  onDeleteSvg,
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white transition-all duration-200 ${
        question.selected
          ? "border-blue-200 ring-1 ring-blue-100"
          : "border-gray-200"
      }`}
      style={!question.selected ? { opacity: 0.55 } : undefined}
    >
      <div className="flex gap-3 p-4">
        <div className="flex-shrink-0 pt-0.5">
          <button
            type="button"
            className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
              question.selected
                ? "border-blue-600 bg-blue-600"
                : "border-gray-300 bg-white hover:border-blue-400"
            }`}
            onClick={() => onToggleSelect(question.id)}
          >
            {question.selected ? <Check className="h-3 w-3 text-white" /> : null}
          </button>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <AutoTextarea
            value={question.text}
            className="w-full resize-none overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm leading-relaxed text-gray-800 outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-blue-500"
            onChange={(event) => onChangeField(question.id, "text", event.target.value)}
          />

          {question.svgStatus === "loading" ? (
            <div className="rounded-b-xl border border-t-0 border-purple-100 bg-gradient-to-b from-purple-50/70 to-white px-4 py-5">
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                SVG 生成中...
              </span>
            </div>
          ) : null}

          {question.svgStatus === "error" ? (
            <div className="rounded-b-xl border border-t-0 border-red-100 bg-red-50/70 px-4 py-4">
              <span className="inline-flex items-center gap-1.5 text-xs text-red-500">
                <AlertCircle className="h-3.5 w-3.5" />
                配图生成失败，可在下方重新发起
              </span>
            </div>
          ) : null}

          {question.svgStatus === "generated" ? (
            <div className="overflow-hidden rounded-b-xl border border-t-0 border-purple-100 bg-gradient-to-b from-purple-50/60 to-white">
              <div className="flex items-center justify-center bg-white px-4 py-4">
                <img src={question.svgPreviewUrl} alt={`第${question.id}题 SVG`} className="max-h-64 w-full object-contain" />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-gray-200 px-4 py-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white pl-2 focus-within:ring-2 focus-within:ring-blue-500">
            <span className="whitespace-nowrap text-xs text-gray-400">科目</span>
            <select
              value={question.subject}
              className="rounded-lg bg-transparent py-1.5 pr-2 text-sm text-gray-700 outline-none"
              onChange={(event) => onChangeField(question.id, "subject", event.target.value)}
            >
              {subjectOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

<label className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white pl-2 focus-within:ring-2 focus-within:ring-blue-500">
            <span className="whitespace-nowrap text-xs text-gray-400">错误类型</span>
            <select
              value={question.errorType}
              className="rounded-lg bg-transparent py-1.5 pr-2 text-sm text-gray-700 outline-none"
              onChange={(event) => onChangeField(question.id, "errorType", event.target.value)}
            >
              {errorTypeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="flex min-w-40 flex-1 items-center gap-1 rounded-lg border border-gray-200 bg-white pl-2 focus-within:ring-2 focus-within:ring-blue-500">
            <span className="whitespace-nowrap text-xs text-gray-400">错误原因</span>
            <input
              type="text"
              list="composer-reason-options"
              value={question.reason}
              placeholder="填写原因"
              className="flex-1 bg-transparent py-1.5 pr-2 text-sm text-gray-700 outline-none"
              onChange={(event) => onChangeField(question.id, "reason", event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1">
          {question.svgStatus === "generated" ? (
            <>
              <button
                type="button"
                onClick={() => onTogglePrompt(question.id)}
                className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs text-gray-500 transition-colors hover:bg-purple-100 hover:text-purple-700"
              >
                <RefreshCw className="h-3 w-3" />
                重新生成
                {isPromptExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              <button
                type="button"
                onClick={() => onDeleteSvg(question.id)}
                className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
                删除
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onOpenSvgCrop(question.id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors ${
                question.svgStatus === "error"
                  ? "text-red-500 hover:bg-red-50 hover:text-red-700"
                  : question.svgStatus === "loading"
                    ? "text-gray-400"
                    : "text-purple-600 hover:bg-purple-50 hover:text-purple-800"
              }`}
              disabled={question.svgStatus === "loading"}
            >
              {question.svgStatus === "error" ? <AlertCircle className="h-3.5 w-3.5" /> : <Wand2 className="h-3.5 w-3.5" />}
              {question.svgStatus === "error" ? "重新生成" : question.svgStatus === "loading" ? "生成中..." : "生成配图"}
            </button>
          )}

          <button
            type="button"
            onClick={() => onTogglePaper(question.id)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
              isPaperExpanded
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
          >
            {isPaperExpanded ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                收起原题
              </>
            ) : (
              <>
                <FileImage className="h-3.5 w-3.5" />
                查看原题
              </>
            )}
          </button>
        </div>
      </div>

      {isPromptExpanded ? (
        <div className="border-t border-purple-100 px-4 pt-3 pb-4">
          <p className="mb-2 text-xs text-gray-400">调整提示词后重新生成配图：</p>
          <div className="flex items-start gap-2">
            <textarea
              rows={2}
              value={question.prompt}
              className="flex-1 resize-none rounded-lg border border-purple-200 bg-white p-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-purple-400"
              onChange={(event) => onChangeField(question.id, "prompt", event.target.value)}
            />
            <button
              type="button"
              onClick={() => onGenerateSvg(question.id)}
              className="whitespace-nowrap rounded-lg bg-purple-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-purple-700"
            >
              确认生成
            </button>
          </div>
        </div>
      ) : null}

      {isPaperExpanded && paperImageUrl ? (
        <div className="h-[480px] border-t border-gray-200 bg-gray-900">
          <img src={paperImageUrl} alt="原始试卷" className="h-full w-full object-contain" />
        </div>
      ) : null}
    </div>
  );
}
