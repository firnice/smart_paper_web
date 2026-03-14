import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { MOCK_QUESTIONS } from "../data/figmaMock.js";

const SUBJECTS = ["数学", "物理", "英语", "化学"];

export default function QuestionBankPage() {
  const navigate = useNavigate();
  const [activeSubject, setActiveSubject] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredQuestions = MOCK_QUESTIONS.filter((question) => {
    const matchesSubject = activeSubject === "全部" || question.subject === activeSubject;
    const matchesSearch =
      question.originalText.includes(searchQuery) || question.topic.includes(searchQuery);
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-4">
      <div className="pt-2 pb-2">
        <h1 className="text-2xl font-bold text-gray-900">错题本</h1>
        <p className="mt-1 text-sm text-gray-500">共 {MOCK_QUESTIONS.length} 道错题</p>
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="搜索题目或知识点..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full rounded-2xl border border-gray-200 bg-white py-3 pr-4 pl-12 text-sm shadow-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveSubject("全部")}
          className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            activeSubject === "全部"
              ? "bg-indigo-600 text-white shadow-sm"
              : "border border-gray-200 bg-white text-gray-600"
          }`}
        >
          全部
        </button>
        {SUBJECTS.map((subject) => (
          <button
            key={subject}
            onClick={() => setActiveSubject(subject)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeSubject === subject
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-gray-200 bg-white text-gray-600"
            }`}
          >
            {subject}
          </button>
        ))}
      </div>

      <div className="space-y-3 pt-2">
        {filteredQuestions.map((question) => (
          <div
            key={question.id}
            onClick={() => navigate(`/question/${question.id}`)}
            className="active:scale-98 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-transform"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <span className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600">
                {question.subject}
              </span>
              <span className="text-xs text-gray-400">{question.date}</span>
            </div>

            <p className="mb-3 line-clamp-2 text-sm font-medium text-gray-900">{question.originalText}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">错因:</span>
                <span className="rounded bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">
                  {question.errorReason}
                </span>
              </div>
              {question.isRecurring ? (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  反复错 {question.recurringCount}次
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-16">
          <div className="mb-3 text-4xl">🔍</div>
          <p className="text-sm text-gray-500">没有找到相关错题</p>
        </div>
      ) : null}
    </div>
  );
}
