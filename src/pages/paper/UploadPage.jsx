import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePaper } from "../../context/PaperContext.jsx";
import { extractQuestions } from "../../services/api.js";

export default function UploadPage() {
  const navigate = useNavigate();
  const { 
    file, 
    setFile, 
    previewUrl, 
    setOcrItems, 
    setOcrStatus, 
    setOcrError, 
    resetSession 
  } = usePaper();
  
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      resetSession();
      setFile(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      resetSession();
      setFile(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleExtract = async () => {
    if (!file) return;
    setOcrStatus("loading");
    setOcrError("");
    
    try {
      const data = await extractQuestions(file);
      const items = data.items ?? [];
      setOcrItems(items);
      setOcrStatus("success");
      navigate("/result");
    } catch (error) {
      setOcrStatus("error");
      setOcrError(error?.message || "识别失败，请重试");
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>上传试卷</h1>
        <p>拍照或上传试卷图片，自动提取题目</p>
      </header>

      <main className="upload-main">
        <div 
          className={`upload-zone ${isDragging ? "dragging" : ""} ${previewUrl ? "has-file" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input 
            type="file" 
            accept="image/*" 
            id="file-upload" 
            onChange={handleFileChange} 
            hidden 
          />
          
          {previewUrl ? (
            <div className="preview-container">
              <img src={previewUrl} alt="Preview" className="preview-image" />
              <label htmlFor="file-upload" className="btn-secondary change-btn">
                更换图片
              </label>
            </div>
          ) : (
            <label htmlFor="file-upload" className="upload-label">
              <div className="upload-icon">📁</div>
              <h3>点击或拖拽上传图片</h3>
              <p>支持 JPG, PNG 格式</p>
            </label>
          )}
        </div>

        {file && (
          <div className="actions-area">
            <button className="btn-primary btn-large" onClick={handleExtract} disabled={!file}>
              开始识别
            </button>
          </div>
        )}
      </main>

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
