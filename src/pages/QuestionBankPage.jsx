import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { listWrongQuestions, resolveAssetUrl } from "../services/api.js";
import { readStudentSession } from "../utils/studentSession.js";
import { getDefaultSchoolTerm } from "../services/studentDemo.js";

function inferTerm(dateLike, grade) {
  if (!dateLike) return "";
  return getDefaultSchoolTerm(dateLike, grade);
}

function mapQuestion(item) {
  return {
    id: item.id,
    subject: item.subject?.name || "未分类学科",
    originalText: item.content || "",
    title: item.title || "未命名错题",
    errorReason: (item.error_reasons || []).map((reason) => reason.name).join(" / ") || "待分析",
    date: item.updated_at || item.created_at || "",
    isRecurring: Number(item.error_count || 0) > 1,
    recurringCount: Number(item.error_count || 0),
    imageUrl: resolveAssetUrl(item.image_url),
    imageName: item.image_name || "",
    term: inferTerm(item.first_error_date || item.created_at, item.grade),
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

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    setError("");
    listWrongQuestions({ student_id: studentId, limit: 100 })
      .then((res) => setQuestions((res?.items || []).map(mapQuestion)))
      .catch((err) => setError(err?.message || "错题列表加载失败"))
      .finally(() => setLoading(false));
  }, [studentId]);

  const subjects = useMemo(() => Array.from(new Set(questions.map((item) => item.subject).filter(Boolean))), [questions]);
  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const matchesSubject = activeSubject === "全部" || question.subject === activeSubject;
      const keyword = searchQuery.trim();
      const matchesSearch = !keyword || question.originalText.includes(keyword) || question.title.includes(keyword) || question.errorReason.includes(keyword);
      return matchesSubject && matchesSearch;
    });
  }, [questions, activeSubject, searchQuery]);

  if (!studentId) {
    return <div className="workspace-alert error">请先登录学生端，再查看错题本。</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-4">
      <div className="pt-2 pb-2">
        <h1 className="text-2xl font-bold text-gray-900">错题本</h1>
        <p className="mt-1 text-sm text-gray-500">共 {questions.length} 道真实错题</p>
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
            onClick={() => navigate(`/question/${question.id}`)}
            className="active:scale-98 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-transform"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <span className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600">
                {question.subject}
              </span>
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
          </div>
        ))}
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-16">
          <div className="mb-3 text-4xl">🔍</div>
          <p className="text-sm text-gray-500">没有找到相关错题</p>
        </div>
      ) : null}
    </div>
  );
}
