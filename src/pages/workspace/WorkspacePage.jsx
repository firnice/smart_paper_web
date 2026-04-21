import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTerm } from "../../context/TermContext.jsx";
import {
  deleteWrongQuestion,
  generateDiagramSvg,
  analyzeQuestion,
  getStatisticsOverview,
  listErrorReasons,
  listSubjects,
  listWrongQuestionCategories,
  listWrongQuestions,
  updateWrongQuestion,
} from "../../services/api.js";
import { normalizeOcrImageUrl } from "../../utils/imageProcessing.js";
import { clearStudentSession, readStudentSession } from "../../utils/studentSession.js";
import { DEFAULT_SUBJECT_OPTIONS, EDIT_INITIAL, STATUS_LABEL } from "./constants.js";
import { buildStats, mapWrongQuestionItem } from "./mappers.js";
import useComposer from "./hooks/useComposer.js";
import StatsBar from "./components/StatsBar.jsx";
import QuestionList from "./components/QuestionList.jsx";
import EditModal from "./components/EditModal.jsx";
import ComposerModal from "./components/ComposerModal.jsx";
import SvgRegenerateModal from "./components/SvgRegenerateModal.jsx";

function isSvgAsset(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return false;
  return normalized.startsWith("data:image/svg+xml") || normalized.includes(".svg");
}

function buildSvgRegeneratePayload(item, prompt) {
  const latestSvgUrl = isSvgAsset(item?.svg_data)
    ? item.svg_data
    : (isSvgAsset(item?.image_data) ? item.image_data : "");
  const originalImageUrl = String(item?.original_image_data || "").trim();
  const fallbackImageUrl = !originalImageUrl && !latestSvgUrl ? String(item?.image_data || "").trim() : "";

  const payload = {
    item_id: item?.id || 0,
    question_text: item?.content || item?.title || "",
    prompt: String(prompt || "").trim(),
  };

  if (originalImageUrl) payload.original_image_url = originalImageUrl;
  if (latestSvgUrl) payload.latest_svg_url = latestSvgUrl;
  if (fallbackImageUrl) {
    payload.question_image_url = fallbackImageUrl;
    payload.diagram_image_url = fallbackImageUrl;
  }

  return payload;
}

export default function WorkspacePage({ defaultOpenComposer = false, pageMode = "workspace" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [session, setSession] = useState(() => readStudentSession());
  const { currentTerm } = useTerm();
  const [stats, setStats] = useState(null);
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [errorReasonOptions, setErrorReasonOptions] = useState([]);
  const [editForm, setEditForm] = useState(EDIT_INITIAL);
  const [editingItem, setEditingItem] = useState(null);
  const [filters, setFilters] = useState({ keyword: "", subject: "", status: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState(null); // svg or analyze
  const [svgPromptModal, setSvgPromptModal] = useState({ item: null, prompt: "" });

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

    const [subjectsResult, categoriesResult, reasonsResult] = await Promise.allSettled([
      listSubjects({ limit: 100 }),
      listWrongQuestionCategories({ limit: 100 }),
      listErrorReasons({ limit: 200 }),
    ]);
    const subjectsRes = subjectsResult.status === "fulfilled" ? subjectsResult.value : null;
    const categoriesRes = categoriesResult.status === "fulfilled" ? categoriesResult.value : null;
    const reasonsRes = reasonsResult.status === "fulfilled" ? reasonsResult.value : null;

    const subjectMap = new Map((subjectsRes?.items || []).map((item) => [item.name, item.id]));
    const selectedSubjectId = filters.subject ? subjectMap.get(filters.subject) : undefined;

    const wrongRes = await listWrongQuestions({
      student_id: studentId,
      subject_id: selectedSubjectId,
      term_id: currentTerm?.id || undefined,
      status: filters.status || undefined,
      keyword: filters.keyword || undefined,
      limit: 100,
    });

    const mappedItems = (wrongRes?.items || []).map(mapWrongQuestionItem);

    let statsRes = null;
    try {
      statsRes = await getStatisticsOverview(studentId, { term_id: currentTerm?.id || undefined });
    } catch {}

    setStats(buildStats(statsRes, mappedItems));
    setWrongQuestions(mappedItems);
    setSubjectOptions(Array.from(new Set(mappedItems.map((item) => item.subject).filter(Boolean))));
    setCategoryOptions(categoriesRes?.items || []);
    setErrorReasonOptions(reasonsRes?.items || []);
  }, [studentId, filters, currentTerm?.id]);

  const composer = useComposer({
    studentId,
    profile,
    subjectOptions,
    categoryOptions,
    errorReasonOptions,
    refresh,
    setSuccess,
    setFailure,
    navigate,
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

  // 响应中央 FAB 按钮
  useEffect(() => {
    if (location.state?.openComposer) {
      composer.onOpenComposer();
      // 清除 state 避免重复触发
      window.history.replaceState({}, "");
    }
  }, [location.state?.openComposer]);

  useEffect(() => {
    if (!defaultOpenComposer) return;
    composer.onOpenComposer();
  }, [location.pathname, defaultOpenComposer]);

  const onChangeStatus = async (wrongQuestionId, status) => {
    if (!studentId) return;
    setLoading(true);
    try {
      await updateWrongQuestion(wrongQuestionId, { status });
      await refresh();
      setSuccess(`已更新为${status === "new" ? "未掌握" : STATUS_LABEL[status]}`);
    } catch (err) {
      setFailure(err?.message || "状态更新失败");
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

  const onRegenerateSvg = (item) => {
    if (regeneratingId) return;
    setSvgPromptModal({
      item,
      prompt: "",
    });
    setError("");
    setNotice("");
  };

  const closeSvgPromptModal = () => {
    if (regeneratingId) return;
    setSvgPromptModal({ item: null, prompt: "" });
  };

  const onSubmitSvgPrompt = async (event) => {
    event.preventDefault();
    const item = svgPromptModal.item;
    if (!item || regeneratingId) return;

    const prompt = String(svgPromptModal.prompt || "").trim();
    if (!prompt) {
      setFailure("请先填写本次配图修改要求，再重新生成。");
      return;
    }

    const payload = buildSvgRegeneratePayload(item, prompt);
    if (!payload.original_image_url && !payload.latest_svg_url && !payload.question_image_url) {
      setFailure("当前缺少可参考的原图或配图，暂时无法重新生成。");
      return;
    }

    setRegeneratingId(`svg-${item.id}`);
    setError("");
    try {
      const response = await generateDiagramSvg(payload);
      const svgUrl = normalizeOcrImageUrl(response?.diagram_svg_url);
      if (!svgUrl) throw new Error("配图生成失败，请重试");
      await updateWrongQuestion(item.id, {
        image_url: response.diagram_svg_url,
        svg: response.diagram_svg_url,
      });
      setSvgPromptModal({ item: null, prompt: "" });
      await refresh();
      setSuccess("配图已重新生成");
    } catch (err) {
      setFailure(err?.message || "配图生成失败");
    } finally {
      setRegeneratingId(null);
    }
  };

  const onReanalyze = async (item) => {
    if (regeneratingId) return;
    setRegeneratingId(`analyze-${item.id}`);
    setError("");
    try {
      const result = await analyzeQuestion({
        question_text: item.content || item.title || "",
        grade: profile.grade || "",
      });
      if (!result) throw new Error("识别失败，请重试");
      const patch = {};
      if (result.title) patch.title = result.title;
      if (result.subject) {
        const matched = subjectOptions.find((s) => s.name === result.subject);
        if (matched) patch.subject_id = matched.id;
      }
      if (Object.keys(patch).length > 0) {
        await updateWrongQuestion(item.id, patch);
        await refresh();
      }
      setSuccess("题目信息已重新识别");
    } catch (err) {
      setFailure(err?.message || "题目识别失败");
    } finally {
      setRegeneratingId(null);
    }
  };

  if (!session?.student) return null;

  const student = session.student;
  const filterSubjectOptions = Array.from(
    new Set([...DEFAULT_SUBJECT_OPTIONS, ...subjectOptions, composer.form.subject].filter(Boolean)),
  );

  return (
    <div className="space-y-6 pb-4">
      {notice && <div className="workspace-alert ok mb-3">{notice}</div>}
      {error && <div className="workspace-alert error mb-3">{error}</div>}
      {loading && <div className="workspace-alert mb-3">处理中...</div>}

      <StatsBar stats={stats} />

      <QuestionList
        wrongQuestions={wrongQuestions}
        filters={filters}
        setFilters={setFilters}
        filterSubjectOptions={filterSubjectOptions}
        onChangeStatus={onChangeStatus}
        onToggleBookmark={onToggleBookmark}
        onStartEdit={onStartEdit}
        onDelete={onDeleteWrongQuestion}
        onRegenerateSvg={onRegenerateSvg}
        onReanalyze={onReanalyze}
        regeneratingId={regeneratingId}
      />

      <EditModal
        editingItem={editingItem}
        editForm={editForm}
        setEditForm={setEditForm}
        errorReasonOptions={errorReasonOptions}
        onSubmitEdit={onSubmitEdit}
        onClose={() => setEditingItem(null)}
      />

      <SvgRegenerateModal
        item={svgPromptModal.item}
        prompt={svgPromptModal.prompt}
        setPrompt={(value) => setSvgPromptModal((current) => ({ ...current, prompt: value }))}
        submitting={Boolean(svgPromptModal.item) && regeneratingId === `svg-${svgPromptModal.item.id}`}
        onSubmit={onSubmitSvgPrompt}
        onClose={closeSvgPromptModal}
      />

      <ComposerModal
        composer={composer}
      />
    </div>
  );
}
