import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, TrendingUp, ChevronRight, Bell, BarChart2 } from "lucide-react";
import { getStatisticsOverview, listWrongQuestions } from "../../services/api.js";
import { clearStudentSession, readStudentSession } from "../../utils/studentSession.js";
import UserHeader from "./components/UserHeader.jsx";
import StatsOverview from "./components/StatsOverview.jsx";
import SubjectChart from "./components/SubjectChart.jsx";

function formatDateLabel(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function mapQuestion(item) {
  const reasons = Array.isArray(item?.error_reasons) ? item.error_reasons : [];
  return {
    id: item.id,
    title: item.title || "未命名错题",
    subject: item.subject?.name || "未分类",
    updatedAt: item.updated_at || item.created_at || "",
    status: item.status || "new",
    errorReason: reasons.map((r) => r.name).filter(Boolean).join(" / ") || "待分析",
  };
}

const STATUS_TEXT = { new: "新错题", reviewing: "复习中", mastered: "已掌握" };
const STATUS_COLOR = { new: "#EF4444", reviewing: "#F59E0B", mastered: "#10B981" };

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
    Promise.all([
      getStatisticsOverview(studentId),
      listWrongQuestions({ student_id: studentId, limit: 6 }),
    ])
      .then(([statsRes, wrongRes]) => {
        if (!active) return;
        setStats(statsRes || null);
        setQuestions((wrongRes?.items || []).map(mapQuestion));
      })
      .catch((err) => { if (active) setError(err?.message || "加载失败"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
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
        subject: item.subject_name || "未分类",
        total,
        mastered,
        progress: total > 0 ? Math.round((mastered / total) * 100) : 0,
      };
    });
  }, [stats]);

  const recentQuestions = useMemo(() => questions.slice(0, 4), [questions]);

  if (!studentId) {
    return <div className="workspace-alert error">请先登录后继续。</div>;
  }

  return (
    <div className="space-y-4 pb-4">
      {/* User Profile Header */}
      <UserHeader student={student} profile={profile} />

      {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-600">{error}</div>}

      {/* Stats Overview */}
      <StatsOverview stats={stats} masteryRate={masteryRate} loading={loading} />

      {/* Subject Distribution */}
      {topSubjects.length > 0 && <SubjectChart topSubjects={topSubjects} />}

      {/* Mastery Trend - 7 days */}
      <div
        className="rounded-2xl bg-white px-4 py-4"
        style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)" }}
      >
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-500" />
          <h2 className="text-[14px] font-bold text-gray-800">掌握趋势</h2>
        </div>
        {recentTrend.length ? (
          <div className="space-y-2">
            {recentTrend.map((item) => (
              <div key={`${item.date}-${item.total}`} className="flex items-center gap-3">
                <span className="w-10 text-[11px] text-gray-400">{item.date}</span>
                <div className="flex flex-1 items-center gap-1.5">
                  {item.correct > 0 && (
                    <div
                      className="flex h-5 items-center justify-center rounded-md text-[10px] font-bold text-white"
                      style={{ background: "#10B981", width: `${Math.max(24, (item.correct / Math.max(item.total, 1)) * 80)}%` }}
                    >
                      {item.correct}
                    </div>
                  )}
                  {item.incorrect > 0 && (
                    <div
                      className="flex h-5 items-center justify-center rounded-md text-[10px] font-bold text-white"
                      style={{ background: "#EF4444", width: `${Math.max(24, (item.incorrect / Math.max(item.total, 1)) * 80)}%` }}
                    >
                      {item.incorrect}
                    </div>
                  )}
                </div>
                <span className="w-8 text-right text-[11px] text-gray-400">{item.total}</span>
              </div>
            ))}
            <div className="mt-3 flex items-center gap-4 text-[11px] text-gray-400">
              <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded-sm bg-emerald-400" />做对</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded-sm bg-red-400" />做错</span>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-gray-400">还没有学习记录</p>
        )}
      </div>

      {/* Quick Actions */}
      <div
        className="overflow-hidden rounded-2xl bg-white"
        style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)" }}
      >
        {[
          { Icon: Bell, label: "高频错题提醒", badge: true },
          { Icon: BarChart2, label: "趋势分析导出" },
        ].map(({ Icon, label, badge }, idx) => (
          <div
            key={label}
            className={`flex items-center gap-3 px-4 py-3.5 ${idx > 0 ? "border-t border-gray-50" : ""}`}
          >
            <Icon className="h-4.5 w-4.5 text-gray-400" />
            <span className="flex-1 text-[14px] font-medium text-gray-700">{label}</span>
            {badge && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">1</span>
            )}
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </div>
        ))}
      </div>

      {/* Recent Questions */}
      {recentQuestions.length > 0 && (
        <div
          className="rounded-2xl bg-white px-4 py-4"
          style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-gray-800">最近错题</h2>
            <Link to="/workspace" className="text-[12px] font-medium text-indigo-500">全部 →</Link>
          </div>
          <div className="space-y-2">
            {recentQuestions.map((item) => (
              <Link
                key={item.id}
                to={`/question/${item.id}`}
                className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5 transition active:bg-gray-100"
              >
                <span
                  className="rounded-lg px-2 py-1 text-[11px] font-bold"
                  style={{ background: "#EEF2FF", color: "#6366F1" }}
                >
                  {item.subject}
                </span>
                <p className="flex-1 truncate text-[13px] font-medium text-gray-800">{item.title}</p>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: STATUS_COLOR[item.status] || "#6B7280" }}
                >
                  {STATUS_TEXT[item.status] || item.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <button
        type="button"
        onClick={() => { clearStudentSession(); navigate("/login"); }}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-3.5 text-[14px] font-semibold text-red-500 transition active:scale-[0.98]"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
      >
        <LogOut className="h-4 w-4" />
        退出登录
      </button>
    </div>
  );
}
