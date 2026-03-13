import { RADAR_DATA, TREND_DATA } from "../data/figmaMock.js";

export default function ProfilePage() {
  return (
    <div className="figma-page">
      <header className="figma-page-header">
        <div>
          <span className="figma-kicker">学情画像</span>
          <h1>不只看有多少错题，还看你在哪些学科正在稳定变好。</h1>
          <p>这里保留了 Figma 原型的三张总览卡 + 能力分布 + 周趋势两块核心信息。</p>
        </div>
      </header>

      <section className="figma-stat-strip">
        <article className="figma-feature-card highlight">
          <span className="figma-kicker">近期平均正确率</span>
          <strong>78%</strong>
          <p>较上月提升 5%</p>
        </article>
        <article className="figma-feature-card">
          <span className="figma-kicker">本周错题消灭率</span>
          <strong>62%</strong>
          <p>击败了 85% 的同学</p>
        </article>
        <article className="figma-feature-card">
          <span className="figma-kicker">连续记录天数</span>
          <strong>14 天</strong>
          <p>继续保持</p>
        </article>
      </section>

      <section className="figma-analytics-grid">
        <article className="figma-analytics-card">
          <div className="figma-card-head">
            <h2>能力雷达分布</h2>
            <span>各学科掌握度</span>
          </div>
          <div className="figma-score-list">
            {RADAR_DATA.map((item) => (
              <div key={item.subject} className="figma-score-row">
                <span>{item.subject}</span>
                <div className="figma-bar-track">
                  <div className="figma-bar-fill" style={{ width: `${item.value}%` }} />
                </div>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="figma-analytics-card">
          <div className="figma-card-head">
            <h2>本周错题处理趋势</h2>
            <span>错题数 vs 解决数</span>
          </div>
          <div className="figma-trend-list">
            {TREND_DATA.map((item) => (
              <div key={item.name} className="figma-trend-row">
                <span>{item.name}</span>
                <div className="figma-trend-bars">
                  <div className="figma-mini-bar is-danger" style={{ width: `${item.mistakes * 6}%` }}>
                    <em>{item.mistakes}</em>
                  </div>
                  <div className="figma-mini-bar is-safe" style={{ width: `${item.solved * 6}%` }}>
                    <em>{item.solved}</em>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
