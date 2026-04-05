import { useState } from "react";
import { Settings2, FileText } from "lucide-react";
import { MOCK_QUESTIONS } from "../data/figmaMock.js";

const COMPOSITION_MODES = [
  { id: "original", label: "仅重做原题", desc: "不含拓展" },
  { id: "variant", label: "原题 + 变式", desc: "巩固与延伸" },
  { id: "variant_only", label: "仅测变式题", desc: "全新挑战" },
];

const SORT_MODES = [
  { id: "by_subject", label: "按原题归类" },
  { id: "random", label: "随机混合打乱" },
];

const VARIANT_COUNTS = [1, 2, 3];

const PAPER_QUESTIONS = MOCK_QUESTIONS.slice(0, 3);

const LABEL_COLOR = {
  original: "bg-blue-100 text-blue-700",
  variant: "bg-amber-100 text-amber-700",
};

export default function PrintPage() {
  const [compositionMode, setCompositionMode] = useState("variant");
  const [variantCount, setVariantCount] = useState(1);
  const [sortMode, setSortMode] = useState("by_subject");
  const [hideAnswers, setHideAnswers] = useState(true);
  const [answerSpace, setAnswerSpace] = useState("适中");

  const paperItems = [];
  PAPER_QUESTIONS.forEach((q) => {
    if (compositionMode !== "variant_only") {
      paperItems.push({ type: "original", q, index: paperItems.length + 1 });
    }
    if (compositionMode !== "original") {
      for (let v = 1; v <= variantCount; v++) {
        paperItems.push({ type: "variant", q, variantNum: v, index: paperItems.length + 1 });
      }
    }
  });

  return (
    <div className="flex gap-6" style={{ height: "calc(100vh - 64px)" }}>
      {/* 左侧设置面板 */}
      <div className="w-72 shrink-0 space-y-5 overflow-auto">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-indigo-500" />
          <h2 className="font-semibold text-gray-900">出卷引擎设置</h2>
        </div>

        {/* 题目构成 */}
        <div>
          <div className="mb-2.5 text-sm font-medium text-gray-700">题目构成</div>
          <div className="space-y-2">
            {COMPOSITION_MODES.map((mode) => (
              <div
                key={mode.id}
                onClick={() => setCompositionMode(mode.id)}
                className={`cursor-pointer rounded-xl border-2 px-4 py-3 transition-all ${
                  compositionMode === mode.id
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-sm font-medium ${compositionMode === mode.id ? "text-indigo-700" : "text-gray-800"}`}>
                      {mode.label}
                    </div>
                    <div className="text-xs text-gray-400">{mode.desc}</div>
                  </div>
                  <div
                    className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                      compositionMode === mode.id ? "border-indigo-600 bg-indigo-600" : "border-gray-300"
                    }`}
                  >
                    {compositionMode === mode.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 每题衍生变式数 */}
        {compositionMode !== "original" && (
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">每题衍生变式数</span>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600">AI 生成</span>
            </div>
            <div className="flex gap-2">
              {VARIANT_COUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => setVariantCount(n)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                    variantCount === n
                      ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {n} 道
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 题目排序与排版 */}
        <div>
          <div className="mb-2.5 text-sm font-medium text-gray-700">题目排序与排版</div>
          <div className="grid grid-cols-2 gap-2">
            {SORT_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSortMode(mode.id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-xs font-medium transition-all ${
                  sortMode === mode.id
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <span className="text-lg">{mode.id === "by_subject" ? "📋" : "🔀"}</span>
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* 高级设置 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">隐藏参考答案</span>
            <button
              onClick={() => setHideAnswers((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors ${hideAnswers ? "bg-indigo-600" : "bg-gray-300"}`}
            >
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  hideAnswers ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">作答留白区域</span>
            <select
              value={answerSpace}
              onChange={(e) => setAnswerSpace(e.target.value)}
              className="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option>适中</option>
              <option>较少</option>
              <option>较多</option>
            </select>
          </div>
        </div>

        {/* 生成按钮 */}
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors">
          <FileText className="h-4 w-4" />
          预览共 {paperItems.length} 题试卷
        </button>
      </div>

      {/* 右侧试卷预览 */}
      <div className="flex-1 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-auto">
        <div className="p-10 max-w-2xl mx-auto">
          <h1 className="text-center text-xl font-bold text-gray-900 mb-3">专属错题巩固练习卷</h1>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600 mb-2">
            <span>姓名：<span className="inline-block w-24 border-b border-gray-400 ml-1" /></span>
            <span>日期：<span className="inline-block w-24 border-b border-gray-400 ml-1" /></span>
            <span>得分：<span className="inline-block w-24 border-b border-gray-400 ml-1" /></span>
          </div>
          <div className="border-b-2 border-gray-900 mb-8 mt-3" />

          <div className="space-y-8">
            {paperItems.map((item, idx) => (
              <div key={`${item.q.id}-${item.type}-${item.variantNum}-${idx}`}>
                <div className="flex items-start gap-2 mb-2">
                  <span className="font-medium text-gray-900 shrink-0">{idx + 1}.</span>
                  <div className="flex-1">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium mr-2 mb-1 ${LABEL_COLOR[item.type]}`}
                    >
                      {item.type === "original"
                        ? `【原题】${item.q.topic}`
                        : `【单一反三】${item.q.topic} - 变式${item.variantNum}`}
                    </span>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {item.type === "original"
                        ? item.q.originalText
                        : `与关于的方程与知识点 ${item.q.topic} 相关，求证此变式情况下的解集。并且应用了相同的考点，请解答。`}
                    </p>
                  </div>
                </div>
                <div
                  className={`ml-5 rounded-lg bg-gray-50 ${
                    answerSpace === "较少" ? "h-16" : answerSpace === "较多" ? "h-36" : "h-24"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
