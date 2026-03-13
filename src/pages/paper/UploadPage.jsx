import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePaper } from "../../context/PaperContext.jsx";
import { extractQuestions } from "../../services/api.js";

const FLOW_STEPS = ["上传试题", "AI识别", "确认结果"];

function getStepIndex(hasFile, status) {
  if (status === "loading") return 1;
  if (status === "success") return 2;
  if (hasFile) return 0;
  return 0;
}

function getStatusCopy(status, hasFile) {
  if (status === "loading") {
    return "AI 正在切题、识别题干并生成错题候选，请稍等。";
  }
  if (status === "error") {
    return "本次识别失败，可直接更换图片重新提交。";
  }
  if (hasFile) {
    return "文件已就绪，确认无误后即可进入识别。";
  }
  return "先上传一张清晰试题图片，再进入识别流程。";
}

export default function UploadPage() {
  const navigate = useNavigate();
  const {
    file,
    setFile,
    previewUrl,
    setOcrItems,
    ocrStatus,
    setOcrStatus,
    ocrError,
    setOcrError,
    resetSession,
  } = usePaper();
  const [isDragging, setIsDragging] = useState(false);
  const recognizedItems = ocrItems.slice(0, 3);

  const stepIndex = getStepIndex(Boolean(file), ocrStatus);
  const statusCopy = getStatusCopy(ocrStatus, Boolean(file));
  const currentFileMeta = useMemo(() => {
    if (!file) return null;
    return {
      name: file.name,
      type: file.type || "image/*",
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
    };
  }, [file]);

  const updateFile = (selectedFile) => {
    if (!selectedFile || !selectedFile.type.startsWith("image/")) {
      return;
    }
    resetSession();
    setFile(selectedFile);
  };

  const handleFileChange = (event) => {
    updateFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    updateFile(event.dataTransfer.files?.[0]);
  };

  const handleExtract = async () => {
    if (!file) return;
    setOcrStatus("loading");
    setOcrError("");

    try {
      const data = await extractQuestions(file);
      setOcrItems(data.items ?? []);
      setOcrStatus("success");
    } catch (error) {
      setOcrStatus("error");
      setOcrError(error?.message || "识别失败，请重试");
    }
  };

  return (
    <div className="figma-page">
      <header className="figma-page-header">
        <div>
          <span className="figma-kicker">上传与识别</span>
          <h1>从一张试题开始，进入 Figma 原型里的三步识别流程。</h1>
          <p>{statusCopy}</p>
        </div>
        <div className="figma-header-actions">
          <Link className="figma-secondary-button" to="/">
            取消
          </Link>
          <button className="figma-primary-button" type="button" onClick={handleExtract} disabled={!file || ocrStatus === "loading"}>
            {ocrStatus === "loading" ? "识别中..." : "开始识别"}
          </button>
        </div>
      </header>

      <section className="figma-stepper">
        {FLOW_STEPS.map((step, index) => (
          <div key={step} className={`figma-step ${index < stepIndex ? "is-complete" : ""} ${index === stepIndex ? "is-current" : ""}`}>
            <div className="figma-step-index">{index < stepIndex ? "OK" : index + 1}</div>
            <span>{step}</span>
          </div>
        ))}
      </section>

      {(ocrError || ocrStatus === "loading") && (
        <div className={`workspace-alert ${ocrStatus === "error" ? "error" : ""}`}>
          {ocrStatus === "loading" ? "正在智能识别题目中..." : ocrError}
        </div>
      )}

      <section className="figma-upload-shell">
        <article className="figma-upload-main">
          <div
            className={`figma-upload-zone ${isDragging ? "dragging" : ""} ${previewUrl ? "has-file" : ""}`}
            onDrop={handleDrop}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
          >
            <input type="file" accept="image/*" id="file-upload" onChange={handleFileChange} hidden />

            {previewUrl ? (
              <div className="figma-preview-shell">
                <img src={previewUrl} alt="Preview" className="figma-preview-image" />
                <div className="figma-preview-footer">
                  <div className="figma-preview-meta">
                    <strong>{currentFileMeta?.name}</strong>
                    <span>
                      {currentFileMeta?.type} · {currentFileMeta?.size}
                    </span>
                  </div>
                  <label htmlFor="file-upload" className="figma-secondary-button small">
                    更换图片
                  </label>
                </div>
              </div>
            ) : (
              <label htmlFor="file-upload" className="figma-upload-label">
                <div className="figma-upload-icon">UP</div>
                <h3>点击或拖拽上传图片</h3>
                <p>支持 JPG、PNG、PDF。建议优先上传单页、无遮挡、边缘完整的题图。</p>
                <span className="figma-upload-hint">支持 JPG / PNG / PDF</span>
              </label>
            )}
          </div>
        </article>

        <aside className="figma-upload-side">
          {ocrStatus === "success" ? (
            <>
              <div className="figma-side-panel">
                <span className="figma-kicker">识别完成</span>
                <h2>AI 已提取 {ocrItems.length} 道题目。</h2>
                <p>先快速确认，再进入结果页继续生成变式题和导出。</p>
              </div>
              <div className="figma-result-preview-list">
                {recognizedItems.length ? (
                  recognizedItems.map((item, index) => (
                    <article key={item.id || index} className="figma-result-preview-card">
                      <strong>题目 {item.id || index + 1}</strong>
                      <p>{item.text || "已识别题干"}</p>
                    </article>
                  ))
                ) : (
                  <article className="figma-result-preview-card">
                    <strong>当前没有可确认的题目</strong>
                    <p>识别完成但没有提取到题干，可以重新上传或直接去结果页手动处理。</p>
                  </article>
                )}
              </div>
              <div className="figma-upload-actions">
                <button className="figma-primary-button" type="button" onClick={() => navigate("/result")}>
                  确认无误，进入结果页
                </button>
                <button className="figma-secondary-button" type="button" onClick={() => setOcrStatus("idle")}>
                  重新上传
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="figma-side-panel">
                <span className="figma-kicker">当前状态</span>
                <h2>{file ? "文件已准备" : "等待上传"}</h2>
                <p>{statusCopy}</p>
              </div>

              <div className="figma-side-panel">
                <span className="figma-kicker">识别建议</span>
                <ul className="figma-tip-list">
                  <li>优先上传单页、无遮挡、边缘完整的题图。</li>
                  <li>如果题目带图示，尽量保证图示区域清晰可见。</li>
                  <li>识别完成后会在当前页先给你一轮确认，再进入结果页。</li>
                </ul>
              </div>

              <div className="figma-upload-actions">
                <button className="figma-primary-button" type="button" onClick={handleExtract} disabled={!file || ocrStatus === "loading"}>
                  {ocrStatus === "loading" ? "识别中..." : "开始识别"}
                </button>
                <Link className="figma-secondary-button" to="/result">
                  查看上次结果
                </Link>
              </div>
            </>
          )}
        </aside>
      </section>

      <LoadingOverlay />
    </div>
  );
}

function LoadingOverlay() {
  const { ocrStatus } = usePaper();
  if (ocrStatus !== "loading") return null;

  return (
    <div className="loading-overlay">
      <div className="spinner"></div>
      <p>正在智能识别题目中...</p>
    </div>
  );
}
