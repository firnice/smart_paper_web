import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createPrintPackExport, generateVariantsForQuestion, listWrongQuestions, resolveAssetUrl } from "../services/api.js";
import { readStudentSession } from "../utils/studentSession.js";
import { useTerm } from "../context/TermContext.jsx";
import PrintWorkbenchStepper from "./print/components/PrintWorkbenchStepper.jsx";
import SelectQuestionsStep from "./print/components/SelectQuestionsStep.jsx";
import PracticeConfigStep from "./print/components/PracticeConfigStep.jsx";
import PreviewArrangeStep from "./print/components/PreviewArrangeStep.jsx";
import {
  ANSWER_MODES,
  DEFAULT_PROMPT,
  STEP_META,
  buildPrintExportPayload,
  buildPreviewItems,
  buildPreviewSourceKey,
  createEmptyConfig,
  estimatePages,
  mapWrongQuestionToPrintQuestion,
  normalizeVariantItem,
} from "./print/helpers.js";
import "../styles/print-workbench.css";

const QUESTION_VIEW_MODES = [
  { id: "full", title: "全信息展示" },
  { id: "compact", title: "简略信息" },
  { id: "list", title: "列表形式" },
];

function resolveInitialSelection(items, requestedIds, previousIds) {
  const available = new Set(items.map((item) => item.id));

  if (requestedIds.length > 0) {
    return requestedIds.map(String).filter((id) => available.has(id));
  }

  if (previousIds.length > 0) {
    const kept = previousIds.filter((id) => available.has(id));
    if (kept.length > 0) return kept;
  }

  return items
    .filter((item) => item.status !== "mastered" && !item.hasBeenPrinted)
    .slice(0, 6)
    .map((item) => item.id);
}

function PrintBottomBar({
  step,
  selectedCount,
  filteredCount,
  allFilteredSelected,
  aiReadyCount,
  generatingCount,
  previewCount,
  estimatedPages,
  answerMode,
  exportUrl,
  exporting,
  onSelectAll,
  onClearSelection,
  onBack,
  onNext,
  onExport,
}) {
  const answerModeTitle = ANSWER_MODES.find((item) => item.id === answerMode)?.title || "";

  return (
    <div className="print-workbench-screen-only print-workbench-fixed-bar">
      <div className="print-workbench-fixed-bar-inner">
        {step === 1 ? (
          <>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <div>
                已选题目：<span className="font-semibold text-indigo-600">{selectedCount} 题</span>
              </div>
              <div>
                当前结果：<span className="font-semibold text-slate-900">{filteredCount} 题</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={filteredCount === 0 || allFilteredSelected}
                onClick={onSelectAll}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                全选
              </button>
              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={onClearSelection}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-700 transition hover:border-rose-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                取消
              </button>
              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={onNext}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-[13px] font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                下一步：配置练习
              </button>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600">
              <div>
                原题：<span className="font-semibold text-slate-900">{selectedCount}</span>
              </div>
              <div>
                AI 生成：<span className="font-semibold text-indigo-600">{aiReadyCount}</span>
              </div>
              <div>
                合计：<span className="font-semibold text-slate-900">{selectedCount + aiReadyCount} 题</span>
              </div>
              {generatingCount > 0 ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  生成中 {generatingCount} 题
                </div>
              ) : null}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
              >
                上一步
              </button>
              <button
                type="button"
                disabled={selectedCount === 0 || generatingCount > 0}
                onClick={onNext}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-[13px] font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                下一步：预览与排版
              </button>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600">
              <div>
                最终题数：<span className="font-semibold text-slate-900">{previewCount}</span>
              </div>
              <div>
                预计页数：<span className="font-semibold text-indigo-600">{estimatedPages} 页</span>
              </div>
              <div>
                答案方式：<span className="font-semibold text-slate-900">{answerModeTitle}</span>
              </div>
              {exportUrl ? (
                <a
                  href={exportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-medium text-indigo-600 transition hover:text-indigo-700"
                >
                  查看最近一次导出结果
                </a>
              ) : null}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
              >
                返回修改
              </button>
              <button
                type="button"
                disabled={previewCount === 0 || exporting}
                onClick={onExport}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-[13px] font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {exporting ? "导出中..." : "导出 PDF"}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function PrintPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = readStudentSession();
  const student = session?.student || null;
  const studentId = student?.id;
  const studentGrade = student?.student_profile?.grade || "";

  const { currentTerm } = useTerm();

  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [questionViewMode, setQuestionViewMode] = useState(QUESTION_VIEW_MODES[0].id);
  const [questions, setQuestions] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [answerMode, setAnswerMode] = useState(ANSWER_MODES[2].id);
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewState, setPreviewState] = useState({ sourceKey: "", items: [] });
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState("");

  const requestedIds = useMemo(() => {
    const raw = new URLSearchParams(location.search).get("ids") || "";
    return raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }, [location.search]);

  const refreshQuestions = useCallback(async () => {
    if (!studentId) return;

    setLoading(true);
    setError("");

    try {
      const response = await listWrongQuestions({
        student_id: studentId,
        term_id: currentTerm?.id || undefined,
        limit: 100,
      });
      const mapped = (response?.items || []).map((item) => mapWrongQuestionToPrintQuestion(item, studentGrade));
      setQuestions(mapped);
      setSelectedIds((previousIds) => resolveInitialSelection(mapped, requestedIds, previousIds));
    } catch (err) {
      setError(err?.message || "错题列表加载失败");
    } finally {
      setLoading(false);
    }
  }, [requestedIds, studentGrade, studentId, currentTerm?.id]);

  useEffect(() => {
    if (!studentId) return;
    refreshQuestions();
  }, [studentId, refreshQuestions]);

  const selectedQuestions = useMemo(
    () => questions.filter((item) => selectedIds.includes(item.id)),
    [questions, selectedIds],
  );

  const subjectOptions = useMemo(
    () => Array.from(new Set(questions.map((q) => q.subject).filter(Boolean))),
    [questions],
  );

  const filteredQuestions = useMemo(() => {
    let result = questions;
    if (subjectFilter) {
      result = result.filter((item) => item.subject === subjectFilter);
    }
    const keyword = search.trim().toLowerCase();
    if (keyword) {
      result = result.filter((item) => {
        const source = [item.subject, item.grade, item.title, item.content, item.category, item.errorReason, item.keywords]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return source.includes(keyword);
      });
    }
    return result;
  }, [questions, search, subjectFilter]);

  const configsById = useMemo(
    () => Object.fromEntries(selectedQuestions.map((question) => [question.id, configs[question.id] || createEmptyConfig()])),
    [configs, selectedQuestions],
  );

  const allFilteredSelected = useMemo(
    () => filteredQuestions.length > 0 && filteredQuestions.every((item) => selectedIds.includes(item.id)),
    [filteredQuestions, selectedIds],
  );

  const generatingCount = useMemo(
    () => selectedQuestions.filter((question) => (configs[question.id] || createEmptyConfig()).loading).length,
    [configs, selectedQuestions],
  );

  const aiEnabledCount = useMemo(
    () => selectedQuestions.filter((question) => (configs[question.id] || createEmptyConfig()).gen).length,
    [configs, selectedQuestions],
  );

  const aiReadyCount = useMemo(
    () =>
      selectedQuestions.reduce((total, question) => {
        const config = configs[question.id] || createEmptyConfig();
        if (!config.gen || config.items.length === 0) return total;
        return total + config.items.filter((item) => item.selected !== false).length;
      }, 0),
    [configs, selectedQuestions],
  );

  const previewSourceKey = useMemo(
    () => buildPreviewSourceKey(selectedQuestions, configs),
    [configs, selectedQuestions],
  );

  const syncPreview = useCallback(() => {
    setPreviewState((current) => {
      if (current.sourceKey === previewSourceKey) return current;
      return {
        sourceKey: previewSourceKey,
        items: buildPreviewItems(selectedQuestions, configs),
      };
    });
  }, [configs, previewSourceKey, selectedQuestions]);

  useEffect(() => {
    if (step === 3) {
      syncPreview();
    }
  }, [step, syncPreview]);

  useEffect(() => {
    setExportUrl("");
  }, [answerMode, previewSourceKey]);

  const previewItems = previewState.items;
  const estimatedPages = useMemo(() => estimatePages(previewItems, answerMode), [answerMode, previewItems]);

  const updateConfig = useCallback((questionId, updater) => {
    setConfigs((previous) => {
      const current = previous[questionId] || createEmptyConfig();
      return {
        ...previous,
        [questionId]: updater(current),
      };
    });
  }, []);

  const handleToggleQuestion = useCallback((questionId, checked) => {
    setSelectedIds((previous) => {
      if (checked) {
        if (previous.includes(questionId)) return previous;
        return [...previous, questionId];
      }
      return previous.filter((item) => item !== questionId);
    });
    setPreviewState((current) => ({ ...current, sourceKey: "" }));
  }, []);

  const handleSelectAllFiltered = useCallback(() => {
    setSelectedIds((previous) => {
      const merged = new Set(previous);
      filteredQuestions.forEach((item) => merged.add(item.id));
      return Array.from(merged);
    });
    setPreviewState((current) => ({ ...current, sourceKey: "" }));
  }, [filteredQuestions]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds([]);
    setPreviewState((current) => ({ ...current, sourceKey: "" }));
  }, []);

  const handleGoStep = useCallback(
    (targetStep) => {
      if (!studentId) {
        toast.error("请先登录后再使用打印重做包");
        navigate("/login");
        return;
      }

      if (targetStep > 1 && selectedIds.length === 0) {
        toast.error("请先至少勾选 1 道错题");
        return;
      }

      if (targetStep === 3 && generatingCount > 0) {
        toast.error("仍有题目正在生成，请等待后再进入预览");
        return;
      }

      if (targetStep === 3) {
        syncPreview();
      }

      setStep(targetStep);
    },
    [generatingCount, navigate, selectedIds.length, studentId, syncPreview],
  );

  const handleGenerateVariants = useCallback(
    async (questionId) => {
      const question = questions.find((item) => item.id === questionId);
      if (!question) return;

      updateConfig(questionId, (current) => ({
        ...current,
        gen: true,
        loading: true,
        editingPrompt: false,
        error: "",
      }));

      try {
        const current = configs[questionId] || createEmptyConfig();
        const response = await generateVariantsForQuestion(question.rawId, {
          count: 2,
          prompt: String(current.prompt || DEFAULT_PROMPT).trim() || DEFAULT_PROMPT,
          include_images: question.hasImg,
        });
        const items = (response?.items || response?.variants || [])
          .map((item, index) => normalizeVariantItem(item, questionId, index))
          .filter((item) => String(item.text || "").trim());

        if (items.length === 0) {
          throw new Error("后端未返回可用的 AI 练习题");
        }

        updateConfig(questionId, (draft) => ({
          ...draft,
          gen: true,
          loading: false,
          editingPrompt: false,
          error: "",
          prompt: response?.used_prompt || draft.prompt || DEFAULT_PROMPT,
          items,
        }));

        setPreviewState((current) => ({ ...current, sourceKey: "" }));
        toast.success("AI 同类题已生成");
      } catch (err) {
        updateConfig(questionId, (current) => ({
          ...current,
          gen: true,
          loading: false,
          error: err?.message || "AI 生成失败",
        }));
        toast.error(err?.message || "AI 生成失败");
      }
    },
    [configs, questions, updateConfig],
  );

  const handleToggleAi = useCallback(
    (questionId, enabled) => {
      if (!enabled) {
        updateConfig(questionId, (current) => ({
          ...current,
          gen: false,
          loading: false,
          editingPrompt: false,
          error: "",
        }));
        setPreviewState((current) => ({ ...current, sourceKey: "" }));
        return;
      }

      const current = configs[questionId] || createEmptyConfig();
      if (current.items.length > 0) {
        updateConfig(questionId, (draft) => ({
          ...draft,
          gen: true,
          error: "",
        }));
        setPreviewState((stateDraft) => ({ ...stateDraft, sourceKey: "" }));
        return;
      }

      handleGenerateVariants(questionId);
    },
    [configs, handleGenerateVariants, updateConfig],
  );

  const handleToggleVariantSelection = useCallback((questionId, variantId, selected) => {
    updateConfig(questionId, (current) => {
      const items = current.items.map((item) =>
        item.id === variantId ? { ...item, selected } : item,
      );
      return { ...current, items };
    });
    setPreviewState((current) => ({ ...current, sourceKey: "" }));
  }, [updateConfig]);

  const handleRemoveVariant = useCallback((questionId, variantId) => {
    updateConfig(questionId, (current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== variantId),
    }));
    setPreviewState((current) => ({ ...current, sourceKey: "" }));
  }, [updateConfig]);

  const handlePromptChange = useCallback((questionId, value) => {
    updateConfig(questionId, (current) => ({
      ...current,
      prompt: value,
    }));
  }, [updateConfig]);

  const handleOpenPromptEditor = useCallback((questionId) => {
    updateConfig(questionId, (current) => ({
      ...current,
      editingPrompt: true,
    }));
  }, [updateConfig]);

  const handleClosePromptEditor = useCallback((questionId) => {
    updateConfig(questionId, (current) => ({
      ...current,
      editingPrompt: false,
    }));
  }, [updateConfig]);

  const handleConfirmPrompt = useCallback(
    async (questionId) => {
      await handleGenerateVariants(questionId);
    },
    [handleGenerateVariants],
  );

  const handleMovePreviewItem = useCallback((itemId, direction) => {
    setPreviewState((current) => {
      const sourceIndex = current.items.findIndex((item) => item.id === itemId);
      const targetIndex = sourceIndex + direction;
      if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= current.items.length) return current;
      const nextItems = [...current.items];
      const [item] = nextItems.splice(sourceIndex, 1);
      nextItems.splice(targetIndex, 0, item);
      return { ...current, items: nextItems };
    });
  }, []);

  const handleDeletePreviewItem = useCallback((itemId) => {
    setPreviewState((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== itemId),
    }));
  }, []);

  const handleReorderPreviewItems = useCallback((fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;

    setPreviewState((current) => {
      const sourceIndex = current.items.findIndex((item) => item.id === fromId);
      const targetIndex = current.items.findIndex((item) => item.id === toId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const nextItems = [...current.items];
      const [item] = nextItems.splice(sourceIndex, 1);
      nextItems.splice(targetIndex, 0, item);
      return { ...current, items: nextItems };
    });
  }, []);

  const handleExport = useCallback(async () => {
    if (previewItems.length === 0) {
      toast.error("当前没有可导出的题目");
      return;
    }

    setExporting(true);

    try {
      const payload = buildPrintExportPayload({
        previewItems,
        answerMode,
        student,
      });
      const response = await createPrintPackExport(payload);
      const downloadUrl = resolveAssetUrl(response?.download_url || response?.url || "");

      if (!downloadUrl) {
        throw new Error("导出成功，但未返回下载地址");
      }

      setExportUrl(downloadUrl);
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
      toast.success("PDF 已生成");
    } catch (err) {
      toast.error(err?.message || "导出 PDF 失败");
    } finally {
      setExporting(false);
    }
  }, [answerMode, previewItems, student]);

  if (!studentId) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-8">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
          当前没有有效登录态，无法加载真实错题与 AI 生成接口。
        </div>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-indigo-600 px-5 text-sm font-bold text-white"
        >
          去登录
        </button>
      </div>
    );
  }

  return (
    <div className="print-workbench-page print-workbench-page-with-fixed-bar space-y-6">
      <section className="print-workbench-steps-wrap print-workbench-screen-only rounded-[16px] border border-[#F0F0F0] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <PrintWorkbenchStepper currentStep={step} onStepClick={handleGoStep} />
      </section>

      {step === STEP_META[0].id ? (
        <SelectQuestionsStep
          loading={loading}
          error={error}
          questions={questions}
          filteredQuestions={filteredQuestions}
          selectedIds={selectedIds}
          search={search}
          subjectFilter={subjectFilter}
          subjectOptions={subjectOptions}
          viewMode={questionViewMode}
          viewModes={QUESTION_VIEW_MODES}
          onSearchChange={setSearch}
          onSubjectFilterChange={setSubjectFilter}
          onViewModeChange={setQuestionViewMode}
          onToggleQuestion={handleToggleQuestion}
          onRefresh={refreshQuestions}
        />
      ) : null}

      {step === STEP_META[1].id ? (
        <PracticeConfigStep
          selectedQuestions={selectedQuestions}
          answerMode={answerMode}
          configsById={configsById}
          generatingCount={generatingCount}
          aiEnabledCount={aiEnabledCount}
          aiReadyCount={aiReadyCount}
          onBack={() => handleGoStep(1)}
          onNext={() => handleGoStep(3)}
          onAnswerModeChange={setAnswerMode}
          onToggleAi={handleToggleAi}
          onToggleVariantSelection={handleToggleVariantSelection}
          onRemoveVariant={handleRemoveVariant}
          onPromptChange={handlePromptChange}
          onOpenPromptEditor={handleOpenPromptEditor}
          onClosePromptEditor={handleClosePromptEditor}
          onConfirmPrompt={handleConfirmPrompt}
          onRetryGenerate={handleGenerateVariants}
        />
      ) : null}

      {step === STEP_META[2].id ? (
        <PreviewArrangeStep
          previewItems={previewItems}
          answerMode={answerMode}
          estimatedPages={estimatedPages}
          exporting={exporting}
          exportUrl={exportUrl}
          onBack={() => handleGoStep(2)}
          onExport={handleExport}
          onMoveItem={handleMovePreviewItem}
          onDeleteItem={handleDeletePreviewItem}
          onReorderItems={handleReorderPreviewItems}
        />
      ) : null}

      <PrintBottomBar
        step={step}
        selectedCount={selectedQuestions.length}
        filteredCount={filteredQuestions.length}
        allFilteredSelected={allFilteredSelected}
        aiReadyCount={aiReadyCount}
        generatingCount={generatingCount}
        previewCount={previewItems.length}
        estimatedPages={estimatedPages}
        answerMode={answerMode}
        exportUrl={exportUrl}
        exporting={exporting}
        onSelectAll={handleSelectAllFiltered}
        onClearSelection={handleClearSelection}
        onBack={() => handleGoStep(Math.max(1, step - 1))}
        onNext={() => handleGoStep(Math.min(3, step + 1))}
        onExport={handleExport}
      />
    </div>
  );
}
