import { useNavigate } from "react-router-dom";
import { AlertTriangle, TrendingUp, Activity, RefreshCw } from "lucide-react";
import { RECURRING_INSIGHTS } from "../data/figmaMock.js";

const RISK_STYLE = {
  高危: { badge: "bg-red-100 text-red-600", dot: "bg-red-500" },
  中危: { badge: "bg-amber-100 text-amber-600", dot: "bg-amber-500" },
  低危: { badge: "bg-blue-100 text-blue-600", dot: "bg-blue-500" },
};

export default function InsightsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <RefreshCw className="h-5 w-5 text-indigo-500" />
          <h1 className="text-2xl font-bold text-gray-900">反复出错洞察</h1>
        </div>
        <p className="text-sm text-gray-500">
          基于你最近的错题记录，AI 发现了以下容易反复犯错的知识点。建议优先攻克。
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            3 <span className="text-lg font-normal text-gray-500">个</span>
          </div>
          <div className="text-sm text-gray-500 mt-0.5">高风险知识点</div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <TrendingUp className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            12 <span className="text-lg font-normal text-gray-500">次</span>
          </div>
          <div className="text-sm text-gray-500 mt-0.5">本周重复犯错次数</div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <Activity className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            15%
            <span className="ml-1 text-base font-medium text-emerald-500">↓</span>
          </div>
          <div className="text-sm text-gray-500 mt-0.5">较上周重复率下降</div>
        </div>
      </div>

      {/* 知识点列表 */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">需要重点突破的知识点</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {RECURRING_INSIGHTS.map((insight) => {
            const style = RISK_STYLE[insight.riskLevel] || RISK_STYLE["低危"];
            return (
              <div key={insight.topic} className="flex items-center gap-4 px-5 py-5">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${style.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{insight.topic}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}>
                      {insight.riskLevel}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">AI 诊断：{insight.description}</p>
                  <span className="text-xs text-gray-400">
                    最近出错：· 累计错误 {insight.count} 次
                  </span>
                </div>
                <button
                  onClick={() => navigate("/bank")}
                  className="shrink-0 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  查看相关错题
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
