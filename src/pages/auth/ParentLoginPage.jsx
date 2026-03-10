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
          <h1>家长端仍在排期中，但页面风格和应用壳层已经与学生端统一。</h1>
          <p>当前版本先完成学生端的上传、识别、错题维护和导出演示，家长端后续会接入陪练提醒与趋势总览。</p>
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
