import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Printer, CheckCircle2, ChevronDown } from "lucide-react";
import { MOCK_QUESTIONS } from "../data/figmaMock.js";

const MODES = [
  { id: "simple", label: "仅原题", desc: "3道原题" },
  { id: "medium", label: "适中练习", desc: "原题 + 1道变式" },
  { id: "intensive", label: "强化训练", desc: "原题 + 3道变式" },
];

export default function PrintPage() {
  const navigate = useNavigate();
  const selectedQuestions = MOCK_QUESTIONS.slice(0, 3);
  const [mode, setMode] = useState("medium");
  const [hideAnswers, setHideAnswers] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const resolvedModes = MODES.map((item) => ({
    ...item,
    count:
      item.id === "simple"
        ? selectedQuestions.length
        : item.id === "medium"
          ? selectedQuestions.length * 2
          : selectedQuestions.length * 4,
  }));

  const currentMode = resolvedModes.find((item) => item.id === mode) || resolvedModes[1];

  const handleGenerate = () => {
    setIsGenerating(true);
    window.setTimeout(() => {
      setIsGenerating(false);
      setIsDone(true);
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-4">
      <div className="pt-2 pb-2">
        <h1 className="text-2xl font-bold text-gray-900">组卷打印</h1>
        <p className="mt-1 text-sm text-gray-500">已选 {selectedQuestions.length} 道错题</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">已选题目</span>
          <button onClick={() => navigate("/bank")} className="text-sm font-medium text-indigo-600">
            重新选择
          </button>
        </div>
        <div className="space-y-2">
          {selectedQuestions.map((question, index) => (
            <div key={question.id} className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
              <span className="mt-0.5 text-xs font-medium text-gray-500">{index + 1}.</span>
              <div className="min-w-0 flex-1">
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                  {question.subject}
                </span>
                <p className="mt-1 line-clamp-2 text-sm text-gray-900">{question.originalText}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">选择打印模式</h3>
        <div className="space-y-2">
          {resolvedModes.map((item) => (
            <div
              key={item.id}
              onClick={() => setMode(item.id)}
              className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                mode === item.id ? "border-indigo-600 bg-indigo-50" : "border-gray-200 bg-white hover:border-indigo-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className={`font-semibold ${mode === item.id ? "text-indigo-900" : "text-gray-900"}`}>
                      {item.label}
                    </span>
                    <span className="text-xs text-gray-500">{item.desc}</span>
                  </div>
                  <div className="text-sm text-gray-600">共 {item.count} 道题</div>
                </div>
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    mode === item.id ? "border-indigo-600 bg-indigo-600" : "border-gray-300"
                  }`}
                >
                  {mode === item.id ? <div className="h-2 w-2 rounded-full bg-white" /> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <button onClick={() => setShowSettings((value) => !value)} className="flex w-full items-center justify-between px-5 py-4">
          <span className="text-sm font-medium text-gray-900">高级设置</span>
          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showSettings ? "rotate-180" : ""}`} />
        </button>

        {showSettings ? (
          <div className="space-y-4 border-t border-gray-100 px-5 pt-4 pb-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">隐藏参考答案</span>
              <button
                onClick={() => setHideAnswers((value) => !value)}
                className={`relative h-6 w-12 rounded-full transition-colors ${hideAnswers ? "bg-indigo-600" : "bg-gray-300"}`}
              >
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${hideAnswers ? "left-6" : "left-0.5"}`}
                />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {!isDone ? (
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 font-semibold text-white shadow-lg transition-all hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {isGenerating ? (
            <span className="animate-pulse">正在生成试卷...</span>
          ) : (
            <>
              <Printer className="h-5 w-5" />
              生成 {currentMode.count} 道题试卷
            </>
          )}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 py-2 font-medium text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
            试卷已生成
          </div>
          <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 font-semibold text-white shadow-lg transition-all hover:bg-indigo-700">
            <Printer className="h-5 w-5" />
            立即打印
          </button>
          <button
            onClick={() => setIsDone(false)}
            className="w-full rounded-2xl border-2 border-gray-200 bg-white py-3 font-medium text-gray-700 transition-all hover:bg-gray-50"
          >
            重新设置
          </button>
        </div>
      )}

      {!isDone ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">💡 生成后可预览试卷布局，支持调整排版后再打印</p>
        </div>
      ) : null}
    </div>
  );
}
