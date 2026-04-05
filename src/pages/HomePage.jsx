import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SquarePen, BookOpen, Printer, Clock3, CircleCheckBig } from "lucide-react";
import { getStatisticsOverview, listWrongQuestions, resolveAssetUrl } from "../services/api.js";
import { readStudentSession } from "../utils/studentSession.js";

function mapQuestion(item) {
  return {
    id: item.id,
    subject: item.subject?.name || "未分类学科",
    content: item.content || "",
    imageUrl: resolveAssetUrl(item.image_url),
    imageName: item.image_name || "",
    title: item.title || "未命名错题",
    errorReason: (item.error_reasons || []).map((reason) => reason.name).join(" / ") || "待分析",
    date: item.updated_at || item.created_at || "",
  };
}

export default function HomePage() {
  const navigate = useNavigate();
  const session = readStudentSession();
  const studentId = session?.student?.id;
  const studentName = session?.student?.name || "同学";
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!studentId) return;
    Promise.all([
      listWrongQuestions({ student_id: studentId, limit: 20 }),
      getStatisticsOverview(studentId),
    ])
      .then(([wrongRes, statsRes]) => {
        setQuestions((wrongRes?.items || []).map(mapQuestion));
        setStats(statsRes);
      })
      .catch((err) => setError(err?.message || "首页数据加载失败"));
  }, [studentId]);

  const recentQuestions = useMemo(() => questions.slice(0, 5), [questions]);
  const totalCount = Number(stats?.total_wrong_questions || 0);
  const masteredCount = Number(stats?.mastered_count || 0);
  const newCount = Number(stats?.new_count || 0);
  const reviewedCount = Number(stats?.reviewing_count || 0);
  const studyCount = Number(stats?.study_records_count || 0);
  const pendingCount = Math.max(0, totalCount - masteredCount);
  const masteryRate = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

  if (!studentId) return <div className="workspace-alert error">请先登录后继续。</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="pt-2 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">你好，{studentName} 👋</h1>
        <p className="mt-1 text-sm text-gray-500">累计练习 {studyCount} 次，已掌握 {masteredCount} / {totalCount} 道错题</p>
      </div>

      {error ? <div className="workspace-alert error">{error}</div> : null}

      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="mb-1 text-sm text-indigo-200">今日先做什么</div>
            <div className="text-3xl font-bold">还有 {pendingCount} 道题待处理</div>
            <p className="mt-2 text-sm text-indigo-100">首页只看总览，真正录入、识别、精修都去工作台完成。</p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
            <SquarePen className="h-8 w-8" />
          </div>
        </div>
        <button
          onClick={() => navigate("/student/dashboard")}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/20 py-3 font-medium text-white backdrop-blur-sm transition-all hover:bg-white/30"
        >
          <SquarePen className="h-5 w-5" />
          进入工作台
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
            <Clock3 className="h-6 w-6 text-amber-600" />
          </div>
          <div className="font-semibold text-gray-900">复习中</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{reviewedCount}</div>
          <div className="mt-1 text-xs text-gray-500">和工作台 / 我的页保持同一状态口径</div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
            <CircleCheckBig className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="font-semibold text-gray-900">掌握率</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{masteryRate}%</div>
          <div className="mt-1 text-xs text-gray-500">已掌握 {masteredCount} 道 / 总共 {totalCount} 道</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm">
          <div className="font-semibold text-gray-900">新错题</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{newCount}</div>
          <div className="mt-1 text-xs text-gray-500">刚录入、还没进入掌握阶段</div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm">
          <div className="font-semibold text-gray-900">累计练习</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{studyCount}</div>
          <div className="mt-1 text-xs text-gray-500">学习记录总次数，不等于错次</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate("/bank")}
          className="rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:shadow-md"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
            <BookOpen className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="font-semibold text-gray-900">错题本</div>
          <div className="mt-1 text-xs text-gray-500">查看全部真实错题</div>
        </button>

        <button
          onClick={() => navigate("/print")}
          className="rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:shadow-md"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50">
            <Printer className="h-6 w-6 text-purple-600" />
          </div>
          <div className="font-semibold text-gray-900">打印重做包</div>
          <div className="mt-1 text-xs text-gray-500">生成真实 PDF 练习包</div>
        </button>
      </div>

      <div className="space-y-3">
          {recentQuestions.map((question) => (
            <div
              key={question.id}
              onClick={() => navigate(`/question/${question.id}`)}
              className="active:scale-98 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-transform"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <span className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600">{question.subject}</span>
                <span className="text-xs text-gray-400">{question.date}</span>
              </div>
              <p className="mb-1 text-sm font-semibold text-gray-900">{question.title}</p>
              {question.imageUrl ? (
                <div className="mb-2 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                  <img src={question.imageUrl} alt={question.imageName || question.title} className="max-h-40 w-full object-contain" />
                </div>
              ) : null}
              <p className="mb-2 line-clamp-2 text-sm text-gray-700">{question.content}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">错因:</span>
                <span className="rounded bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">{question.errorReason}</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
