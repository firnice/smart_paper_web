import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera, ImagePlus, Sparkles, CheckCircle2,
  ChevronDown, ChevronUp, Pencil, X,
  FileImage, Layers, Crop, Loader2, ShapesIcon, CalendarDays,
} from "lucide-react";
import { useUser } from "../../context/UserContext.jsx";

// ---- Mock 数据（LLM 识别结果，含 has_diagram 字段）----
const MOCK_MULTI_RESULT = [
  {
    id: 1,
    text: "已知抛物线 y = x^2 - 4x + 3，求其在闭区间 [0, 5] 上的最大值和最小值。",
    subject: "数学",
    topic: "二次函数求最值",
    errorReason: "未考虑对称轴在区间内",
    has_diagram: false,
    svg: null,
  },
  {
    id: 2,
    text: "如图，质量为m的物体在倾角为θ的粗糙斜面上匀速下滑，求动摩擦因数μ。",
    subject: "物理",
    topic: "牛顿第二定律应用",
    errorReason: "受力分析遗漏支持力分量",
    has_diagram: true,  // LLM 判断含图
    svg: null,
  },
  {
    id: 3,
    text: "如图所示，在△ABC中，已知AB=5，AC=4，BC=3，求sinA的值。",
    subject: "数学",
    topic: "正弦定理",
    errorReason: "未建立正确的边角关系",
    has_diagram: true,  // LLM 判断含图
    svg: null,
  },
  {
    id: 4,
    text: "化简：sin(π/2 + α)cos(π - α) + cos(π/2 - α)sin(-α)",
    subject: "数学",
    topic: "三角函数诱导公式",
    errorReason: "符号判断错误",
    has_diagram: false,
    svg: null,
  },
];

const MOCK_SINGLE_RESULT = [
  {
    id: 1,
    text: "If I (know) you were coming, I would have baked a cake.",
    subject: "英语",
    topic: "虚拟语气",
    errorReason: "时态倒退混淆",
    has_diagram: false,
    svg: null,
  },
];

// Mock SVG 生成结果
const MOCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
  <line x1="20" y1="140" x2="180" y2="140" stroke="#333" stroke-width="2"/>
  <line x1="20" y1="140" x2="100" y2="40" stroke="#333" stroke-width="2"/>
  <line x1="100" y1="40" x2="180" y2="140" stroke="#333" stroke-width="2"/>
  <text x="8" y="145" font-size="13" fill="#333">A</text>
  <text x="178" y="155" font-size="13" fill="#333">B</text>
  <text x="96" y="32" font-size="13" fill="#333">C</text>
  <text x="90" y="148" font-size="11" fill="#666">5</text>
  <text x="50" y="95" font-size="11" fill="#666">4</text>
  <text x="145" y="95" font-size="11" fill="#666">3</text>
  <path d="M30 140 Q35 132 42 136" fill="none" stroke="#e55" stroke-width="1.5"/>
  <text x="38" y="132" font-size="10" fill="#e55">θ</text>
</svg>`;

const SUBJECTS = ["数学", "物理", "英语", "化学", "生物", "历史", "政治", "地理"];

const SUBJECT_COLOR = {
  数学: "bg-indigo-100 text-indigo-700 border-indigo-200",
  物理: "bg-purple-100 text-purple-700 border-purple-200",
  英语: "bg-emerald-100 text-emerald-700 border-emerald-200",
  化学: "bg-orange-100 text-orange-700 border-orange-200",
  生物: "bg-green-100 text-green-700 border-green-200",
  历史: "bg-yellow-100 text-yellow-700 border-yellow-200",
  政治: "bg-red-100 text-red-700 border-red-200",
  地理: "bg-teal-100 text-teal-700 border-teal-200",
};

// ---- 图形框选组件 ----
// 在原图上拖拽框选，返回选中区域的 dataURL
function DiagramSelector({ imageUrl, onConfirm, onCancel }) {
  const containerRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState(null);
  const [rect, setRect] = useState(null);

  const getRelativePos = (e) => {
    const el = containerRef.current;
    if (!el) return { x: 0, y: 0 };
    const bounds = el.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(0, Math.min(clientX - bounds.left, bounds.width)),
      y: Math.max(0, Math.min(clientY - bounds.top, bounds.height)),
    };
  };

  const onMouseDown = (e) => {
    e.preventDefault();
    const pos = getRelativePos(e);
    setStart(pos);
    setRect(null);
    setDragging(true);
  };

  const onMouseMove = useCallback((e) => {
    if (!dragging || !start) return;
    const pos = getRelativePos(e);
    setRect({
      x: Math.min(start.x, pos.x),
      y: Math.min(start.y, pos.y),
      w: Math.abs(pos.x - start.x),
      h: Math.abs(pos.y - start.y),
    });
  }, [dragging, start]);

  const onMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handleConfirm = () => {
    if (!rect || rect.w < 10 || rect.h < 10) return;
    // 用 canvas 裁切图片
    const img = containerRef.current?.querySelector("img");
    if (!img) return;
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;
    const canvas = document.createElement("canvas");
    canvas.width = rect.w * scaleX;
    canvas.height = rect.h * scaleY;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      img,
      rect.x * scaleX, rect.y * scaleY,
      rect.w * scaleX, rect.h * scaleY,
      0, 0, canvas.width, canvas.height,
    );
    onConfirm(canvas.toDataURL("image/png"));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white overflow-hidden shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <div>
            <h3 className="font-semibold text-gray-900">框选图形区域</h3>
            <p className="text-xs text-gray-500 mt-0.5">在图片上拖拽选择含图形的区域，AI 将生成 SVG</p>
          </div>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 图片区域 */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div
            ref={containerRef}
            className="relative inline-block cursor-crosshair select-none"
            style={{ userSelect: "none" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            <img
              src={imageUrl}
              alt="试卷"
              className="block max-w-full rounded-lg"
              draggable={false}
            />
            {/* 选区蒙版 */}
            {rect && rect.w > 4 && rect.h > 4 && (
              <div
                className="absolute border-2 border-indigo-500 bg-indigo-400/10"
                style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, pointerEvents: "none" }}
              >
                <div className="absolute -top-5 left-0 rounded bg-indigo-600 px-1.5 py-0.5 text-xs text-white whitespace-nowrap">
                  {Math.round(rect.w)} × {Math.round(rect.h)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <p className="text-xs text-gray-400">
            {rect && rect.w > 4 ? `已选区域：${Math.round(rect.w)} × ${Math.round(rect.h)} px` : "请在图片上拖拽框选"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={!rect || rect.w < 10 || rect.h < 10}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
            >
              <ShapesIcon className="h-4 w-4" />
              识别为 SVG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- 题目卡片 ----
function QuestionCard({ item, index, removable, originalImageUrl, onRemove, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [generatingSvg, setGeneratingSvg] = useState(false);
  const subjectStyle = SUBJECT_COLOR[item.subject] || "bg-gray-100 text-gray-600 border-gray-200";

  const handleDiagramCrop = (croppedDataUrl) => {
    setShowSelector(false);
    setGeneratingSvg(true);
    // Mock：模拟图形模型识别延迟，返回 SVG
    setTimeout(() => {
      onChange({ ...item, svg: MOCK_SVG, _croppedImage: croppedDataUrl });
      setGeneratingSvg(false);
    }, 1800);
  };

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-start gap-3 p-4">
          {/* 序号 */}
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 mt-0.5">
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 leading-relaxed mb-3">{item.text}</p>

            {/* SVG 预览 */}
            {item.svg && (
              <div className="mb-3 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-2.5">
                <div
                  className="rounded-lg border border-emerald-200 bg-white p-1 overflow-hidden"
                  style={{ maxWidth: 120 }}
                  dangerouslySetInnerHTML={{ __html: item.svg }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <ShapesIcon className="h-3 w-3 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">SVG 已生成</span>
                  </div>
                  <button
                    onClick={() => setShowSelector(true)}
                    className="text-xs text-emerald-600 underline hover:text-emerald-800"
                  >
                    重新框选
                  </button>
                </div>
              </div>
            )}

            {/* 标签行 */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${subjectStyle}`}>
                {item.subject}
              </span>
              <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
                {item.topic}
              </span>
              <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">
                {item.errorReason}
              </span>

              {/* 含图标记 */}
              {item.has_diagram && !item.svg && (
                <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                  含图形
                </span>
              )}

              <div className="ml-auto flex items-center gap-2">
                {/* 识别图形按钮 */}
                {item.has_diagram && (
                  <button
                    onClick={() => setShowSelector(true)}
                    disabled={generatingSvg || !originalImageUrl}
                    className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 transition-colors"
                  >
                    {generatingSvg ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        识别中...
                      </>
                    ) : (
                      <>
                        <Crop className="h-3 w-3" />
                        {item.svg ? "重新识别图形" : "识别图形"}
                      </>
                    )}
                  </button>
                )}

                {/* 编辑 */}
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  修改
                  {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>

                {/* 删除 */}
                {removable && (
                  <button onClick={onRemove} className="text-gray-300 hover:text-red-400 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 展开编辑区 */}
        {expanded && (
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-14 shrink-0 text-xs text-gray-500">学科</span>
              <div className="flex flex-wrap gap-1.5">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => onChange({ ...item, subject: s })}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                      item.subject === s
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-14 shrink-0 text-xs text-gray-500">知识点</span>
              <input
                value={item.topic}
                onChange={(e) => onChange({ ...item, topic: e.target.value })}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="w-14 shrink-0 text-xs text-gray-500">错误原因</span>
              <input
                value={item.errorReason}
                onChange={(e) => onChange({ ...item, errorReason: e.target.value })}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="w-14 shrink-0 text-xs text-gray-500">含图形</span>
              <button
                onClick={() => onChange({ ...item, has_diagram: !item.has_diagram, svg: null })}
                className={`relative h-5 w-10 rounded-full transition-colors ${item.has_diagram ? "bg-indigo-600" : "bg-gray-300"}`}
              >
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${item.has_diagram ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
              <span className="text-xs text-gray-400">{item.has_diagram ? "是（需识别图形）" : "否"}</span>
            </div>
          </div>
        )}
      </div>

      {/* 图形框选弹窗 */}
      {showSelector && originalImageUrl && (
        <DiagramSelector
          imageUrl={originalImageUrl}
          onConfirm={handleDiagramCrop}
          onCancel={() => setShowSelector(false)}
        />
      )}
    </>
  );
}

// ---- 主页面 ----
export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { currentTerm, termList } = useUser();

  const [step, setStep] = useState("upload"); // upload | processing | review | done
  const [mode, setMode] = useState("multi");  // multi | single
  const [originalImageUrl, setOriginalImageUrl] = useState("");
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  // 本次录入的学期（默认当前学期，可单独修改）
  const [batchTerm, setBatchTerm] = useState(currentTerm);
  const [termOpen, setTermOpen] = useState(false);

  const handleFileSelect = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setOriginalImageUrl(url);
    setBatchTerm(currentTerm); // 重置为当前学期
    setStep("processing");
    // Mock LLM 识别
    setTimeout(() => {
      const result = mode === "single"
        ? MOCK_SINGLE_RESULT.map((q) => ({ ...q }))
        : MOCK_MULTI_RESULT.map((q) => ({ ...q }));
      setQuestions(result);
      setStep("review");
    }, 2000);
  };

  const handleSave = () => {
    setSaving(true);
    const count = questions.length;
    setTimeout(() => {
      setSaving(false);
      setSavedCount(count);
      setStep("done");
    }, 1000);
  };

  const reset = () => {
    setStep("upload");
    setOriginalImageUrl("");
    setQuestions([]);
    setSavedCount(0);
  };

  const updateQuestion = (index, updated) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? updated : q)));
  };

  const removeQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // 待处理图形的题目数
  const pendingDiagramCount = questions.filter((q) => q.has_diagram && !q.svg).length;

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-8">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">录入错题</h1>
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <X className="h-4 w-4" />
          取消
        </button>
      </div>

      {/* Step 1: 上传 */}
      {step === "upload" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "multi", icon: Layers, label: "整页试卷", desc: "AI 自动识别多道题" },
              { id: "single", icon: FileImage, label: "单题截图", desc: "一张图一道题，快速录入" },
            ].map(({ id, icon: Icon, label, desc }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                  mode === id ? "border-indigo-600 bg-indigo-50" : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <Icon className={`h-6 w-6 ${mode === id ? "text-indigo-600" : "text-gray-400"}`} />
                <div>
                  <div className={`text-sm font-semibold ${mode === id ? "text-indigo-700" : "text-gray-700"}`}>{label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
                </div>
              </button>
            ))}
          </div>

          <div
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white p-14 text-center hover:border-indigo-400 hover:bg-indigo-50/20 transition-all cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files?.[0]); }}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
              {mode === "single" ? <FileImage className="h-7 w-7 text-indigo-500" /> : <Layers className="h-7 w-7 text-indigo-500" />}
            </div>
            <h3 className="mb-1 text-base font-semibold text-gray-900">
              {mode === "single" ? "上传单题截图" : "上传整页试卷"}
            </h3>
            <p className="mb-5 text-sm text-gray-400">支持 JPG、PNG，拖拽或点击选择</p>
            <div className="flex gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                <ImagePlus className="h-4 w-4" />选择图片
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Camera className="h-4 w-4" />拍照上传
              </button>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0])} />
        </div>
      )}

      {/* Step 2: 识别中 */}
      {step === "processing" && (
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
          {originalImageUrl && (
            <img src={originalImageUrl} alt="试卷" className="w-full max-h-52 object-contain bg-gray-50" />
          )}
          <div className="flex flex-col items-center py-10 text-center">
            <div className="relative mb-5 h-12 w-12">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
              <Sparkles className="absolute inset-0 m-auto h-4 w-4 text-indigo-400" />
            </div>
            <h3 className="mb-1 text-base font-semibold text-gray-900">LLM 正在识别...</h3>
            <p className="text-sm text-gray-400 animate-pulse">识别题目文本、学科、知识点、错误原因、是否含图</p>
          </div>
        </div>
      )}

      {/* Step 3: 审核 */}
      {step === "review" && (
        <div className="space-y-4">
          {/* 原图缩略 */}
          {originalImageUrl && (
            <div className="relative overflow-hidden rounded-xl border border-gray-100">
              <img src={originalImageUrl} alt="试卷" className="w-full max-h-36 object-contain bg-gray-50" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            </div>
          )}

          {/* 识别结果标题 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span className="font-semibold text-gray-900">识别完成</span>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                {questions.length} 道题目
              </span>
              {pendingDiagramCount > 0 && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                  {pendingDiagramCount} 道含图形待识别
                </span>
              )}
            </div>
            <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600">重新上传</button>
          </div>

          {/* 学期选择 */}
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <CalendarDays className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-600">录入学期</span>
            <div className="relative ml-auto">
              <button
                onClick={() => setTermOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                {batchTerm}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${termOpen ? "rotate-180" : ""}`} />
              </button>
              {termOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  {termList.map((term) => (
                    <button
                      key={term}
                      onClick={() => { setBatchTerm(term); setTermOpen(false); }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-indigo-50 ${
                        term === batchTerm ? "bg-indigo-50 font-semibold text-indigo-600" : "text-gray-700"
                      }`}
                    >
                      {term}
                      {term === batchTerm && <span className="text-indigo-400">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400 ml-1">所有题目将归入此学期</span>
          </div>

          {/* 提示：含图形的题需要框选 */}
          {pendingDiagramCount > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
              <ShapesIcon className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                AI 检测到 <strong>{pendingDiagramCount} 道题含有图形</strong>，点击题目卡片上的「识别图形」按钮，
                在原图上框选图形区域，图形模型将自动生成 SVG。也可以跳过，稍后补充。
              </p>
            </div>
          )}

          {/* 题目卡片 */}
          <div className="space-y-3">
            {questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                item={q}
                index={i}
                removable={questions.length > 1}
                originalImageUrl={originalImageUrl}
                onRemove={() => removeQuestion(i)}
                onChange={(updated) => updateQuestion(i, updated)}
              />
            ))}
          </div>

          <p className="text-xs text-center text-gray-400">
            可点击「修改」调整识别结果，含图形的题建议先完成图形识别再保存
          </p>

          {/* 保存按钮 */}
          <button
            onClick={handleSave}
            disabled={saving || questions.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" />正在保存...</>
            ) : (
              <><CheckCircle2 className="h-4 w-4" />存入错题本（{questions.length} 道）</>
            )}
          </button>
        </div>
      )}

      {/* Step 4: 完成 */}
      {step === "done" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mx-auto">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-gray-900">保存成功！</h3>
          <p className="mb-6 text-sm text-gray-500">已将 {savedCount} 道错题存入错题本</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate("/bank")} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
              查看错题本
            </button>
            <button onClick={reset} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              继续录入
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
