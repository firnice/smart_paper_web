import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, SkipForward } from "lucide-react";
import { MOCK_QUESTIONS } from "../data/figmaMock.js";

export default function PracticePage() {
  const navigate = useNavigate();
  const question = MOCK_QUESTIONS[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-4">
      <div className="flex items-center justify-between pt-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500">
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">退出</span>
        </button>
        <div className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">1 / 3</div>
      </div>

      <div className="pb-2 text-center">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">举一反三练习</h1>
        <p className="text-sm text-gray-500">
          针对 <span className="font-semibold text-indigo-600">{question.topic}</span> 的变式训练
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white">变式题 1</span>
          <span className="text-xs text-gray-500">难度: 中等</span>
        </div>

        <div className="mb-6 text-base leading-relaxed font-medium text-gray-900">
          已知关于 {question.topic} 的相关参数发生了变化，如果在原来的基础上增加了一个变量，求证新的结果是多少？
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700">写下你的解答：</label>
          <textarea
            rows={8}
            placeholder="在此输入你的解答过程..."
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => window.alert("已提交答案，AI正在批改中...")}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 font-semibold text-white shadow-lg transition-transform hover:bg-indigo-700 active:scale-95"
        >
          <CheckCircle2 className="h-5 w-5" />
          提交答案
        </button>
        <button className="flex items-center gap-2 rounded-2xl border-2 border-gray-200 bg-white px-6 py-4 font-medium text-gray-600 transition-transform active:scale-95">
          <SkipForward className="h-5 w-5" />
        </button>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">💡 提示：解题思路与原题相似，注意新增变量的影响</p>
      </div>
    </div>
  );
}
