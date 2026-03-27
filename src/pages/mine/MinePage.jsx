import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LineChart, LogOut } from "lucide-react";
import { getStatisticsOverview, listWrongQuestions } from "../../services/api.js";
import { clearStudentSession, readStudentSession } from "../../utils/studentSession.js";
import UserHeader from "./components/UserHeader.jsx";
import StatsOverview from "./components/StatsOverview.jsx";
import SubjectChart from "./components/SubjectChart.jsx";

function formatDateLabel(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}-${date.getDate()}`;
}

function mapQuestion(item) {
  const reasons = Array.isArray(item?.error_reasons) ? item.error_reasons : [];
  return {
    id: item.id,
    title: item.title || "未命名错题",
    subject: item.subject?.name || "未分类学科",
    updatedAt: item.updated_at || item.created_at || "",
    status: item.status || "new",
    errorReason: reasons.map((reason) => reason.name).filter(Boolean).join(" / ") || "待分析",
  };
}

const STATUS_TEXT = {
  new: "新错题",
  reviewing: "复习中",
  mastered: "已掌握",
};

export default function MinePage() {
  const navigate = useNavigate();
  const session = readStudentSession();
  const student = session?.student || null;
  const profile = student?.student_profile || {};
  const studentId = student?.id;

  const [stats, setStats] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!studentId) return;

    let active = true;
    setLoading(true);
    setError("");

    Promise.all([
      getStatisticsOverview(studentId),
      listWrongQuestions({ student_id: studentId, limit: 6 }),
    ])
      .then(([statsRes, wrongRes]) => {
        if (!active) return;
        setStats(statsRes || null);
        setQuestions((wrongRes?.items || []).map(mapQuestion));
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || "我的页面加载失败");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [studentId]);

  const masteryRate = useMemo(() => {
    const total = Number(stats?.total_wrong_questions || 0);
    const mastered = Number(stats?.mastered_count || 0);
    return total > 0 ? (mastered / total) * 100 : 0;
  }, [stats]);

  const recentTrend = useMemo(() => {
    const trend = Array.isArray(stats?.trend) ? stats.trend.slice(-7) : [];
    return trend.map((item) => ({
      date: formatDateLabel(item.date),
      total: Number(item.total || 0),
      correct: Number(item.correct_count || 0),
      incorrect: Number(item.incorrect_count || 0),
    }));
  }, [stats]);

  const topSubjects = useMemo(() => {
    const rows = Array.isArray(stats?.subject_breakdown) ? stats.subject_breakdown : [];
    return rows.slice(0, 4).map((item) => {
      const total = Number(item.total || 0);
      const mastered = Number(item.mastered || 0);
      return {
        subject: item.subject_name || "未分类学科",
        total,
        mastered,
        progress: total > 0 ? Math.round((mastered / total) * 100) : 0,
      };
    });
  }, [stats]);

  const recentQuestions = useMemo(() => questions.slice(0, 4), [questions]);

  if (!studentId) {
    return <div className="workspace-alert error">请先登录学生端。</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-4">
      <UserHeader student={student} profile={profile} />

      {error ? <div className="workspace-alert error">{error}</div> : null}

      <StatsOverview stats={stats} masteryRate={masteryRate} loading={loading} />

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
          <LineChart className="h-5 w-5 text-indigo-600" />
          最近 7 次学习趋势
        </h2>

        {recentTrend.length ? (
          <div className="space-y-3">
            {recentTrend.map((item) => (
              <div key={`${item.date}-${item.total}`} className="rounded-xl bg-gray-50 p-3">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{item.date}</span>
                  <span className="text-gray-500">共 {item.total} 次</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="rounded bg-emerald-50 px-2 py-1 font-medium text-emerald-700">做对 {item.correct}</span>
                  <span className="rounded bg-rose-50 px-2 py-1 font-medium text-rose-700">做错 {item.incorrect}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">还没有学习记录，先去工作台录入或练习一次。</div>
        )}
      </div>

      <SubjectChart topSubjects={topSubjects} />

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-900">最近错题</h2>
          <Link to="/workspace" className="text-sm font-medium text-indigo-600">
            去工作台
          </Link>
        </div>

        {recentQuestions.length ? (
          <div className="space-y-3">
            {recentQuestions.map((item) => (
              <Link
                key={item.id}
                to={`/question/${item.id}`}
                className="block rounded-xl border border-gray-100 bg-gray-50 p-4 transition hover:border-indigo-200 hover:bg-white"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <span className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600">{item.subject}</span>
                  <span className="text-xs text-gray-400">{formatDateLabel(item.updatedAt)}</span>
                </div>
                <p className="mb-1 text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500">状态：{STATUS_TEXT[item.status] || item.status} · 错因：{item.errorReason}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">还没有错题，先去工作台录入第一道题。</div>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          clearStudentSession();
          navigate("/student/login");
        }}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-3 text-sm font-medium text-red-500 shadow-sm transition active:scale-[0.98]"
      >
        <LogOut className="h-4 w-4" />
        退出登录
      </button>
    </div>
  );
}
