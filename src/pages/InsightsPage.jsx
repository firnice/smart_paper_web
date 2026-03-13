import { Link } from "react-router-dom";
import { RECURRING_INSIGHTS } from "../data/figmaMock.js";

export default function InsightsPage() {
  return (
    <div className="figma-page">
      <header className="figma-page-header">
        <div>
          <span className="figma-kicker">反复出错洞察</span>
          <h1>AI 正在告诉你，哪些知识点不是偶尔错，而是在反复拖后腿。</h1>
          <p>这一页按 Figma 的预警列表结构重做，重点突出风险等级、最后一次出错时间和关联动作。</p>
        </div>
      </header>

      <section className="figma-stat-strip">
        <article className="figma-metric-card compact">
          <strong>3</strong>
          <span>高风险知识点</span>
        </article>
        <article className="figma-metric-card compact">
          <strong>12</strong>
          <span>本周重复犯错次数</span>
        </article>
        <article className="figma-metric-card compact">
          <strong>15%</strong>
          <span>较上周重复率下降</span>
        </article>
      </section>

      <section className="figma-list-shell">
        {RECURRING_INSIGHTS.map((insight) => (
          <article key={insight.topic} className="figma-insight-row" data-subject={insight.subject}>
            <div>
              <div className="figma-chip-row">
                <span className="figma-subject-tag">{insight.subject}</span>
                <span className={`figma-risk-tag ${insight.riskLevel === "高风险" ? "is-danger" : ""}`}>{insight.riskLevel}</span>
              </div>
              <h3>{insight.topic}</h3>
              <p>{insight.description}</p>
              <span className="figma-muted-meta">最近出错：{insight.lastErrorDate} · 累计 {insight.count} 次</span>
            </div>
            <Link className="figma-secondary-button" to="/bank">
              查看相关错题
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
