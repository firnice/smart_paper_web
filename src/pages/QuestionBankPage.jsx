import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, Printer, Link2, ChevronDown } from "lucide-react";
import { MOCK_QUESTIONS } from "../data/figmaMock.js";
import { useUser } from "../context/UserContext.jsx";

const SUBJECTS = ["数学", "物理", "英语", "化学"];

const SUBJECT_COLOR = {
  数学: "bg-indigo-100 text-indigo-700",
  物理: "bg-purple-100 text-purple-700",
  英语: "bg-emerald-100 text-emerald-700",
  化学: "bg-orange-100 text-orange-700",
};

export default function QuestionBankPage() {
  const navigate = useNavigate();
  const { termList } = useUser();

  const [activeSubject, setActiveSubject] = useState("全部");
  const [activeTerm, setActiveTerm] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [termOpen, setTermOpen] = useState(false);

  // 从 mock 数据中提取实际出现的学期（按 termList 顺序）
  const usedTerms = termList.filter((t) => MOCK_QUESTIONS.some((q) => q.term === t));

  const filteredQuestions = MOCK_QUESTIONS.filter((question) => {
    const matchSubject = activeSubject === "全部" || question.subject === activeSubject;
    const matchTerm = activeTerm === "全部" || question.term === activeTerm;
    const matchSearch =
      !searchQuery ||
      question.originalText.includes(searchQuery) ||
      question.topic.includes(searchQuery);
    return matchSubject && matchTerm && matchSearch;
  });

  return (
    <div className="space-y-5">
      {/* 页头 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">错题本</h1>
          <p className="mt-1 text-sm text-gray-500">
            共收录 {MOCK_QUESTIONS.length} 道错题，坚持复习能提升 30% 正确率。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索题目、知识点..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-52 rounded-xl border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <SlidersHorizontal className="h-4 w-4" />
            筛选
          </button>
          <button
            onClick={() => navigate("/print")}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Printer className="h-4 w-4" />
            批量组卷
          </button>
        </div>
      </div>

      {/* 筛选栏：科目 + 学期 */}
      <div className="flex items-center justify-between">
        {/* 科目 tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubject("全部")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeSubject === "全部"
                ? "bg-indigo-600 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:border-indigo-300"
            }`}
          >
            全部科目
          </button>
          {SUBJECTS.map((subject) => (
            <button
              key={subject}
              onClick={() => setActiveSubject(subject)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeSubject === subject
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-indigo-300"
              }`}
            >
              {subject}
            </button>
          ))}
        </div>

        {/* 学期下拉 */}
        <div className="relative">
          <button
            onClick={() => setTermOpen((v) => !v)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTerm !== "全部"
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            {activeTerm === "全部" ? "全部学期" : activeTerm}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${termOpen ? "rotate-180" : ""}`} />
          </button>
          {termOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              <button
                onClick={() => { setActiveTerm("全部"); setTermOpen(false); }}
                className={`flex w-full items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-indigo-50 ${
                  activeTerm === "全部" ? "bg-indigo-50 font-semibold text-indigo-600" : "text-gray-700"
                }`}
              >
                全部学期
                {activeTerm === "全部" && <span className="text-indigo-400">✓</span>}
              </button>
              {usedTerms.map((term) => (
                <button
                  key={term}
                  onClick={() => { setActiveTerm(term); setTermOpen(false); }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-indigo-50 ${
                    activeTerm === term ? "bg-indigo-50 font-semibold text-indigo-600" : "text-gray-700"
                  }`}
                >
                  {term}
                  {activeTerm === term && <span className="text-indigo-400">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 结果数量提示 */}
      {(activeSubject !== "全部" || activeTerm !== "全部" || searchQuery) && (
        <p className="text-xs text-gray-500">
          共找到 <span className="font-medium text-gray-700">{filteredQuestions.length}</span> 道题
          {activeTerm !== "全部" && <span className="ml-1 text-indigo-600">· {activeTerm}</span>}
        </p>
      )}

      {/* 题目卡片网格 */}
      <div className="grid grid-cols-3 gap-4">
        {filteredQuestions.map((question) => (
          <div
            key={question.id}
            onClick={() => navigate(`/question/${question.id}`)}
            className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all"
          >
            {/* 顶部：科目 + 日期 + 反复错标签 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${SUBJECT_COLOR[question.subject] || "bg-gray-100 text-gray-600"}`}>
                  {question.subject}
                </span>
                <span className="text-xs text-gray-400">{question.date}</span>
              </div>
              {question.isRecurring && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  反复错 {question.recurringCount}次
                </span>
              )}
            </div>

            {/* 题目文本 */}
            <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-3">
              {question.originalText}
            </p>

            {/* 底部：知识点 + 错因 + 学期 */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Link2 className="h-3 w-3 shrink-0" />
                {question.topic}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">错因：</span>
                  <span className="text-xs font-medium text-rose-500">{question.errorReason}</span>
                </div>
                <span className="text-xs text-gray-400">{question.term}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredQuestions.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-20">
          <div className="mb-3 text-4xl">🔍</div>
          <p className="text-sm text-gray-500">没有找到相关错题</p>
        </div>
      )}
    </div>
  );
}
