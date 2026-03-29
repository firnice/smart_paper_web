import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";

const SEVERITY_STYLE = {
  "正常": { bg: "#ECFDF5", color: "#10B981", border: "#D1FAE5" },
  "需关注": { bg: "#FFFBEB", color: "#F59E0B", border: "#FDE68A" },
  "需重点加强": { bg: "#FEF2F2", color: "#EF4444", border: "#FECACA" },
};

export default function TrendAnalysisSection({
  trendAnalysis,
  trendLoading,
  trendError,
  onGenerateTrendAnalysis,
}) {
  const [expanded, setExpanded] = useState(false);
  const hasResult = trendAnalysis?.analysis_result;

  return (
    <section
      className="mb-4 overflow-hidden rounded-2xl bg-white"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.05)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <span className="text-[14px] font-bold text-gray-800">AI 学习分析</span>
        </div>
        <div className="flex items-center gap-2">
          {hasResult && (
            <button
              type="button"
              className="flex items-center gap-1 text-[12px] text-gray-400"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
          <button
            type="button"
            disabled={trendLoading}
            onClick={onGenerateTrendAnalysis}
            className="rounded-xl px-3 py-1.5 text-[12px] font-bold text-white transition active:scale-95 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
          >
            {trendLoading ? "分析中..." : hasResult ? "重新生成" : "生成报告"}
          </button>
        </div>
      </div>

      {trendError && (
        <div className="mx-4 mb-3 rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-600">{trendError}</div>
      )}

      {trendLoading && (
        <div className="flex items-center gap-3 border-t border-gray-50 px-4 py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
          <p className="text-[13px] text-gray-500">AI 正在分析你的学习数据...</p>
        </div>
      )}

      {hasResult && (
        <div className={`border-t border-gray-50 ${expanded ? "block" : "hidden"}`}>
          {/* Summary */}
          {trendAnalysis.analysis_result.summary && (
            <div className="px-4 py-3">
              <p className="text-[13px] leading-relaxed text-gray-600">{trendAnalysis.analysis_result.summary}</p>
            </div>
          )}

          {/* Subject analyses */}
          {(trendAnalysis.analysis_result.subject_analyses || []).length > 0 && (
            <div className="px-4 pb-3">
              <p className="mb-2 text-[12px] font-bold text-gray-400 uppercase tracking-wide">各学科</p>
              <div className="space-y-2">
                {trendAnalysis.analysis_result.subject_analyses.map((sa, idx) => {
                  const s = SEVERITY_STYLE[sa.severity] || { bg: "#F9FAFB", color: "#6B7280", border: "#E5E7EB" };
                  return (
                    <div
                      key={idx}
                      className="rounded-xl px-3 py-2.5"
                      style={{ background: s.bg, border: `1px solid ${s.border}` }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <strong className="text-[13px] text-gray-800">{sa.subject}</strong>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: s.color + "20", color: s.color }}
                        >
                          {sa.severity}
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-500 leading-relaxed">{sa.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Encouragement */}
          {trendAnalysis.analysis_result.encouragement && (
            <div className="mx-4 mb-3 rounded-xl bg-indigo-50 px-3 py-2.5">
              <p className="text-[12px] text-indigo-700 leading-relaxed">
                💪 {trendAnalysis.analysis_result.encouragement}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Collapsed summary pill when has result but not expanded */}
      {hasResult && !expanded && (
        <div
          className="flex cursor-pointer items-center gap-2 border-t border-gray-50 px-4 py-2.5"
          onClick={() => setExpanded(true)}
        >
          <span className="text-[12px] text-indigo-500 font-medium">查看完整报告</span>
          <ChevronDown className="h-3.5 w-3.5 text-indigo-400" />
        </div>
      )}
    </section>
  );
}
