import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePaper } from "../../context/PaperContext.jsx";
import PaperView from "../../components/paper/PaperView.jsx";
import { createExport, generateVariants } from "../../services/api.js";

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
    exportData,
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
        grade: "小学",
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
    <div className="page result-flow-page">
      <header className="hero result-hero">
        <div className="hero-tag">识别结果</div>
        <h1>确认题目、生成变式题，并导出当前错题练习包</h1>
        <p>
          {selectedItem
            ? `当前已选第 ${selectedItem.id} 题，可直接生成 ${count} 道变式题并导出 PDF。`
            : "先在右侧试卷预览中点击一道题，再开始生成变式题。"}
        </p>
        <div className="hero-actions">
          <Link className="btn-ghost" to="/upload">
            重新上传
          </Link>
          <button className="btn-primary" type="button" onClick={handleGenerate} disabled={!selectedItem || variantStatus === "loading"}>
            {variantStatus === "loading" ? "生成中..." : "生成变式题"}
          </button>
        </div>
      </header>

      <div className="result-page">
        <aside className="result-sidebar">
          <div className="sidebar-section">
            <div className="result-side-head">
              <h3>操作面板</h3>
              <span>{ocrItems.length} 道题已识别</span>
            </div>
            <p className="hint">点击右侧题目进行操作，生成的变式题会展示在此处。</p>

            {selectedItem ? (
              <div className="selected-info">
                <h4>已选题目 {selectedItem.id}</h4>
                <p className="result-selected-text">{selectedItem.text}</p>

                <div className="control-group">
                  <label htmlFor="variant-count">生成数量: {count}</label>
                  <input
                    id="variant-count"
                    type="range"
                    min="1"
                    max="5"
                    value={count}
                    onChange={(event) => setCount(Number(event.target.value))}
                  />
                </div>

                <div className="result-actions">
                  <button className="btn-primary full-width" onClick={handleGenerate} disabled={variantStatus === "loading"}>
                    {variantStatus === "loading" ? "生成中..." : "生成变式题"}
                  </button>
                  <button
                    className="btn-secondary full-width"
                    onClick={handleExport}
                    disabled={exportStatus === "loading" || variants.length === 0}
                  >
                    {exportStatus === "loading" ? "导出中..." : "导出错题本 PDF"}
                  </button>
                </div>

                {variants.length > 0 && (
                  <div className="variants-preview">
                    <h5>生成的变式题</h5>
                    <ul>
                      {variants.map((variant, index) => (
                        <li key={`${index}-${variant}`}>{variant}</li>
                      ))}
                    </ul>
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
              <div className="empty-selection">请先在右侧试卷中点击选择一道题目以开始。</div>
            )}
          </div>

          <div className="sidebar-footer">
            <button className="btn-ghost full-width" onClick={() => window.print()}>
              打印 / 保存当前试卷
            </button>
          </div>
        </aside>

        <div className="result-main">
          <div className="toolbar">
            <h2>试卷预览</h2>
            <div className="result-toolbar-actions">
              <Link className="btn-ghost btn-small" to="/student/dashboard">
                去错题本
              </Link>
              <button onClick={() => window.print()} className="btn-secondary btn-small">
                打印 / 保存
              </button>
            </div>
          </div>
          <div className="paper-scroll-area">
            <PaperView items={ocrItems} selectedId={selectedQuestionId} onSelect={setSelectedQuestionId} />
          </div>
        </div>
      </div>
    </div>
  );
}
