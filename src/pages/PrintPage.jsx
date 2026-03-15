import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Printer, CheckCircle2, ChevronDown } from "lucide-react";
import { createExport, listWrongQuestions } from "../services/api.js";
import { readStudentSession } from "../utils/studentSession.js";

const MODES = [
  { id: "simple", label: "仅原题", desc: "按原题打印重做" },
  { id: "medium", label: "适中练习", desc: "原题优先，预留拓展空间" },
  { id: "intensive", label: "强化训练", desc: "更多题目，集中重做" },
];

function inferTerm(dateLike) {
  if (!dateLike) return "";
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "";
  const month = date.getMonth() + 1;
  return `${date.getFullYear()}${month <= 7 ? "春学期" : "秋学期"}`;
}

function mapQuestion(item) {
  return {
    id: item.id,
    title: item.title || "未命名错题",
    subject: item.subject?.name || "未分类学科",
    content: item.content || "",
    status: item.status || "new",
    isBookmarked: Boolean(item.is_bookmarked),
    category: item.category?.name || "未分类",
    updatedAt: item.updated_at || item.created_at || "",
    term: inferTerm(item.first_error_date || item.created_at),
  };
}

export default function PrintPage() {
  const navigate = useNavigate();
  const session = readStudentSession();
  const studentId = session?.student?.id;

  const [questions, setQuestions] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [mode, setMode] = useState("medium");
  const [hideAnswers, setHideAnswers] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exportData, setExportData] = useState(null);

  useEffect(() => {
    if (!studentId) return;
    let active = true;
    setLoading(true);
    setError("");
    listWrongQuestions({ student_id: studentId, limit: 100 })
      .then((res) => {
        if (!active) return;
        const items = (res?.items || []).map(mapQuestion);
        setQuestions(items);
        setSelectedIds(items.filter((item) => item.status !== "mastered").slice(0, 6).map((item) => item.id));
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || "真实错题加载失败");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [studentId]);

  const selectedQuestions = useMemo(
    () => questions.filter((item) => selectedIds.includes(item.id)),
    [questions, selectedIds],
  );

  const resolvedModes = MODES.map((item) => ({
    ...item,
    count:
      item.id === "simple"
        ? selectedQuestions.length
        : item.id === "medium"
          ? selectedQuestions.length
          : Math.max(selectedQuestions.length, Math.min(selectedQuestions.length + 2, questions.length)),
  }));

  const currentMode = resolvedModes.find((item) => item.id === mode) || resolvedModes[1];

  const toggleQuestion = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleGenerate = async () => {
    if (selectedQuestions.length === 0) return;
    setIsGenerating(true);
    setError("");
    try {
      const data = await createExport({
        title: `打印重做包-${new Date().toISOString().slice(0, 10)}`,
        mode: "practice_sheet",
        hide_answers: hideAnswers,
        question_items: selectedQuestions.map((question) => ({
          title: question.title,
          content: question.content,
          subject: question.subject,
          category: question.category,
        })),
      });
      setExportData(data);
      setIsDone(true);
    } catch (err) {
      setError(err?.message || "打印包生成失败");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (exportData?.download_url) {
      window.open(exportData.download_url, "_blank", "noopener,noreferrer");
      return;
    }
    window.print();
  };

  if (!studentId) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 pb-4 pt-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          请先登录学生端，再生成重做打印包。
        </div>
        <button onClick={() => navigate("/student/login")} className="btn-primary">
          去登录
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-4">
      <div className="pt-2 pb-2">
        <h1 className="text-2xl font-bold text-gray-900">打印重做包</h1>
        <p className="mt-1 text-sm text-gray-500">主流程按“选错题 → 打印 → 线下重做 → 回填结果”设计</p>
      </div>

      {error ? <div className="workspace-alert error">{error}</div> : null}
      {loading ? <div className="workspace-alert">正在加载真实错题...</div> : null}

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">选择进入重做包的错题</span>
          <span className="text-sm text-gray-500">已选 {selectedQuestions.length} 题</span>
        </div>
        <div className="space-y-2">
          {questions.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500">当前还没有可打印的真实错题。</div>
          ) : (
            questions.map((question, index) => {
              const checked = selectedIds.includes(question.id);
              return (
                <label key={question.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${checked ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-gray-50"}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleQuestion(question.id)} className="mt-1" />
                  <span className="mt-0.5 text-xs font-medium text-gray-500">{index + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">{question.subject}</span>
                      <span className="text-xs text-gray-500">{question.term || "未分期"}</span>
                      <span className="text-xs text-gray-500">{question.category}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{question.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-700">{question.content}</p>
                  </div>
                </label>
              );
            })
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">选择打印模式</h3>
        <div className="space-y-2">
          {resolvedModes.map((item) => (
            <div
              key={item.id}
              onClick={() => setMode(item.id)}
              className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                mode === item.id ? "border-indigo-600 bg-indigo-50" : "border-gray-200 bg-white hover:border-indigo-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className={`font-semibold ${mode === item.id ? "text-indigo-900" : "text-gray-900"}`}>{item.label}</span>
                    <span className="text-xs text-gray-500">{item.desc}</span>
                  </div>
                  <div className="text-sm text-gray-600">本次预计打印 {item.count} 道题</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <button onClick={() => setShowSettings((value) => !value)} className="flex w-full items-center justify-between px-5 py-4">
          <span className="text-sm font-medium text-gray-900">打印设置</span>
          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showSettings ? "rotate-180" : ""}`} />
        </button>
        {showSettings ? (
          <div className="space-y-4 border-t border-gray-100 px-5 pt-4 pb-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">隐藏参考答案</span>
              <button
                onClick={() => setHideAnswers((value) => !value)}
                className={`relative h-6 w-12 rounded-full transition-colors ${hideAnswers ? "bg-indigo-600" : "bg-gray-300"}`}
              >
                <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${hideAnswers ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {!isDone ? (
        <button
          onClick={handleGenerate}
          disabled={isGenerating || selectedQuestions.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 font-semibold text-white shadow-lg transition-all hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {isGenerating ? <span className="animate-pulse">正在准备打印包...</span> : <><Printer className="h-5 w-5" /> 生成打印重做包</>}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 py-2 font-medium text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
            打印重做包已就绪
          </div>
          <button onClick={handlePrint} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 font-semibold text-white shadow-lg transition-all hover:bg-indigo-700">
            <Printer className="h-5 w-5" />
            {exportData?.download_url ? "下载 / 打开 PDF" : "立即打印"}
          </button>
          {exportData?.download_url ? (
            <a
              href={exportData.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-2xl border-2 border-gray-200 bg-white py-3 text-center font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              打开导出文件
            </a>
          ) : null}
          <button onClick={() => setIsDone(false)} className="w-full rounded-2xl border-2 border-gray-200 bg-white py-3 font-medium text-gray-700 transition-all hover:bg-gray-50">
            重新设置
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-800">
          现在这一步已经会调用真实导出接口生成 PDF。下一步再补“导出后回填结果 / 标记已打印待重做”的状态闭环。
        </p>
      </div>
    </div>
  );
}
