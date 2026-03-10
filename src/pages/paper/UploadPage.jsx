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
      navigate("/result");
    } catch (error) {
      setOcrStatus("error");
      setOcrError(error?.message || "识别失败，请重试");
    }
  };

  return (
    <div className="page upload-flow-page">
      <header className="hero upload-flow-hero">
        <div className="hero-tag">上传与识别</div>
        <h1>从一张试题开始，进入 AI 错题处理流程</h1>
        <p>{statusCopy}</p>
        <div className="hero-actions">
          <Link className="btn-ghost" to="/">
            回工作台
          </Link>
          <button className="btn-primary" type="button" onClick={handleExtract} disabled={!file || ocrStatus === "loading"}>
            {ocrStatus === "loading" ? "识别中..." : "开始识别"}
          </button>
        </div>
      </header>

      <section className="upload-stepper">
        {FLOW_STEPS.map((step, index) => {
          const stateClass =
            index < stepIndex ? "is-complete" : index === stepIndex ? "is-current" : "";

          return (
            <div key={step} className={`upload-step ${stateClass}`}>
              <div className="upload-step-index">{index < stepIndex ? "✓" : index + 1}</div>
              <div className="upload-step-copy">
                <strong>{step}</strong>
                <span>{index === 0 ? "选择题图" : index === 1 ? "等待分析" : "进入结果页"}</span>
              </div>
            </div>
          );
        })}
      </section>

      {(ocrError || ocrStatus === "loading") && (
        <div className={`workspace-alert ${ocrStatus === "error" ? "error" : ""}`}>
          {ocrStatus === "loading" ? "正在智能识别题目中..." : ocrError}
        </div>
      )}

      <section className="upload-flow-grid">
        <article className="upload-flow-card primary">
          <div
            className={`upload-zone ${isDragging ? "dragging" : ""} ${previewUrl ? "has-file" : ""}`}
            onDrop={handleDrop}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
          >
            <input type="file" accept="image/*" id="file-upload" onChange={handleFileChange} hidden />

            {previewUrl ? (
              <div className="preview-container">
                <img src={previewUrl} alt="Preview" className="preview-image" />
                <div className="upload-preview-footer">
                  <div className="upload-preview-meta">
                    <strong>{currentFileMeta?.name}</strong>
                    <span>
                      {currentFileMeta?.type} · {currentFileMeta?.size}
                    </span>
                  </div>
                  <label htmlFor="file-upload" className="btn-secondary change-btn">
                    更换图片
                  </label>
                </div>
              </div>
            ) : (
              <label htmlFor="file-upload" className="upload-label">
                <div className="upload-icon">UP</div>
                <h3>点击或拖拽上传图片</h3>
                <p>当前 Demo 以清晰图片识别为主，适合手机拍照或导出的题页截图。</p>
                <span className="upload-hint-chip">支持 JPG / PNG</span>
              </label>
            )}
          </div>
        </article>

        <aside className="upload-flow-card side">
          <div className="upload-side-block">
            <span className="card-kicker">当前状态</span>
            <h2>{file ? "文件已准备" : "等待上传"}</h2>
            <p>{statusCopy}</p>
          </div>

          <div className="upload-side-block">
            <span className="card-kicker">识别建议</span>
            <ul className="upload-tip-list">
              <li>优先上传单页、无遮挡、边缘完整的题图。</li>
              <li>如果题目带图示，尽量保证图示区域清晰可见。</li>
              <li>识别完成后会进入结果页继续生成变式题和 PDF。</li>
            </ul>
          </div>

          <div className="upload-side-actions">
            <button className="btn-primary full-width" type="button" onClick={handleExtract} disabled={!file || ocrStatus === "loading"}>
              {ocrStatus === "loading" ? "识别中..." : "开始识别"}
            </button>
            <Link className="btn-ghost full-width" to="/result">
              查看上次结果
            </Link>
          </div>
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
