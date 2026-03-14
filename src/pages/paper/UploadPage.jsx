import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Camera, CheckCircle2, Sparkles } from "lucide-react";
import { MOCK_QUESTIONS } from "../../data/figmaMock.js";

export default function UploadPage() {
  const [currentStep, setCurrentStep] = useState("upload");
  const navigate = useNavigate();
  const recognizedQuestions = MOCK_QUESTIONS.slice(0, 2);

  const handleUpload = () => {
    setCurrentStep("processing");
    window.setTimeout(() => {
      setCurrentStep("result");
    }, 2500);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-gray-900">录入错题</h1>
        <button onClick={() => navigate("/")} className="text-sm font-medium text-gray-500">
          取消
        </button>
      </div>

      <div className="flex min-h-[500px] flex-col justify-center rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <AnimatePresence mode="wait">
          {currentStep === "upload" ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-center"
            >
              <div
                onClick={handleUpload}
                className="flex w-full cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-gray-300 p-12 transition-all hover:border-indigo-400 hover:bg-indigo-50/30"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
                  <Camera className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">拍照或上传试题</h3>
                <p className="mb-6 text-sm text-gray-500">支持 JPG、PNG 格式</p>
                <button className="rounded-2xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition-transform hover:bg-indigo-700 active:scale-95">
                  选择图片
                </button>
              </div>
            </motion.div>
          ) : null}

          {currentStep === "processing" ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-center"
            >
              <div className="relative mb-6 h-20 w-20">
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">AI 识别中...</h3>
              <p className="animate-pulse text-sm text-gray-500">正在分析题目和错因</p>
            </motion.div>
          ) : null}

          {currentStep === "result" ? (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">识别成功</h3>
                </div>
                <span className="text-sm text-gray-500">{recognizedQuestions.length} 道题目</span>
              </div>

              <div className="max-h-[350px] space-y-3 overflow-y-auto">
                {recognizedQuestions.map((question, index) => (
                  <div key={question.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-3 flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                        {index + 1}
                      </div>
                      <p className="flex-1 text-sm leading-relaxed font-medium text-gray-900">
                        {question.originalText}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pl-9 text-xs">
                      <span className="rounded border border-gray-200 bg-white px-2 py-1 text-gray-600">
                        {question.subject}
                      </span>
                      <span className="rounded border border-gray-200 bg-white px-2 py-1 text-gray-600">
                        {question.topic}
                      </span>
                      <span className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-rose-600">
                        {question.errorReason}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate("/bank")}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 font-semibold text-white shadow-lg transition-transform hover:bg-indigo-700 active:scale-95"
              >
                <CheckCircle2 className="h-5 w-5" />
                存入错题本
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
