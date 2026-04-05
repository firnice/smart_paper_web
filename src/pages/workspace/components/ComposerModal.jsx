import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Crop,
  Loader2,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Save,
  Scan,
  Upload,
  X,
} from "lucide-react";
import useEscapeKey from "../../../hooks/useEscapeKey.js";
import InteractiveCropBox from "./composer/InteractiveCropBox.jsx";
import ComposerQuestionCard from "./composer/ComposerQuestionCard.jsx";
import SvgCropDialog from "./composer/SvgCropDialog.jsx";

function StepIndicator({ step }) {
  return (
    <div className="ml-4 flex items-center gap-1.5">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            item === step
              ? "w-6 bg-blue-600"
              : item < step
                ? "w-2 bg-blue-200"
                : "w-2 bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function ComposerModal({ composer }) {
  const [isDragActive, setIsDragActive] = useState(false);

  const {
    uploadInputRef,
    isComposerOpen,
    step,
    sourceImage,
    paperCrop,
    setPaperCrop,
    isRotatingPaper,
    isRecognizing,
    recognizeError,
    lastRecognitionMode,
    recognitionPrompt,
    questions,
    expandedPaperId,
    expandedPromptId,
    activeSvgQuestion,
    saveState,
    selectedCount,
    allSelectedState,
    subjectChoices,
    errorTypeChoices,
    reasonSuggestions,
    gradeChoices,
    onCloseComposer,
    onTriggerUpload,
    onUseFile,
    onPickUpload,
    onRecognize,
    setRecognitionPrompt,
    onRotatePaper,
    onToggleSelect,
    onToggleAll,
    onChangeQuestionField,
    onTogglePaper,
    onTogglePrompt,
    onOpenSvgCrop,
    onCloseSvgCrop,
    onChangeSvgCrop,
    onConfirmSvgCrop,
    onDeleteSvg,
    onGenerateSvg,
    onBackStep,
    onDismissRecognizeError,
    onDismissSaveError,
    persistSelectedQuestions,
  } = composer;

  const title = useMemo(() => {
    if (step === 1) return "录入试卷";
    if (step === 2) return "框选题目";
    return "确认并保存";
  }, [step]);

  useEscapeKey(isComposerOpen, onCloseComposer);

  if (!isComposerOpen) return null;

  const canShowBack = step > 1 && !isRecognizing && !recognizeError && saveState.status === "idle";

  return (
    <>
      <div className="student-modal-backdrop" onClick={onCloseComposer}>
        <div
          className="mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.25)]"
          style={{ maxHeight: "88vh" }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
              <StepIndicator step={step} />
            </div>
            <button
              type="button"
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              onClick={onCloseComposer}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex flex-1 flex-col overflow-hidden">
            {isRecognizing || isRotatingPaper ? (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm">
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-600" />
                <p className="text-lg font-medium text-gray-800">
                  {isRotatingPaper ? "正在旋转试卷..." : "正在识别题目内容..."}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  {isRotatingPaper ? "每次旋转 90 度，完成后会保持新的方向继续框选" : "包含公式和图形的识别可能需要几秒钟"}
                </p>
              </div>
            ) : null}

            {recognizeError ? (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <p className="text-lg font-medium text-gray-800">识别失败</p>
                <p className="mt-2 mb-6 text-sm text-gray-500">{recognizeError}</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onDismissRecognizeError}
                    className="rounded-lg bg-gray-100 px-5 py-2 font-medium text-gray-700 hover:bg-gray-200"
                  >
                    返回修改选区
                  </button>
                  <button
                    type="button"
                    onClick={() => onRecognize(lastRecognitionMode, { prompt: recognitionPrompt })}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
                  >
                    <RefreshCw className="h-4 w-4" />
                    重新识别
                  </button>
                </div>
              </div>
            ) : null}

            {saveState.status === "saving" ? (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm">
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-600" />
                <p className="text-lg font-medium text-gray-800">正在保存...</p>
                <p className="mt-2 text-sm text-gray-500">
                  正在处理 {saveState.total} 道题，已完成 {saveState.savedCount} 道
                </p>
              </div>
            ) : null}

            {saveState.status === "error" ? (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <p className="text-lg font-medium text-gray-800">保存失败</p>
                <p className="mt-2 mb-6 max-w-md text-center text-sm text-gray-500">{saveState.error}</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onDismissSaveError}
                    className="rounded-lg bg-gray-100 px-5 py-2 font-medium text-gray-700 hover:bg-gray-200"
                  >
                    返回检查
                  </button>
                  <button
                    type="button"
                    onClick={persistSelectedQuestions}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
                  >
                    <RefreshCw className="h-4 w-4" />
                    重新保存
                  </button>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-12">
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickUpload}
                />

                <div
                  role="button"
                  tabIndex={0}
                  className={`flex h-72 w-full max-w-2xl cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200 ${
                    isDragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 bg-white hover:bg-gray-50"
                  }`}
                  onClick={onTriggerUpload}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setIsDragActive(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragActive(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setIsDragActive(false);
                  }}
                  onDrop={async (event) => {
                    event.preventDefault();
                    setIsDragActive(false);
                    await onUseFile(event.dataTransfer.files?.[0]);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onTriggerUpload();
                    }
                  }}
                >
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm">
                    <Upload className="h-8 w-8" />
                  </div>
                  <h3 className="mb-2 text-xl font-medium text-gray-800">点击或拖拽上传试卷图片</h3>
                  <p className="text-sm text-gray-500">支持 JPG、PNG 格式</p>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="flex flex-1 flex-col p-6">
                <div className="relative flex flex-1 items-center justify-center overflow-auto rounded-xl bg-gray-900 p-4 shadow-inner select-none">
                  {sourceImage.data ? (
                    <div className="relative inline-block max-h-full">
                      <img
                        src={sourceImage.data}
                        alt={sourceImage.name || "Paper"}
                        className="block max-h-[62vh] max-w-full object-contain"
                      />
                      <InteractiveCropBox value={paperCrop} onChange={setPaperCrop} color="blue" />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="flex-1 overflow-y-auto bg-gray-50 p-5">
                <datalist id="composer-reason-options">
                  {reasonSuggestions.map((reason) => (
                    <option key={reason} value={reason} />
                  ))}
                </datalist>

                <div className="mb-4 flex items-center justify-between px-1">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm text-gray-600"
                    onClick={onToggleAll}
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                        allSelectedState === "all"
                          ? "border-blue-600 bg-blue-600"
                          : allSelectedState === "partial"
                            ? "border-blue-400 bg-blue-200"
                            : "border-gray-300 bg-white"
                      }`}
                    >
                      {allSelectedState === "all" ? (
                        <div className="h-2.5 w-2.5 rounded-sm bg-white" />
                      ) : null}
                      {allSelectedState === "partial" ? (
                        <div className="h-0.5 w-2 rounded bg-blue-600" />
                      ) : null}
                    </div>
                    <span>全选</span>
                  </button>

                  <span className="text-sm text-gray-500">
                    共识别 <span className="font-medium text-gray-800">{questions.length}</span> 道，已选{" "}
                    <span className="font-medium text-blue-600">{selectedCount}</span> 道
                  </span>
                </div>

                <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <label className="mb-2 block text-sm font-medium text-gray-700">识别 Prompt</label>
                  <textarea
                    rows={2}
                    value={recognitionPrompt}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm leading-relaxed text-gray-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    placeholder="输入识别 prompt"
                    onChange={(event) => setRecognitionPrompt(event.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  {questions.map((question) => (
                    <ComposerQuestionCard
                      key={question.id}
                      question={question}
                      paperImageUrl={sourceImage.data}
                      subjectOptions={subjectChoices}
                      gradeOptions={gradeChoices}
                      errorTypeOptions={errorTypeChoices}
                      isPaperExpanded={expandedPaperId === question.id}
                      isPromptExpanded={expandedPromptId === question.id}
                      onToggleSelect={onToggleSelect}
                      onChangeField={onChangeQuestionField}
                      onTogglePaper={onTogglePaper}
                      onOpenSvgCrop={onOpenSvgCrop}
                      onTogglePrompt={onTogglePrompt}
                      onGenerateSvg={onGenerateSvg}
                      onDeleteSvg={onDeleteSvg}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-shrink-0 items-center justify-between border-t border-gray-100 bg-white px-6 py-4">
            {canShowBack ? (
              <button
                type="button"
                onClick={onBackStep}
                className="flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-gray-600 transition-colors hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
                上一步
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {step === 2 && !isRecognizing && !recognizeError ? (
                <>
                  <button
                    type="button"
                    onClick={() => onRotatePaper("left")}
                    disabled={isRotatingPaper || isRecognizing}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RotateCcw className="h-4 w-4" />
                    左旋 90°
                  </button>
                  <button
                    type="button"
                    onClick={() => onRotatePaper("right")}
                    disabled={isRotatingPaper || isRecognizing}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RotateCw className="h-4 w-4" />
                    右旋 90°
                  </button>
                  <button
                    type="button"
                    onClick={() => onRecognize("full_page")}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    <Scan className="h-4 w-4" />
                    识别整页
                  </button>
                  <button
                    type="button"
                    onClick={() => onRecognize("selection")}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700"
                  >
                    <Crop className="h-4 w-4" />
                    识别选中区域
                  </button>
                </>
              ) : null}

              {step === 3 && saveState.status === "idle" ? (
                <>
                  <button
                    type="button"
                    onClick={() => onRecognize(lastRecognitionMode, { prompt: recognitionPrompt })}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    重新识别
                  </button>
                  <button
                    type="button"
                    disabled={selectedCount === 0}
                    onClick={persistSelectedQuestions}
                    className={`flex items-center gap-2 rounded-lg px-6 py-2.5 font-medium shadow-sm transition-colors ${
                      selectedCount > 0
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "cursor-not-allowed bg-gray-200 text-gray-400"
                    }`}
                  >
                    <Save className="h-4 w-4" />
                    {selectedCount > 0 ? `保存已选 ${selectedCount} 道题` : "请至少选择一道题"}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <SvgCropDialog
        question={activeSvgQuestion}
        imageSrc={sourceImage.data}
        onClose={onCloseSvgCrop}
        onConfirm={onConfirmSvgCrop}
        onChangeCrop={onChangeSvgCrop}
      />
    </>
  );
}
