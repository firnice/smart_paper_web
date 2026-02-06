import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStatisticsOverview, listWrongQuestions } from "../../services/api.js";
import { clearStudentSession, readStudentSession } from "../../utils/studentSession.js";

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => readStudentSession());
  const [stats, setStats] = useState(null);
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.student?.id) {
      navigate("/student/login");
      return;
    }

    const studentId = session.student.id;
    setLoading(true);
    setError("");
    Promise.all([
      getStatisticsOverview(studentId),
      listWrongQuestions({ student_id: studentId, limit: 100 }),
    ])
      .then(([statsData, wrongData]) => {
        setStats(statsData);
        setWrongQuestions(wrongData.items ?? []);
      })
      .catch((err) => {
        setError(err?.message || "数据加载失败");
      })
      .finally(() => setLoading(false));
  }, [session, navigate]);

  const logout = () => {
    clearStudentSession();
    setSession(null);
    navigate("/student/login");
  };

  if (!session?.student) return null;

  const student = session.student;
  return (
    <div className="page student-dashboard-page">
      <header className="hero">
        <div className="hero-tag">学生看板</div>
        <h1>{student.name} 的错题本</h1>
        <p>
          年级：{student.student_profile?.grade || "-"} ·
          班级：{student.student_profile?.class_name || "-"} ·
          学号：{student.student_profile?.student_no || "-"}
        </p>
        <div className="hero-actions">
          <button className="btn-primary" type="button" onClick={logout}>退出登录</button>
          <Link className="btn-ghost" to="/upload">去识别试卷</Link>
        </div>
      </header>

      {loading && <div className="workspace-alert">加载中...</div>}
      {error && <div className="workspace-alert error">{error}</div>}

      {stats && (
        <section className="workspace-card">
          <h2>学习统计</h2>
          <div className="workspace-stat-grid">
            <div><span>错题总数</span><strong>{stats.total_wrong_questions}</strong></div>
            <div><span>新错题</span><strong>{stats.new_count}</strong></div>
            <div><span>复习中</span><strong>{stats.reviewing_count}</strong></div>
            <div><span>已掌握</span><strong>{stats.mastered_count}</strong></div>
            <div><span>总错误次数</span><strong>{stats.total_error_count}</strong></div>
            <div><span>练习记录数</span><strong>{stats.study_records_count}</strong></div>
          </div>
        </section>
      )}

      <section className="workspace-card">
        <h2>我的错题</h2>
        <div className="workspace-list">
          {wrongQuestions.length === 0 ? (
            <p>暂无错题数据</p>
          ) : (
            wrongQuestions.map((item) => (
              <div key={item.id} className="workspace-list-item">
                <span>#{item.id} {item.title || item.content.slice(0, 22)}</span>
                <span>{item.subject?.name || "-"}</span>
                <span>{item.status}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
