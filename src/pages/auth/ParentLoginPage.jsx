import { Link } from "react-router-dom";

export default function ParentLoginPage() {
  return (
    <div className="page student-auth-page">
      <header className="hero">
        <div className="hero-tag">家长登录</div>
        <h1>家长端预留入口</h1>
        <p>学生端已可完整演示。家长端后续会补充孩子关联、趋势查看、提醒管理等功能。</p>
      </header>

      <section className="student-auth-card">
        <div className="workspace-alert">当前版本先完成学生端演示，家长端入口已预留。</div>
        <div className="hero-actions">
          <Link className="btn-primary" to="/student/login">
            先体验学生端
          </Link>
          <Link className="btn-ghost" to="/">
            回首页
          </Link>
        </div>
      </section>
    </div>
  );
}
