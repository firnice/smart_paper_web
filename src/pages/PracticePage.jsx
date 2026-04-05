import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, SkipForward } from "lucide-react";
import { createStudyRecord, getWrongQuestion, resolveAssetUrl } from "../services/api.js";
import { readStudentSession } from "../utils/studentSession.js";

const STATUS_LABEL = {
  new: "新错题",
  reviewing: "复习中",
  mastered: "已掌握",
};

function mapQuestion(item) {
  return {
    id: item.id,
    title: item.title || "未命名错题",
    content: item.content || "",
    subject: item.subject?.name || "未分类学科",
    imageUrl: resolveAssetUrl(item.image_url),
    imageName: item.image_name || "",
    status: item.status || "new",
    lastPracticeResult: item.last_practice_result || "",
    lastReviewDate: item.last_review_date || "",
  };
}

export default function PracticePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const studentId = readStudentSession()?.student?.id;
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refreshQuestion = async () => {
    if (!studentId || !id) return null;
    const item = await getWrongQuestion(id);
    if (String(item?.student?.id || "") !== String(studentId)) {
      throw new Error("无权访问这道错题");
    }
    const mapped = mapQuestion(item);
    setQuestion(mapped);
    return mapped;
  };

  useEffect(() => {
    if (!studentId || !id) return;
    refreshQuestion().catch((err) => setError(err?.message || "练习题加载失败"));
  }, [studentId, id]);

  const submitResult = async (result) => {
    if (!studentId || !question) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await createStudyRecord(question.id, {
        student_id: Number(studentId),
        result,
        mastery_level: result === "correct" ? 4 : 2,
        notes: answer || undefined,
      });
      const updated = await refreshQuestion();
      const statusText = STATUS_LABEL[updated?.status] || updated?.status || "-";
      setNotice(
        result === "correct"
          ? `已记录本次做对，当前状态：${statusText}`
          : result === "incorrect"
            ? `已记录本次做错，当前状态：${statusText}`
            : `已记录本次跳过，当前状态：${statusText}`,
      );
    } catch (err) {
      setError(err?.message || "练习记录提交失败");
    } finally {
      setLoading(false);
    }
  };

  if (!studentId) return <div className="workspace-alert error">请先登录后继续。</div>;
  if (error && !question) return <div className="workspace-alert error">{error}</div>;
  if (!question) return <div className="workspace-alert">正在加载练习题...</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-4">
      <div className="flex items-center justify-between pt-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500">
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">退出</span>
        </button>
        <div className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">真实练习</div>
      </div>

      <div className="pb-2 text-center">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">错题结果回填</h1>
        <p className="text-sm text-gray-500">
          针对 <span className="font-semibold text-indigo-600">{question.title}</span> 记录这次线下重做结果，便于继续筛题和打印下一轮练习
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
          <span>当前状态：{STATUS_LABEL[question.status] || question.status}</span>
          {question.lastReviewDate ? <span>· 最近回填：{question.lastReviewDate}</span> : null}
        </div>
      </div>

      {error ? <div className="workspace-alert error">{error}</div> : null}
      {notice ? <div className="workspace-alert ok">{notice}</div> : null}

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white">{question.subject}</span>
          <span className="text-xs text-gray-500">线下重做后回填结果</span>
        </div>

        {question.imageUrl ? (
          <div className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
            <img src={question.imageUrl} alt={question.imageName || question.title} className="max-h-[420px] w-full object-contain" />
          </div>
        ) : null}

        <div className="mb-6 whitespace-pre-line text-base leading-relaxed font-medium text-gray-900">{question.content}</div>

        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700">解答备注（可选）：</label>
          <textarea
            rows={8}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="可记录线下做题情况、错误点、老师批注..."
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          disabled={loading}
          onClick={() => submitResult("correct")}
          className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 font-semibold text-white shadow-lg transition-transform hover:bg-indigo-700 active:scale-95 disabled:bg-gray-400"
        >
          <CheckCircle2 className="h-5 w-5" />
          做对
        </button>
        <button
          disabled={loading}
          onClick={() => submitResult("incorrect")}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-rose-200 bg-white py-4 font-medium text-rose-600 transition-transform active:scale-95 disabled:opacity-50"
        >
          再错
        </button>
        <button
          disabled={loading}
          onClick={() => submitResult("skipped")}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 bg-white py-4 font-medium text-gray-600 transition-transform active:scale-95 disabled:opacity-50"
        >
          <SkipForward className="h-5 w-5" />
          跳过
        </button>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">这页不再是 mock 练习题，而是给线下重做之后回填结果用的真实入口。</p>
      </div>
    </div>
  );
}
