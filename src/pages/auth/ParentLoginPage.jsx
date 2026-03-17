import { Link } from "react-router-dom";

const PARENT_FEATURES = [
  "查看孩子近期高频错题与复习完成情况",
  "接收 AI 标记的反复犯错提醒",
  "按学科、学期查看趋势与学习节奏",
];

export default function ParentLoginPage() {
  return (
    <div className="page auth-stage-page">
      <section className="auth-stage single-column">
        <div className="auth-copy-block compact">
          <div className="hero-tag">家长入口</div>
          <h1>家长端入口暂未开放，请不要把它当成已可用功能。</h1>
          <p>当前版本优先收口学生端真实链路。家长端还没有登录、数据查询和提醒能力，暂时只保留说明页，避免后续重新拆路由结构。</p>
        </div>

        <section className="auth-placeholder-card">
          <div className="auth-form-head">
            <h2>计划接入的家长能力</h2>
            <p>先保留入口，避免后续再拆布局结构。</p>
          </div>

          <div className="upload-side-block">
            <ul className="upload-tip-list">
              {PARENT_FEATURES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="hero-actions">
            <Link className="btn-primary" to="/student/login">
              先体验学生端
            </Link>
            <Link className="btn-ghost" to="/">
              回工作台
            </Link>
          </div>
        </section>
      </section>
    </div>
  );
}
