import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { studentLogin } from "../../services/api.js";
import { saveStudentSession } from "../../utils/studentSession.js";

const LOGIN_HIGHLIGHTS = [
  { value: "1", label: "后端依赖", note: "当前已接入真实学生登录接口" },
  { value: "1", label: "必填字段", note: "只要求学生姓名即可进入工作台" },
  { value: "M1", label: "里程碑对齐", note: "登录后进入真实错题维护工作台" },
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
      const data = await studentLogin({
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
          <div className="hero-tag">学生登录</div>
          <h1>先进入你的错题工作台，再开始上传、复习和生成练习。</h1>
          <p>
            当前已接入后端学生登录。姓名为必填项，首次登录会自动创建一个学生档案并进入学生端。
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
              <strong>登录说明</strong>
              <span>如果你不填学号或年级，系统会先以默认档案进入；如存在重名学生，补充学号可帮助精确匹配。</span>
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
