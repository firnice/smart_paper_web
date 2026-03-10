import { Link, useNavigate } from "react-router-dom";

const HERO_SIGNALS = [
  "手机拍照直传",
  "PDF / 文档导入",
  "AI 错因分析",
  "举一反三练习",
];

const RECENT_MISTAKES = [
  {
    id: "physics-force",
    subject: "物理",
    date: "03-09",
    topic: "牛顿第二定律综合应用",
    title: "受力分析漏掉约束变化，误判斜面运动状态",
    reason: "概念不清",
  },
  {
    id: "math-parabola",
    subject: "数学",
    date: "03-08",
    topic: "二次函数图像与性质",
    title: "顶点计算正确，但求交点时把 3 写成了 -3",
    reason: "粗心",
  },
];

const RECURRING_INSIGHTS = [
  {
    topic: "牛顿第二定律综合应用",
    level: "高风险",
    count: "05",
    description: "近一周多次在受力分析中漏力，建议优先回到“等效重力法”复盘。",
  },
  {
    topic: "独立主格结构",
    level: "中风险",
    count: "03",
    description: "容易把逻辑主语和非谓语的主动被动关系混淆，适合做定向小练习。",
  },
];

const METRIC_CARDS = [
  { value: "03", label: "今日待处理错题", note: "先完成高风险知识点复习" },
  { value: "02", label: "反复犯错知识点", note: "集中在物理与英语语法" },
  { value: "05", label: "当前已接入页面", note: "首页、上传、结果、学生端、管理台" },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="ai-home-content">
      <section className="ai-home-hero">
        <div className="ai-home-hero-copy">
          <div className="ai-home-kicker">AI错题学习助手</div>
          <div className="ai-home-hero-badge">Demo workspace</div>
          <p className="ai-home-greeting">下午好，李同学</p>
          <h1>上传一份试题，不只识别错题，还要知道为什么错、是不是反复错、下一步该练什么。</h1>
          <p className="ai-home-description">
            当前首页按 Make 原型实现为学生工作台，优先突出 <strong>上传</strong>、<strong>待复习错题</strong> 和
            <strong> 高频失误提醒</strong> 三条主流程。
          </p>

          <div className="ai-home-hero-actions">
            <Link className="btn-primary" to="/upload">
              上传试题
            </Link>
            <Link className="btn-ghost" to="/student/dashboard">
              查看错题本
            </Link>
            <Link className="btn-ghost" to="/workspace">
              打开管理台
            </Link>
          </div>

          <div className="ai-home-signal-row">
            {HERO_SIGNALS.map((signal) => (
              <span key={signal} className="ai-home-signal-pill">
                {signal}
              </span>
            ))}
          </div>
        </div>

        <button type="button" className="ai-home-upload-card" onClick={() => navigate("/upload")}>
          <span className="ai-home-upload-tag">极简上传</span>
          <div className="ai-home-upload-icon" aria-hidden="true">
            <span className="ai-home-upload-icon-core">UP</span>
          </div>
          <h2>上传试题</h2>
          <p>支持拍照、拖拽图片上传。AI 会自动切题、分析错因，并给出下一轮练习建议。</p>
          <div className="ai-home-upload-options">
            <span>手机拍照</span>
            <span>题图预览</span>
            <span>一键进入识别</span>
          </div>
        </button>
      </section>

      <section className="ai-home-metric-grid">
        {METRIC_CARDS.map((item) => (
          <article key={item.label} className="ai-home-metric-card">
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <p>{item.note}</p>
          </article>
        ))}
      </section>

      <section className="ai-home-board-grid">
        <article className="ai-home-board">
          <div className="ai-home-board-head">
            <div>
              <span className="ai-home-board-kicker">今日优先级</span>
              <h3>待复习错题</h3>
            </div>
            <Link className="ai-home-inline-link" to="/student/dashboard">
              去错题本
            </Link>
          </div>

          <div className="ai-home-review-list">
            {RECENT_MISTAKES.map((item) => (
              <button
                key={item.id}
                type="button"
                className="ai-home-review-card"
                onClick={() => navigate("/student/dashboard")}
              >
                <div className="ai-home-review-meta">
                  <span className="ai-home-review-subject">{item.subject}</span>
                  <span className="ai-home-review-date">{item.date}</span>
                </div>
                <h4>{item.topic}</h4>
                <p>{item.title}</p>
                <div className="ai-home-review-footer">
                  <span className="ai-home-reason-chip">错因: {item.reason}</span>
                  <span className="ai-home-review-action">查看详情与练习</span>
                </div>
              </button>
            ))}
          </div>
        </article>

        <article className="ai-home-board emphasis">
          <div className="ai-home-board-head">
            <div>
              <span className="ai-home-board-kicker warning">AI 提醒</span>
              <h3>发现反复犯错</h3>
            </div>
            <button type="button" className="ai-home-inline-link plain" onClick={() => navigate("/student/dashboard")}>
              查看分析
            </button>
          </div>

          <div className="ai-home-insight-list">
            {RECURRING_INSIGHTS.map((item) => (
              <article key={item.topic} className="ai-home-insight-card">
                <div className="ai-home-insight-top">
                  <div>
                    <h4>{item.topic}</h4>
                    <p>{item.description}</p>
                  </div>
                  <div className="ai-home-insight-score">
                    <strong>{item.count}</strong>
                    <span>近期错误次数</span>
                  </div>
                </div>
                <div className="ai-home-insight-footer">
                  <span className="ai-home-risk-badge">{item.level}</span>
                  <span className="ai-home-ai-hint">AI建议：优先加入今日复习清单</span>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
