import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { demoStudentLogin } from "../../services/studentDemo.js";
import { saveStudentSession } from "../../utils/studentSession.js";

const LOGIN_HIGHLIGHTS = [
  { value: "0", label: "后端依赖", note: "当前为前端 Demo 登录，不阻塞演示" },
  { value: "1", label: "必填字段", note: "只要求学生姓名即可进入工作台" },
  { value: "5", label: "已统一页面", note: "登录后进入同套 Make 风格壳层" },
];

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [grade, setGrade] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = demoStudentLogin({
        name,
        student_no: studentNo || undefined,
        grade: grade || undefined,
      });
      saveStudentSession(data);
      navigate("/student/dashboard");
    } catch (err) {
      setError(err?.message || "登录失败，请核对信息");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-stage-page">
      <section className="auth-stage">
        <div className="auth-copy-block">
          <div className="hero-tag">学生登录（Demo）</div>
          <h1>先进入你的错题工作台，再开始上传、复习和生成练习。</h1>
          <p>
            当前是前端演示模式，不依赖后端账号体系。姓名为必填项，首次登录会自动创建一个学生档案并进入学生端。
          </p>

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
            <h2>填写学生信息</h2>
            <p>登录后将直接进入学生错题本页面。</p>
          </div>

          <form className="workspace-form auth-form-grid" onSubmit={onSubmit}>
            <label>
              学生姓名
              <input required value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              学号（可选）
              <input value={studentNo} onChange={(event) => setStudentNo(event.target.value)} />
            </label>
            <label>
              年级（可选）
              <input value={grade} onChange={(event) => setGrade(event.target.value)} />
            </label>
            <div className="auth-form-tip">
              <strong>演示说明</strong>
              <span>如果你不填学号或年级，系统会先以默认档案进入，后续仍可在学生端补充。</span>
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "验证中..." : "进入学生端"}
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
