import { useCallback, useEffect, useState } from "react";
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

export default function WorkspacePage() {
  const navigate = useNavigate();
  const location = useLocation();

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
      navigate("/student/login");
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

  return (
    <div className="pb-4">
      {/* Page Header */}
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold leading-tight text-gray-900">{student.name} 的错题本</h1>
          <p className="mt-0.5 text-[12px] text-gray-400">{profile.grade || ""} · 学号 {profile.student_no || "-"}</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-bold text-white transition active:scale-95"
          style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", boxShadow: "0 2px 10px rgba(99,102,241,0.35)" }}
          onClick={composer.onOpenComposer}
        >
          + 添加
        </button>
      </header>

      {notice && <div className="workspace-alert ok mb-3">{notice}</div>}
      {error && <div className="workspace-alert error mb-3">{error}</div>}
      {loading && <div className="workspace-alert mb-3">处理中...</div>}

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
