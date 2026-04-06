import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { listWrongQuestions, resolveAssetUrl, createStudyRecord, updateWrongQuestion, generateVariantsForQuestion } from "../services/api.js";
import { readStudentSession } from "../utils/studentSession.js";
import { getDefaultSchoolTerm } from "../services/studentDemo.js";
import PracticeModal from "../components/practice/PracticeModal.jsx";
import VariantModal from "../components/practice/VariantModal.jsx";
import PracticeSession from "../components/practice/PracticeSession.jsx";

const STATUS_LABEL = {
  new: "新错题",
  reviewing: "复习中",
  mastered: "已掌握",
};

const STATUS_BADGE_CLASS = {
  new: "bg-rose-50 text-rose-600",
  reviewing: "bg-amber-50 text-amber-600",
  mastered: "bg-emerald-50 text-emerald-600",
};

function inferTerm(dateLike, grade) {
  if (!dateLike) return "";
  return getDefaultSchoolTerm(dateLike, grade);
}

function mapQuestion(item) {
  return {
    id: item.id,
    subject: item.subject?.name || "未分类学科",
    originalText: item.content || "",
    content: item.content || "",
    title: item.title || "未命名错题",
    errorReason: (item.error_reasons || []).map((reason) => reason.name).join(" / ") || "待分析",
    error_reason: (item.error_reasons || []).map((reason) => reason.name).join(" / ") || "待分析",
    date: item.updated_at || item.created_at || "",
    isRecurring: Number(item.error_count || 0) > 1,
    recurringCount: Number(item.error_count || 0),
    imageUrl: resolveAssetUrl(item.image_url),
    image_data: resolveAssetUrl(item.image_url),
    term: inferTerm(item.first_error_date || item.created_at, item.grade),
    status: item.status || "new",
  };
}

export default function QuestionBankPage() {
  const navigate = useNavigate();
  const studentId = readStudentSession()?.student?.id;
  const [questions, setQuestions] = useState([]);
  const [activeSubject, setActiveSubject] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 多选模式
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // 弹窗状态
  const [practiceQuestion, setPracticeQuestion] = useState(null);
  const [variantQuestion, setVariantQuestion] = useState(null);
  const [batchSession, setBatchSession] = useState(null);

  const fetchQuestions = useCallback(() => {
    if (!studentId) return;
    setLoading(true);
    setError("");
    listWrongQuestions({ student_id: studentId, limit: 100 })
      .then((res) => setQuestions((res?.items || []).map(mapQuestion)))
      .catch((err) => setError(err?.message || "错题列表加载失败"))
      .finally(() => setLoading(false));
  }, [studentId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const subjects = useMemo(() => Array.from(new Set(questions.map((item) => item.subject).filter(Boolean))), [questions]);
  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const matchesSubject = activeSubject === "全部" || question.subject === activeSubject;
      const keyword = searchQuery.trim();
      const matchesSearch = !keyword || question.originalText.includes(keyword) || question.title.includes(keyword) || question.errorReason.includes(keyword);
      return matchesSubject && matchesSearch;
    });
  }, [questions, activeSubject, searchQuery]);

  // 多选
  const toggleSelect = useCallback((id, event) => {
    event.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const exitMultiSelect = useCallback(() => {
    setMultiSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  // 单题重做结果
  const handlePracticeResult = useCallback(
    async (questionId, result) => {
      setPracticeQuestion(null);
      try {
        await createStudyRecord(questionId, {
          result,
          study_date: new Date().toISOString().slice(0, 10),
        });
        if (result === "correct") {
          await updateWrongQuestion(questionId, { status: "mastered" });
        } else if (result === "incorrect") {
          await updateWrongQuestion(questionId, { status: "reviewing" });
        }
      } catch {
        // 静默处理，刷新即可
      }
      fetchQuestions();
    },
    [fetchQuestions],
  );

  // 状态快速切换
  const handleToggleStatus = useCallback(
    async (question, event) => {
      event.stopPropagation();
      const newStatus = question.status === "mastered" ? "reviewing" : "mastered";
      try {
        await updateWrongQuestion(question.id, { status: newStatus });
      } catch {
        // 静默
      }
      fetchQuestions();
    },
    [fetchQuestions],
  );

  // 举一反三生成函数
  const generateFn = useCallback((wrongQuestionId) => generateVariantsForQuestion(wrongQuestionId), []);

  // 批量重做完成
  const handleBatchComplete = useCallback(
    async (results) => {
      setBatchSession(null);
      exitMultiSelect();
      for (const { questionId, result } of results) {
        try {
          await createStudyRecord(questionId, {
            result,
            study_date: new Date().toISOString().slice(0, 10),
          });
          if (result === "correct") {
            await updateWrongQuestion(questionId, { status: "mastered" });
          } else if (result === "incorrect") {
            await updateWrongQuestion(questionId, { status: "reviewing" });
          }
        } catch {
          // 继续处理下一个
        }
      }
      fetchQuestions();
    },
    [fetchQuestions, exitMultiSelect],
  );

  // 打印选中
  const handlePrintSelected = useCallback(() => {
    const ids = Array.from(selectedIds).join(",");
    navigate(`/print?ids=${ids}`);
  }, [selectedIds, navigate]);

  // 启动批量重做
  const startBatchPractice = useCallback(() => {
    const selected = questions.filter((q) => selectedIds.has(q.id));
    if (selected.length === 0) return;
    setBatchSession(selected);
  }, [questions, selectedIds]);

  if (!studentId) {
    return <div className="workspace-alert error">请先登录后再查看错题本。</div>;
  }

  const selectedCount = selectedIds.size;

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-4">
      <div className="flex items-center justify-between pt-2 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">错题本</h1>
          <p className="mt-1 text-sm text-gray-500">共 {questions.length} 道真实错题</p>
        </div>
        <button
          onClick={() => (multiSelectMode ? exitMultiSelect() : setMultiSelectMode(true))}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            multiSelectMode ? "bg-gray-200 text-gray-700" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {multiSelectMode ? "取消多选" : "多选"}
        </button>
      </div>

      {error ? <div className="workspace-alert error">{error}</div> : null}
      {loading ? <div className="workspace-alert">正在加载错题...</div> : null}

      <div className="relative">
        <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="搜索题目、标题或错因..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full rounded-2xl border border-gray-200 bg-white py-3 pr-4 pl-12 text-sm shadow-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveSubject("全部")}
          className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            activeSubject === "全部" ? "bg-indigo-600 text-white shadow-sm" : "border border-gray-200 bg-white text-gray-600"
          }`}
        >
          全部
        </button>
        {subjects.map((subject) => (
          <button
            key={subject}
            onClick={() => setActiveSubject(subject)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeSubject === subject ? "bg-indigo-600 text-white shadow-sm" : "border border-gray-200 bg-white text-gray-600"
            }`}
          >
            {subject}
          </button>
        ))}
      </div>

      <div className="space-y-3 pt-2">
        {filteredQuestions.map((question) => (
          <div
            key={question.id}
            onClick={() => !multiSelectMode && navigate(`/question/${question.id}`)}
            className={`rounded-2xl border bg-white p-4 shadow-sm transition-transform ${
              multiSelectMode ? "cursor-default" : "active:scale-98 cursor-pointer"
            } ${selectedIds.has(question.id) ? "border-indigo-300 ring-2 ring-indigo-100" : "border-gray-100"}`}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {multiSelectMode && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(question.id)}
                    onChange={(e) => toggleSelect(question.id, e)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                )}
                <span className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600">
                  {question.subject}
                </span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[question.status] || "bg-gray-50 text-gray-500"}`}>
                  {STATUS_LABEL[question.status] || question.status}
                </span>
              </div>
              <span className="text-xs text-gray-400">{question.term || question.date}</span>
            </div>

            <p className="mb-1 text-sm font-semibold text-gray-900">{question.title}</p>
            {question.imageUrl ? (
              <div className="mb-3 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                <img src={question.imageUrl} alt={question.imageName || question.title} className="max-h-48 w-full object-contain" />
              </div>
            ) : null}
            <p className="mb-3 line-clamp-2 text-sm text-gray-700">{question.originalText}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">错因:</span>
                <span className="rounded bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">
                  {question.errorReason}
                </span>
              </div>
              {question.isRecurring ? (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  反复错 {question.recurringCount} 次
                </span>
              ) : null}
            </div>

            {/* 操作按钮 */}
            {!multiSelectMode && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setPracticeQuestion(question); }}
                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
                >
                  重做
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setVariantQuestion(question); }}
                  className="rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-600 transition-colors hover:bg-purple-100"
                >
                  举一反三
                </button>
                <button
                  onClick={(e) => handleToggleStatus(question, e)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    question.status === "mastered"
                      ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                      : "bg-green-50 text-green-600 hover:bg-green-100"
                  }`}
                >
                  {question.status === "mastered" ? "标记复习中" : "标记已掌握"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-16">
          <div className="mb-3 text-4xl">&#128269;</div>
          <p className="text-sm text-gray-500">没有找到相关错题</p>
        </div>
      ) : null}

      {/* 多选模式底部浮动工具栏 */}
      {multiSelectMode && (
        <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-200 bg-white px-4 py-3 shadow-lg">
          <div className="mx-auto flex max-w-2xl items-center justify-center gap-3">
            <button
              onClick={startBatchPractice}
              disabled={selectedCount === 0}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              批量重做 ({selectedCount})
            </button>
            <button
              onClick={handlePrintSelected}
              disabled={selectedCount === 0}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              打印选中 ({selectedCount})
            </button>
            <button
              onClick={exitMultiSelect}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 单题重做弹窗 */}
      {practiceQuestion && (
        <PracticeModal
          question={practiceQuestion}
          onResult={handlePracticeResult}
          onClose={() => setPracticeQuestion(null)}
        />
      )}

      {/* 举一反三弹窗 */}
      {variantQuestion && (
        <VariantModal
          question={variantQuestion}
          onClose={() => setVariantQuestion(null)}
          generateFn={generateFn}
        />
      )}

      {/* 批量练习会话 */}
      {batchSession && (
        <PracticeSession
          questions={batchSession}
          onComplete={handleBatchComplete}
          onExit={() => { setBatchSession(null); exitMultiSelect(); }}
        />
      )}
    </div>
  );
}
