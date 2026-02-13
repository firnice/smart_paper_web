import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="page auth-home-page">
      <section className="auth-entry">
        <div className="auth-entry-head">
          <div className="hero-tag">Smart Paper</div>
          <h1>错题本登录系统</h1>
          <p>请选择登录身份。当前先交付学生端完整功能，家长端入口已预留。</p>
        </div>

        <div className="role-login-grid">
          <article className="role-login-card">
            <div className="role-kicker">学生</div>
            <h2>学生登录</h2>
            <p>进入个人错题本，维护错题、记录练习并查看学习统计。</p>
            <Link className="btn-primary" to="/student/login">
              进入学生端
            </Link>
          </article>

          <article className="role-login-card">
            <div className="role-kicker">家长</div>
            <h2>家长登录</h2>
            <p>查看孩子学习趋势和错题掌握情况。当前为预留页面，后续完善。</p>
            <Link className="btn-ghost" to="/parent/login">
              进入家长端
            </Link>
          </article>
        </div>
      </section>
    </div>
  );
}
