import { Link, useNavigate } from "react-router-dom";
import { QUESTIONS, RECURRING_INSIGHTS, SUBJECT_STATS } from "../data/figmaMock.js";

export default function HomePage() {
  const navigate = useNavigate();
  const recentMistakes = QUESTIONS.slice(0, 3);

  return (
    <div className="figma-page">
      <header className="figma-page-header split">
        <div>
          <span className="figma-kicker">AI错题学习助手</span>
          <h1>下午好，李同学。今天先把待复习错题清掉，再处理反复犯错的知识点。</h1>
          <p>首页结构直接回到 Figma 原型：顶部问候、科目文件夹、今日优先任务、右侧组卷入口和反复出错预警。</p>
        </div>
        <div className="figma-header-actions">
          <Link className="figma-secondary-button" to="/bank">
            去错题本
          </Link>
          <Link className="figma-primary-button" to="/upload">
            录入新错题
          </Link>
        </div>
      </header>

      <section className="figma-folder-grid">
        {SUBJECT_STATS.map((subject) => (
          <button
            key={subject.name}
            type="button"
            className="figma-folder-card"
            data-subject={subject.name}
            onClick={() => navigate("/bank")}
          >
            <span>{subject.name}</span>
            <strong>{subject.count}</strong>
            <em>道待巩固</em>
          </button>
        ))}
      </section>

      <section className="figma-home-grid">
        <article className="figma-home-panel">
          <div className="figma-card-head">
            <div>
              <span className="figma-kicker">今日首要攻克任务</span>
              <h2>待复习错题</h2>
            </div>
            <Link className="figma-inline-link" to="/bank">
              去错题本
            </Link>
          </div>

          <div className="figma-review-list">
            {recentMistakes.map((item, index) => (
              <article key={item.id} className="figma-review-card">
                <div className="figma-review-meta">
                  <span className="figma-subject-tag">{item.subject}</span>
                  <span className="figma-reason-tag">{item.errorReason}</span>
                  <span className="figma-date-tag">{index === 0 ? "今天" : "昨天"}</span>
                </div>
                <h3>{item.topic}</h3>
                <p>{item.originalText}</p>
                <div className="figma-review-actions">
                  <button type="button" className="figma-primary-button small" onClick={() => navigate(`/practice/${item.id}`)}>
                    举一反三练习
                  </button>
                  <button type="button" className="figma-secondary-button small" onClick={() => navigate(`/question/${item.id}`)}>
                    看详情
                  </button>
                </div>
              </article>
            ))}
          </div>
        </article>

        <div className="figma-side-stack">
          <button type="button" className="figma-promo-card" onClick={() => navigate("/print")}>
            <span className="figma-kicker">组卷打印</span>
            <h2>把当前错题直接生成一套 A4 练习卷。</h2>
            <p>勾选错题，一键生成专属练习卷，支持隐藏答案和留出作答空白区。</p>
            <span className="figma-promo-link">去组卷</span>
          </button>

          <article className="figma-home-panel compact">
            <div className="figma-card-head">
              <div>
                <span className="figma-kicker">反复出错预警</span>
                <h2>优先盯住这些点</h2>
              </div>
              <Link className="figma-inline-link" to="/insights">
                查看完整分析
              </Link>
            </div>

            <div className="figma-insight-list">
              {RECURRING_INSIGHTS.map((item) => (
                <article key={item.topic} className="figma-insight-card">
                  <div className="figma-insight-top">
                    <div>
                      <h4>{item.topic}</h4>
                      <p>{item.description}</p>
                    </div>
                    <div className="figma-insight-score">
                      <strong>{item.count}</strong>
                      <span>次</span>
                    </div>
                  </div>
                  <div className="figma-insight-footer">
                    <span className={`figma-risk-tag ${item.riskLevel === "高风险" ? "is-danger" : ""}`}>{item.riskLevel}</span>
                    <span className="figma-ai-hint">AI 建议：优先加入今日复习清单</span>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
