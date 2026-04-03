import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDefaultSchoolTerm, getTermOptions } from "../../services/studentDemo.js";
import {
  createStudyRecord,
  deleteWrongQuestion,
  getStatisticsOverview,
  listErrorReasons,
  listStudyRecords,
  listSubjects,
  listWrongQuestionCategories,
  listWrongQuestions,
  updateWrongQuestion,
} from "../../services/api.js";
import { clearStudentSession, readStudentSession } from "../../utils/studentSession.js";
import { DEFAULT_SUBJECT_OPTIONS, EDIT_INITIAL, STATUS_LABEL } from "./constants.js";
import { buildStats, mapWrongQuestionItem } from "./mappers.js";
import useComposer from "./hooks/useComposer.js";
import StatsBar from "./components/StatsBar.jsx";
import QuestionList from "./components/QuestionList.jsx";
import EditModal from "./components/EditModal.jsx";
import ComposerModal from "./components/ComposerModal.jsx";

function QuickActionCard({ title, desc, actionLabel, onAction, tone = "light" }) {
  const style = tone === "dark"
    ? "border-slate-900 bg-slate-900 text-white"
    : "border-white/80 bg-white text-slate-900";

  return (
    <section className={`rounded-3xl border p-5 shadow-sm ${style}`}>
      <h3 className="text-base font-bold">{title}</h3>
      <p className={`mt-2 text-sm leading-6 ${tone === "dark" ? "text-slate-300" : "text-slate-500"}`}>{desc}</p>
      <button
        type="button"
        onClick={onAction}
        className={`mt-4 inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold ${
          tone === "dark"
            ? "bg-white text-slate-900"
            : "border border-slate-200 bg-slate-50 text-slate-700"
        }`}
      >
        {actionLabel}
      </button>
    </section>
  );
}

export default function WorkspacePage({ defaultOpenComposer = false, pageMode = "workspace" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const autoOpenedRef = useRef(false);

  const [session, setSession] = useState(() => readStudentSession());
  const [stats, setStats] = useState(null);
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [termOptions, setTermOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [errorReasonOptions, setErrorReasonOptions] = useState([]);
  const [studyRecordMap, setStudyRecordMap] = useState({});
  const [studyRecordTotalMap, setStudyRecordTotalMap] = useState({});
  const [editForm, setEditForm] = useState(EDIT_INITIAL);
  const [editingItem, setEditingItem] = useState(null);
  const [filters, setFilters] = useState({ keyword: "", subject: "", term: "", status: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const studentId = session?.student?.id;
  const profile = session?.student?.student_profile || {};

  const setSuccess = (message) => {
    setError("");
    setNotice(message);
  };

  const setFailure = (message) => {
    setNotice("");
    setError(message);
  };

  const refresh = useCallback(async () => {
    if (!studentId) return;

    const [subjectsRes, categoriesRes, reasonsRes] = await Promise.all([
      listSubjects({ limit: 100 }),
      listWrongQuestionCategories({ limit: 100 }),
      listErrorReasons({ limit: 200 }),
    ]);

    const subjectMap = new Map((subjectsRes?.items || []).map((item) => [item.name, item.id]));
    const selectedSubjectId = filters.subject ? subjectMap.get(filters.subject) : undefined;

    const wrongRes = await listWrongQuestions({
      student_id: studentId,
      subject_id: selectedSubjectId,
      status: filters.status || undefined,
      keyword: filters.keyword || undefined,
      limit: 100,
    });

    const mappedItems = (wrongRes?.items || [])
      .map(mapWrongQuestionItem)
      .filter((item) => !filters.term || item.term === filters.term);

    const studyEntries = await Promise.all(
      mappedItems.map(async (item) => {
        const response = await listStudyRecords(item.id, { limit: 20 });
        return [item.id, { items: response?.items || [], total: Number(response?.total || 0) }];
      }),
    );

    const statsRes = await getStatisticsOverview(studentId);
    const studyEntryMap = Object.fromEntries(studyEntries);

    setStats(buildStats(statsRes, mappedItems));
    setWrongQuestions(mappedItems);
    setStudyRecordMap(Object.fromEntries(Object.entries(studyEntryMap).map(([id, value]) => [id, value.items])));
    setStudyRecordTotalMap(Object.fromEntries(Object.entries(studyEntryMap).map(([id, value]) => [id, value.total])));
    setSubjectOptions(Array.from(new Set(mappedItems.map((item) => item.subject).filter(Boolean))));
    setTermOptions(Array.from(new Set(mappedItems.map((item) => item.term).filter(Boolean))));
    setCategoryOptions(categoriesRes?.items || []);
    setErrorReasonOptions(reasonsRes?.items || []);
  }, [studentId, filters]);

  const composer = useComposer({
    studentId,
    profile,
    subjectOptions,
    categoryOptions,
    errorReasonOptions,
    refresh,
    setSuccess,
    setFailure,
  });

  useEffect(() => {
    if (!studentId) {
      navigate("/login");
      return;
    }
    refresh().catch((err) => {
      setFailure(err?.message || "学生错题本加载失败");
    });
  }, [studentId, navigate, refresh]);

  // 当 profile.grade 可用后，给 form.term 设置默认值
  useEffect(() => {
    const grade = profile.grade;
    if (!grade) return;
    composer.setForm((prev) => {
      if (prev.term) return prev;
      return { ...prev, term: getDefaultSchoolTerm(null, grade) };
    });
  }, [profile.grade]);

  // 响应中央 FAB 按钮
  useEffect(() => {
    if (location.state?.openComposer) {
      composer.onOpenComposer();
      // 清除 state 避免重复触发
      window.history.replaceState({}, "");
    }
  }, [location.state?.openComposer]);

  useEffect(() => {
    if (!defaultOpenComposer || autoOpenedRef.current) return;
    composer.onOpenComposer();
    autoOpenedRef.current = true;
  }, [composer, defaultOpenComposer]);

  const onChangeStatus = async (wrongQuestionId, status) => {
    if (!studentId) return;
    setLoading(true);
    try {
      await updateWrongQuestion(wrongQuestionId, { status });
      await refresh();
      setSuccess(`已更新为${STATUS_LABEL[status]}`);
    } catch (err) {
      setFailure(err?.message || "状态更新失败");
    } finally {
      setLoading(false);
    }
  };

  const onPractice = async (wrongQuestionId, result) => {
    if (!studentId) return;
    setLoading(true);
    try {
      await createStudyRecord(wrongQuestionId, {
        student_id: Number(studentId),
        result,
        mastery_level: result === "correct" ? 4 : 2,
      });
      await refresh();
      setSuccess(result === "correct" ? "已记录：本次做对" : "已记录：本次仍做错");
    } catch (err) {
      setFailure(err?.message || "练习记录失败");
    } finally {
      setLoading(false);
    }
  };

  const onToggleBookmark = async (item) => {
    setLoading(true);
    try {
      await updateWrongQuestion(item.id, { is_bookmarked: !item.is_bookmarked });
      await refresh();
      setSuccess(item.is_bookmarked ? "已取消收藏" : "已加入收藏");
    } catch (err) {
      setFailure(err?.message || "收藏状态更新失败");
    } finally {
      setLoading(false);
    }
  };

  const onDeleteWrongQuestion = async (item) => {
    if (!window.confirm(`确认删除错题《${item.title}》吗？`)) return;
    setLoading(true);
    try {
      await deleteWrongQuestion(item.id);
      await refresh();
      setSuccess("错题已删除");
    } catch (err) {
      setFailure(err?.message || "删除错题失败");
    } finally {
      setLoading(false);
    }
  };

  const onStartEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      id: item.id,
      title: item.title || "",
      notes: item.notes || "",
      status: item.status || "new",
      is_bookmarked: Boolean(item.is_bookmarked),
      error_reason_ids: item.error_reason_ids || [],
    });
  };

  const onSubmitEdit = async (event) => {
    event.preventDefault();
    if (!editingItem) return;
    setLoading(true);
    try {
      await updateWrongQuestion(editingItem.id, {
        title: editForm.title || null,
        notes: editForm.notes || null,
        status: editForm.status,
        is_bookmarked: editForm.is_bookmarked,
        error_reason_ids: editForm.error_reason_ids,
      });
      setEditingItem(null);
      setEditForm(EDIT_INITIAL);
      await refresh();
      setSuccess("错题维护已更新");
    } catch (err) {
      setFailure(err?.message || "错题更新失败");
    } finally {
      setLoading(false);
    }
  };

  if (!session?.student) return null;

  const student = session.student;
  const gradeTermOptions = getTermOptions(profile.grade);
  const formTermOptions = Array.from(new Set([...gradeTermOptions, ...termOptions, composer.form.term].filter(Boolean)));
  const filterSubjectOptions = Array.from(
    new Set([...DEFAULT_SUBJECT_OPTIONS, ...subjectOptions, composer.form.subject].filter(Boolean)),
  );
  // Only show terms that actually have questions (termOptions comes from loaded wrong questions)
  const filterTermOptions = Array.from(new Set(termOptions.filter(Boolean)));
  const isCaptureMode = pageMode === "capture";
  const totalQuestions = wrongQuestions.length;
  const newCount = Number(stats?.new_count || 0);
  const reviewingCount = Number(stats?.reviewing_count || 0);
  const masteredCount = Number(stats?.mastered_count || 0);
  const headerTitle = isCaptureMode ? "录入中心" : `${student.name} 的错题本`;
  const headerSubtitle = isCaptureMode
    ? "手机更适合拍照和即时保存，电脑更适合上传整页、校对 OCR 和批量整理。"
    : `${profile.grade || "未设置年级"} · 学号 ${profile.student_no || "-"} · 录入后可直接跨设备继续处理`;

  return (
    <div className="pb-4">
      {/* Page Header */}
      <header className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-[24px] font-black leading-tight tracking-tight text-gray-900">{headerTitle}</h1>
          <p className="mt-1 text-[13px] leading-6 text-gray-500">{headerSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-2xl px-4 py-3 text-[13px] font-bold text-white transition active:scale-95"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", boxShadow: "0 2px 10px rgba(99,102,241,0.35)" }}
            onClick={composer.onOpenComposer}
          >
            {isCaptureMode ? "开始录入" : "+ 添加"}
          </button>
          <button
            type="button"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] font-semibold text-slate-600 shadow-sm"
            onClick={() => navigate("/print")}
          >
            去打印
          </button>
        </div>
      </header>

      {notice && <div className="workspace-alert ok mb-3">{notice}</div>}
      {error && <div className="workspace-alert error mb-3">{error}</div>}
      {loading && <div className="workspace-alert mb-3">处理中...</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <StatsBar stats={stats} />

          <QuestionList
            wrongQuestions={wrongQuestions}
            studyRecordMap={studyRecordMap}
            studyRecordTotalMap={studyRecordTotalMap}
            filters={filters}
            setFilters={setFilters}
            filterSubjectOptions={filterSubjectOptions}
            filterTermOptions={filterTermOptions}
            defaultTerm={getDefaultSchoolTerm(null, profile.grade)}
            onPractice={onPractice}
            onChangeStatus={onChangeStatus}
            onToggleBookmark={onToggleBookmark}
            onStartEdit={onStartEdit}
            onDelete={onDeleteWrongQuestion}
          />
        </div>

        <aside className="space-y-4">
          <QuickActionCard
            title="跨设备建议"
            desc="手机更适合拍照、裁剪和即时保存；电脑更适合看整页、修正 OCR、批量编辑与打印。无论从哪端开始，数据都会回到同一份错题本。"
            actionLabel={isCaptureMode ? "去错题本整理" : "去录入一批新题"}
            onAction={() => navigate(isCaptureMode ? "/workspace" : "/capture")}
            tone="dark"
          />

          <section className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">当前摘要</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <span className="text-slate-500">总错题</span>
                <strong className="text-slate-900">{totalQuestions}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-red-50 px-3 py-3">
                <span className="text-red-500">待处理</span>
                <strong className="text-red-600">{newCount}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-3 py-3">
                <span className="text-amber-600">复习中</span>
                <strong className="text-amber-700">{reviewingCount}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-3 py-3">
                <span className="text-emerald-600">已掌握</span>
                <strong className="text-emerald-700">{masteredCount}</strong>
              </div>
            </div>
          </section>

          <QuickActionCard
            title="下一步"
            desc="如果你已经完成录入，建议直接去打印页挑题生成练习包，再回填线下重做结果。"
            actionLabel="去打印页"
            onAction={() => navigate("/print")}
          />

          <QuickActionCard
            title="查看分析"
            desc="想先看孩子最近的学科分布和掌握趋势，可以直接进入分析页，按高频错题决定下一批打印内容。"
            actionLabel="去分析页"
            onAction={() => navigate("/analysis")}
          />
        </aside>
      </div>

      <EditModal
        editingItem={editingItem}
        editForm={editForm}
        setEditForm={setEditForm}
        errorReasonOptions={errorReasonOptions}
        onSubmitEdit={onSubmitEdit}
        onClose={() => setEditingItem(null)}
      />

      <ComposerModal
        composer={composer}
        profile={profile}
        formTermOptions={formTermOptions}
      />
    </div>
  );
}
