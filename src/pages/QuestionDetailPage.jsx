import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer, Play, AlertTriangle } from "lucide-react";
import { MOCK_QUESTIONS } from "../data/figmaMock.js";

export default function QuestionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const question = MOCK_QUESTIONS.find((item) => item.id === id) || MOCK_QUESTIONS[0];

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-4">
      <div className="flex items-center gap-3 pt-2 pb-2">
        <button onClick={() => navigate(-1)} className="-ml-2 p-2 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">错题详情</h1>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
            {question.subject}
          </span>
          <span className="text-xs text-gray-400">{question.date}</span>
        </div>

        {question.isRecurring ? (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">反复错题 ({question.recurringCount}次)</span>
          </div>
        ) : null}

        <div className="pt-2">
          <h3 className="text-base leading-relaxed font-semibold text-gray-900">{question.originalText}</h3>
        </div>

        <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <span className="text-sm font-semibold text-rose-900">错因分析</span>
          </div>
          <p className="text-sm leading-relaxed text-rose-800">
            当前归类为 <span className="font-semibold">{question.errorReason}</span>。对 {question.topic}
            的基础概念掌握不牢固，建议重新复习该章节的核心公式。
          </p>
        </div>

        <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-emerald-900">正确答案</span>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-emerald-800">
            {question.correctAnswer}
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => navigate("/print")}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-indigo-600 bg-white py-4 font-semibold text-indigo-600 transition-transform active:scale-95"
        >
          <Printer className="h-5 w-5" />
          打印
        </button>

        <button
          onClick={() => navigate(`/practice/${id}`)}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 font-semibold text-white shadow-lg transition-transform hover:bg-indigo-700 active:scale-95"
        >
          <Play className="h-5 w-5 fill-current" />
          练习
        </button>
      </div>
    </div>
  );
}
