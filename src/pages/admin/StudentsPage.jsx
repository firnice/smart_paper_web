import { useState, useEffect } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { listStudents, createStudent, deleteUser } from "../../services/api.js";

const GRADE_OPTIONS = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级", "初一", "初二", "初三"];

const EMPTY_FORM = { name: "", student_no: "", grade: "", class_name: "", school_name: "" };

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  async function fetchStudents() {
    setLoading(true);
    setError("");
    try {
      const data = await listStudents({ limit: 100 });
      setStudents(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStudents(); }, []);

  function openModal() {
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.student_no.trim() || !form.grade) {
      setFormError("姓名、学号、年级为必填项");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await createStudent({
        name: form.name.trim(),
        role: "student",
        status: "active",
        student_profile: {
          student_no: form.student_no.trim(),
          grade: form.grade,
          class_name: form.class_name.trim() || null,
          school_name: form.school_name.trim() || null,
        },
      });
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      setFormError(err.message || "创建失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await deleteUser(id);
      setConfirmDeleteId(null);
      fetchStudents();
    } catch (err) {
      alert(err.message || "删除失败");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">学生管理</h1>
          <p className="mt-1 text-sm text-slate-500">共 {total} 名学生</p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
        >
          <Plus className="h-4 w-4" />
          新增学生
        </button>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">加载中...</div>
        ) : students.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">暂无学生数据</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                {["姓名", "学号", "年级", "班级", "学校", "状态", "操作"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                  <td className="px-4 py-3 text-slate-600">{s.student_profile?.student_no || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{s.student_profile?.grade || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{s.student_profile?.class_name || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{s.student_profile?.school_name || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.status === "active" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {s.status === "active" ? "在读" : "停用"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(s.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 新增学生 Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">新增学生</h2>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <Field label="姓名 *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="学生姓名" />
              <Field label="学号 *" value={form.student_no} onChange={(v) => setForm({ ...form, student_no: v })} placeholder="如 S2024001" />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">年级 *</label>
                <select
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">请选择年级</option>
                  {GRADE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <Field label="班级" value={form.class_name} onChange={(v) => setForm({ ...form, class_name: v })} placeholder="如 1班" />
              <Field label="学校" value={form.school_name} onChange={(v) => setForm({ ...form, school_name: v })} placeholder="如 实验小学" />

              {formError && <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{formError}</div>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                  取消
                </button>
                <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition">
                  {submitting ? "创建中..." : "创建"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除确认 Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-2 text-lg font-bold text-slate-900">确认删除</h2>
            <p className="mb-6 text-sm text-slate-500">删除后数据不可恢复，该学生的所有错题记录也将一并删除。</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmDeleteId(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                取消
              </button>
              <button
                type="button"
                disabled={deletingId === confirmDeleteId}
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition"
              >
                {deletingId === confirmDeleteId ? "删除中..." : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      />
    </div>
  );
}
