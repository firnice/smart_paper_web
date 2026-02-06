import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePaper } from "../../context/PaperContext.jsx";
import PaperView from "../../components/paper/PaperView.jsx";
import { generateVariants, createExport } from "../../services/api.js";

export default function ResultPage() {
  const navigate = useNavigate();
  const {
    ocrItems,
    selectedQuestionId,
    setSelectedQuestionId,
    variants,
    setVariants,
    variantStatus,
    setVariantStatus,
    setVariantError,
    exportStatus,
    setExportStatus,
    setExportData,
    setExportError,
    exportData
  } = usePaper();

  const [count, setCount] = useState(3);

  useEffect(() => {
    if (!ocrItems || ocrItems.length === 0) {
      navigate("/upload");
    }
  }, [ocrItems, navigate]);

  const selectedItem = ocrItems.find((item) => item.id === selectedQuestionId);

  const handleGenerate = async () => {
    if (!selectedItem) return;
    setVariantStatus("loading");
    setVariantError("");
    setExportStatus("idle");
    try {
      const data = await generateVariants({
        source_text: selectedItem.text,
        count,
        grade: "小学", // Default for now
        subject: "math",
      });
      setVariants(data.items ?? []);
      setVariantStatus("success");
    } catch (error) {
      setVariantStatus("error");
      setVariantError(error?.message || "生成失败");
    }
  };

  const handleExport = async () => {
    if (!selectedItem || variants.length === 0) return;

    setExportStatus("loading");
    setExportError("");
    try {
      const data = await createExport({
        title: `举一反三-${selectedItem.id}`,
        original_text: selectedItem.text,
        variants,
        include_images: true,
      });
      setExportData(data);
      setExportStatus("success");
    } catch (error) {
      setExportStatus("error");
      setExportError(error?.message || "导出失败");
    }
  };

  return (
    <div className="result-page">
      <div className="result-sidebar">
        <div className="sidebar-section">
          <h3>操作面板</h3>
          <p className="hint">点击左侧题目进行操作</p>
          {selectedItem ? (
            <div className="selected-info">
              <h4>已选题目 {selectedItem.id}</h4>
              <div className="control-group">
                <label>生成数量: {count}</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                />
              </div>

              <button
                className="btn-primary full-width"
                onClick={handleGenerate}
                disabled={variantStatus === "loading"}
              >
                {variantStatus === "loading" ? "生成中..." : "生成变式题"}
              </button>

              {variants.length > 0 && (
                <div className="variants-preview">
                  <h5>生成的变式题:</h5>
                  <ul>
                    {variants.map((variant, index) => (
                      <li key={index}>{variant.slice(0, 50)}...</li>
                    ))}
                  </ul>
                  <button
                    className="btn-secondary full-width"
                    onClick={handleExport}
                    disabled={exportStatus === "loading"}
                  >
                    {exportStatus === "loading" ? "导出中..." : "导出错题本(PDF)"}
                  </button>
                </div>
              )}

              {exportData?.download_url && (
                <div className="download-box">
                  <a
                    href={exportData.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-download"
                  >
                    下载 PDF
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-selection">
              请在左侧试卷中点击选择一道题目以开始。
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <button className="btn-ghost" onClick={() => navigate("/upload")}>
            重新上传
          </button>
        </div>
      </div>

      <div className="result-main">
        <div className="toolbar">
          <h2>试卷预览</h2>
          <button onClick={() => window.print()} className="btn-icon">🖨️ 打印/保存</button>
        </div>
        <div className="paper-scroll-area">
          <PaperView
            items={ocrItems}
            selectedId={selectedQuestionId}
            onSelect={setSelectedQuestionId}
          />
        </div>
      </div>
    </div>
  );
}
