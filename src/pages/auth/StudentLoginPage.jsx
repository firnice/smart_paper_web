import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { studentLogin } from "../../services/api.js";
import { saveStudentSession } from "../../utils/studentSession.js";

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
    <div className="page student-auth-page">
      <header className="hero">
        <div className="hero-tag">学生登录</div>
        <h1>进入个人错题本</h1>
        <p>先做一个简单校验：姓名必填，学号和年级用于辅助验证。首次登录会自动创建学生档案。</p>
      </header>

      <section className="student-auth-card">
        <form className="workspace-form" onSubmit={onSubmit}>
          <label>
            学生姓名
            <input required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            学号（可选）
            <input value={studentNo} onChange={(e) => setStudentNo(e.target.value)} />
          </label>
          <label>
            年级（可选）
            <input value={grade} onChange={(e) => setGrade(e.target.value)} />
          </label>
          <div />
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "验证中..." : "登录"}
          </button>
        </form>
        {error && <div className="workspace-alert error">{error}</div>}
        <div className="hero-actions">
          <Link className="btn-ghost" to="/">回首页</Link>
          <Link className="btn-ghost" to="/workspace">管理台</Link>
        </div>
      </section>
    </div>
  );
}
