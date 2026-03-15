import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { studentLogin } from "../../services/api.js";
import { saveStudentSession } from "../../utils/studentSession.js";

const LOGIN_HIGHLIGHTS = [
  { value: "3", label: "内置账号", note: "提供 3 个测试学生账号可直接登录" },
  { value: "账号+密码", label: "登录方式", note: "已切换为学生账号密码登录" },
  { value: "M4", label: "当前阶段", note: "登录后进入真实错题与打印流程" },
];

const PRESET_ACCOUNTS = [
  { account: "test1", password: "test1", note: "测试学生1 / 三年级" },
  { account: "test2", password: "test2", note: "测试学生2 / 四年级" },
  { account: "test3", password: "test3", note: "测试学生3 / 五年级" },
];

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const [account, setAccount] = useState("test1");
  const [password, setPassword] = useState("test1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fillPreset = (item) => {
    setAccount(item.account);
    setPassword(item.password);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await studentLogin({ account, password });
      saveStudentSession(data);
      navigate("/student/dashboard");
    } catch (err) {
      setError(err?.message || "登录失败，请核对账号密码");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-stage-page">
      <section className="auth-stage">
        <div className="auth-copy-block">
          <div className="hero-tag">学生登录</div>
          <h1>先进入你的错题工作台，再开始上传、复习和生成练习。</h1>
          <p>当前已切换为学生账号密码登录，并内置了几组简单测试账号，便于直接联调。</p>

          <div className="auth-highlight-grid">
            {LOGIN_HIGHLIGHTS.map((item) => (
              <article key={item.label} className="auth-highlight-card">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
                <p>{item.note}</p>
              </article>
            ))}
          </div>
        </div>

        <section className="auth-form-card">
          <div className="auth-form-head">
            <h2>学生账号登录</h2>
            <p>使用内置测试账号即可进入学生端。</p>
          </div>

          <form className="workspace-form auth-form-grid" onSubmit={onSubmit}>
            <label>
              账号
              <input required value={account} onChange={(event) => setAccount(event.target.value)} />
            </label>
            <label>
              密码
              <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <div className="auth-form-tip">
              <strong>测试账号</strong>
              <div className="space-y-2 pt-2">
                {PRESET_ACCOUNTS.map((item) => (
                  <button key={item.account} type="button" className="btn-ghost btn-small" onClick={() => fillPreset(item)}>
                    {item.account} / {item.password} · {item.note}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "登录中..." : "进入学生端"}
            </button>
          </form>

          {error ? <div className="workspace-alert error">{error}</div> : null}

          <div className="hero-actions">
            <Link className="btn-ghost" to="/">
              回工作台
            </Link>
            <Link className="btn-ghost" to="/parent/login">
              查看家长入口
            </Link>
          </div>
        </section>
      </section>
    </div>
  );
}
