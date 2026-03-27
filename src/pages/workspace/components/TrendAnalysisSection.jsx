export default function TrendAnalysisSection({
  trendAnalysis,
  trendLoading,
  trendError,
  onGenerateTrendAnalysis,
}) {
  return (
    <section className="workspace-card">
      <h2>AI 学习分析</h2>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 12 }}>AI 根据你的错题数据，分析学习状况并给出专业建议</p>

      <button
        type="button"
        className="btn-primary"
        onClick={onGenerateTrendAnalysis}
        disabled={trendLoading}
        style={{ marginBottom: 12 }}
      >
        {trendLoading ? "分析中..." : "生成分析报告"}
      </button>

      {trendError && <div className="workspace-alert error">{trendError}</div>}

      {trendAnalysis?.analysis_result && (
        <div style={{ marginTop: 8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>总体评价</h3>
          <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.7, marginBottom: 16 }}>
            {trendAnalysis.analysis_result.summary}
          </p>

          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>各学科分析</h3>
          {(trendAnalysis.analysis_result.subject_analyses || []).map((sa, idx) => {
            const severityColor =
              sa.severity === "正常"
                ? "#16a34a"
                : sa.severity === "需关注"
                  ? "#ea580c"
                  : sa.severity === "需重点加强"
                    ? "#dc2626"
                    : "#64748b";
            const severityBg =
              sa.severity === "正常"
                ? "#f0fdf4"
                : sa.severity === "需关注"
                  ? "#fff7ed"
                  : sa.severity === "需重点加强"
                    ? "#fef2f2"
                    : "#f8fafc";
            return (
              <div
                key={idx}
                style={{
                  marginBottom: 12,
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: severityBg,
                  border: `1px solid ${severityColor}22`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <strong style={{ fontSize: 14 }}>{sa.subject}</strong>
                  <span
                    style={{
                      fontSize: 12,
                      color: severityColor,
                      background: `${severityColor}18`,
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontWeight: 500,
                    }}
                  >
                    {sa.severity}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, marginBottom: 8 }}>{sa.detail}</p>
                {sa.suggestions && sa.suggestions.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#475569" }}>
                    {sa.suggestions.map((s, i) => (
                      <li key={i} style={{ marginBottom: 2 }}>{s}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}

          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, marginTop: 16 }}>薄弱知识点</h3>
          <div style={{ fontSize: 14, color: "#475569", marginBottom: 16 }}>
            {(trendAnalysis.analysis_result.weak_points || []).join("、")}
          </div>

          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>趋势</h3>
          <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.7, marginBottom: 16 }}>
            {trendAnalysis.analysis_result.trend_description}
          </p>

          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>改进建议</h3>
          {(trendAnalysis.analysis_result.overall_suggestions || []).map((s, i) => {
            const priorityLabel = s.priority === "high" ? "高" : s.priority === "medium" ? "中" : "低";
            const priorityColor = s.priority === "high" ? "#dc2626" : s.priority === "medium" ? "#ea580c" : "#16a34a";
            return (
              <div key={i} style={{ fontSize: 13, color: "#334155", marginBottom: 6, display: "flex", gap: 8 }}>
                <span style={{ color: priorityColor, fontWeight: 600, flexShrink: 0 }}>[{priorityLabel}]</span>
                <span>{s.content}</span>
              </div>
            );
          })}

          {trendAnalysis.analysis_result.encouragement && (
            <div className="workspace-alert" style={{ marginTop: 16 }}>
              {trendAnalysis.analysis_result.encouragement}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
