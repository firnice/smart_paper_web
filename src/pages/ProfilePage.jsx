import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, CircleCheckBig, Clock3, GraduationCap, LogOut, RefreshCcw, Pencil, X, UserRound, CalendarDays } from "lucide-react";
import { getStatisticsOverview, updateUser } from "../services/api.js";
import { clearStudentSession, readStudentSession, saveStudentSession } from "../utils/studentSession.js";
import { useTerm } from "../context/TermContext.jsx";

const GRADE_OPTIONS = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"];

// 根据出生年月推算小学年级（9月入学制）
function inferGradeFromBirthDate(birthStr) {
  if (!birthStr) return "";
  const [year, month] = birthStr.split("-").map(Number);
  if (!year || !month) return "";
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  // 入学年份：满6周岁那年9月
  const enrollYear = year + 6;
  // 当前学年的起始年（9月起算）
  const academicYear = currentMonth >= 9 ? currentYear : currentYear - 1;
  const gradeNumber = academicYear - enrollYear + 1;
  if (gradeNumber < 1 || gradeNumber > 6) return "";
  return GRADE_OPTIONS[gradeNumber - 1];
}

function formatRatio(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-[13px] text-gray-400 w-14 shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-gray-800 text-right">{value || "-"}</span>
    </div>
  );
}

// 编辑模态
function EditModal({ student, profile, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: student?.name || "",
    birth_date: profile.birth_date || "",
    grade: profile.grade || "",
    student_no: profile.student_no || "",
    school_name: profile.school_name || "",
    class_name: profile.class_name || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [gradeManual, setGradeManual] = useState(false);

  // 出生年月变化时自动推算年级（未手动修改时）
  const inferredGrade = useMemo(() => inferGradeFromBirthDate(form.birth_date), [form.birth_date]);

  const onBirthDateChange = (val) => {
    setForm((prev) => ({ ...prev, birth_date: val }));
    if (!gradeManual) {
      const g = inferGradeFromBirthDate(val);
      if (g) setForm((prev) => ({ ...prev, birth_date: val, grade: g }));
    }
  };

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSave = async () => {
    if (!form.name.trim()) { setError("姓名不能为空"); return; }
    if (!form.grade) { setError("请选择或填写年级"); return; }
    setSaving(true);
    setError("");
    try {
      const updated = await updateUser(student.id, {
        name: form.name.trim(),
        student_profile: {
          grade: form.grade,
          birth_date: form.birth_date || null,
          student_no: form.student_no || null,
          school_name: form.school_name || null,
          class_name: form.class_name || null,
        },
      });
      const session = readStudentSession();
      saveStudentSession({ ...session, student: updated });
      onSaved();
    } catch (err) {
      setError(err?.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.35)" }}>
      <div className="w-full max-w-lg rounded-t-3xl bg-white pb-safe" style={{ maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-[15px] font-bold text-gray-900">编辑资料</span>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-600">{error}</div>}

          {/* 姓名 */}
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5">姓名</label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-[14px] text-gray-800 outline-none focus:border-indigo-400 focus:bg-white"
              value={form.name}
              onChange={set("name")}
              placeholder="请输入姓名"
            />
          </div>

          {/* 出生年月 */}
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5">出生年月</label>
            <input
              type="month"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-[14px] text-gray-800 outline-none focus:border-indigo-400 focus:bg-white"
              value={form.birth_date}
              onChange={(e) => onBirthDateChange(e.target.value)}
            />
            {inferredGrade && !gradeManual && (
              <p className="mt-1 text-[12px] text-indigo-500">推算年级：{inferredGrade}</p>
            )}
          </div>

          {/* 年级（可手动覆盖） */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12px] font-medium text-gray-500">年级</label>
              {!gradeManual ? (
                <button type="button" onClick={() => setGradeManual(true)} className="text-[11px] text-indigo-500">手动指定</button>
              ) : (
                <button type="button" onClick={() => { setGradeManual(false); if (inferredGrade) setForm((p) => ({ ...p, grade: inferredGrade })); }} className="text-[11px] text-gray-400">恢复自动推算</button>
              )}
            </div>
            {gradeManual ? (
              <select
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-[14px] text-gray-800 outline-none focus:border-indigo-400 focus:bg-white"
                value={form.grade}
                onChange={set("grade")}
              >
                <option value="">请选择</option>
                {GRADE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            ) : (
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-[14px] text-gray-500">
                {form.grade || "（根据出生年月自动推算）"}
              </div>
            )}
          </div>

          {/* 学号 */}
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5">学号</label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-[14px] text-gray-800 outline-none focus:border-indigo-400 focus:bg-white"
              value={form.student_no}
              onChange={set("student_no")}
              placeholder="选填"
            />
          </div>

          {/* 学校 */}
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5">学校</label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-[14px] text-gray-800 outline-none focus:border-indigo-400 focus:bg-white"
              value={form.school_name}
              onChange={set("school_name")}
              placeholder="选填"
            />
          </div>

          {/* 班级 */}
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5">班级</label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-[14px] text-gray-800 outline-none focus:border-indigo-400 focus:bg-white"
              value={form.class_name}
              onChange={set("class_name")}
              placeholder="选填，如三(2)班"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="w-full rounded-2xl bg-indigo-600 py-3 text-[14px] font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => readStudentSession());
  const student = session?.student || null;
  const profile = student?.student_profile || {};
  const studentId = student?.id;
  const { allTerms, currentTerm, changeTerm, loading: termLoading } = useTerm();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    let active = true;
    setLoading(true);
    setError("");
    getStatisticsOverview(studentId, { term_id: currentTerm?.id || undefined })
      .then((data) => { if (active) setStats(data || null); })
      .catch((err) => { if (active) setError(err?.message || "统计信息加载失败"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [studentId, currentTerm?.id]);

  const masteryRate = useMemo(() => {
    const total = Number(stats?.total_wrong_questions || 0);
    const mastered = Number(stats?.mastered_count || 0);
    return total > 0 ? (mastered / total) * 100 : 0;
  }, [stats]);

  const onSaved = () => {
    setEditOpen(false);
    setSession(readStudentSession());
  };

  if (!studentId) {
    return <div className="workspace-alert error">请先登录后继续。</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-4">
      {/* Header — 编辑按钮在右上角头像位置 */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-indigo-100">用户中心</p>
            <h1 className="mt-1 text-3xl font-bold">{student?.name || "当前用户"}</h1>
            <p className="mt-2 text-sm text-indigo-100">
              年级：{profile.grade || "-"} · 学号：{profile.student_no || "-"}
            </p>
            <p className="mt-1 text-sm text-indigo-100">
              学校：{profile.school_name || "-"} · 班级：{profile.class_name || "-"}
            </p>
          </div>
          {/* 头像按钮 — 点击编辑资料 */}
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 transition hover:bg-white/25 active:scale-95"
            title="编辑资料"
          >
            <UserRound className="h-7 w-7" />
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90">
              <Pencil className="h-3 w-3 text-indigo-600" />
            </span>
          </button>
        </div>
      </div>

      {/* Term Selector */}
      {allTerms.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-semibold text-gray-700">当前学期</span>
            {termLoading && <span className="text-xs text-gray-400">更新中...</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {allTerms.map((term) => (
              <button
                key={term.id}
                type="button"
                onClick={() => changeTerm(term.id)}
                disabled={termLoading}
                className="rounded-full px-4 py-1.5 text-sm font-semibold transition active:scale-95"
                style={
                  currentTerm?.id === term.id
                    ? { background: "#6366F1", color: "#fff", boxShadow: "0 2px 8px rgba(99,102,241,0.35)" }
                    : { background: "#F3F4F6", color: "#6B7280" }
                }
              >
                {term.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {error ? <div className="workspace-alert error">{error}</div> : null}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <span className="text-sm">累计错题</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{loading ? "--" : Number(stats?.total_wrong_questions || 0)}</div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <CircleCheckBig className="h-5 w-5 text-emerald-600" />
            <span className="text-sm">掌握率</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{loading ? "--" : formatRatio(masteryRate)}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <Clock3 className="h-4 w-4 text-amber-500" />
            <span className="text-sm">复习中</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{loading ? "--" : Number(stats?.reviewing_count || 0)}</div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <RefreshCcw className="h-4 w-4 text-blue-500" />
            <span className="text-sm">练习次数</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{loading ? "--" : Number(stats?.study_records_count || 0)}</div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <GraduationCap className="h-4 w-4 text-violet-500" />
            <span className="text-sm">新错题</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{loading ? "--" : Number(stats?.new_count || 0)}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => { clearStudentSession(); navigate("/login"); }}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-3 text-sm font-medium text-red-500 shadow-sm transition active:scale-[0.98]"
      >
        <LogOut className="h-4 w-4" />
        退出登录
      </button>

      {/* 编辑模态 */}
      {editOpen && (
        <EditModal
          student={student}
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
