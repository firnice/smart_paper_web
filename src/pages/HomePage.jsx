import { useNavigate } from "react-router-dom";
import { BookOpen, Printer, AlertTriangle, ChevronRight, Clock, Activity } from "lucide-react";
import { MOCK_QUESTIONS, RECURRING_INSIGHTS } from "../data/figmaMock.js";

const SUBJECT_STATS = [
  { subject: "数学", count: 12, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", icon: "📘" },
  { subject: "物理", count: 5, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", icon: "📗" },
  { subject: "英语", count: 8, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", icon: "📕" },
  { subject: "化学", count: 2, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100", icon: "📙" },
];

const RISK_COLOR = {
  高危: "text-red-600 bg-red-50",
  中危: "text-amber-600 bg-amber-50",
};

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* 问候语 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">下午好，李同学 👋</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
          <Activity className="h-3.5 w-3.5 text-indigo-500" />
          本周已坚持复习 4 天，消灭了 15 道错题，继续保持！
        </p>
      </div>

      {/* 科目统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {SUBJECT_STATS.map((item) => (
          <div
            key={item.subject}
            className={`rounded-2xl border ${item.border} ${item.bg} p-4 cursor-pointer`}
            onClick={() => navigate("/bank")}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-semibold ${item.color}`}>{item.subject}</span>
              <BookOpen className={`h-4 w-4 ${item.color} opacity-60`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{item.count}</div>
            <div className="text-xs text-gray-500 mt-0.5">道待巩固</div>
          </div>
        ))}
      </div>

      {/* 中间两列 */}
      <div className="grid grid-cols-3 gap-5">
        {/* 今日任务 */}
        <div className="col-span-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
                <span className="text-base">🎯</span>
              </div>
              <span className="font-semibold text-gray-900">今日首要攻克任务</span>
            </div>
            <button
              onClick={() => navigate("/bank")}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
            >
              查看全部 <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {MOCK_QUESTIONS.slice(0, 3).map((q) => (
              <div key={q.id} className="flex items-start gap-3 rounded-xl border border-gray-100 p-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                      {q.subject}
                    </span>
                    <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-500">
                      {q.errorReason}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                      <Clock className="h-3 w-3" />
                      {q.date === "2023-10-15" ? "今天" : "昨天"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-1">{q.originalText}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => navigate(`/practice/${q.id}`)}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
                  >
                    举一反三练习
                  </button>
                  <button
                    onClick={() => navigate(`/question/${q.id}`)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    看详情
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧面板 */}
        <div className="space-y-4">
          {/* 组卷打印 */}
          <div
            className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-5 text-white cursor-pointer relative overflow-hidden"
            onClick={() => navigate("/print")}
          >
            <Printer className="absolute right-4 bottom-4 h-16 w-16 text-white/20" />
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">组卷打印</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">高效</span>
            </div>
            <p className="text-xs text-indigo-200 mb-4">勾选错题，一键生成专属 A4 练习卷，支持隐藏答案和留出空白作答区。</p>
            <button className="flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium hover:bg-white/30 transition-colors">
              去组卷 <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* 反复出错预警 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="font-semibold text-gray-900 text-sm">反复出错预警</span>
            </div>
            <div className="space-y-3">
              {RECURRING_INSIGHTS.map((insight) => (
                <div key={insight.topic} className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm font-medium text-gray-900 truncate">{insight.topic}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${RISK_COLOR[insight.riskLevel]}`}>
                        {insight.riskLevel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">{insight.description}</p>
                  </div>
                  <span className="text-lg font-bold text-gray-800 shrink-0">{insight.count}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/insights")}
              className="mt-3 w-full text-center text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              查看完整分析
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
