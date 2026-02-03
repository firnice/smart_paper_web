import { useEffect, useMemo, useState } from "react";

import { createExport, extractQuestions, generateVariants } from "../services/api";

const emptyStatus = { status: "idle", items: [], error: "" };

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function clampBox(image, box) {
  const xmin = Math.max(0, Math.min(box.xmin, image.width - 1));
  const ymin = Math.max(0, Math.min(box.ymin, image.height - 1));
  const xmax = Math.max(xmin + 1, Math.min(box.xmax, image.width));
  const ymax = Math.max(ymin + 1, Math.min(box.ymax, image.height));
  return { xmin, ymin, xmax, ymax };
}

function cropImage(image, box) {
  const { xmin, ymin, xmax, ymax } = clampBox(image, box);
  const width = Math.max(1, xmax - xmin);
  const height = Math.max(1, ymax - ymin);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }
  ctx.drawImage(image, xmin, ymin, width, height, 0, 0, width, height);
  return canvas.toDataURL("image/png");
}

export default function DemoPanel() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [ocrState, setOcrState] = useState({ ...emptyStatus });
  const [selectedId, setSelectedId] = useState(null);
  const [variantsState, setVariantsState] = useState({ ...emptyStatus });
  const [exportState, setExportState] = useState({ status: "idle", data: null, error: "" });
  const [count, setCount] = useState(3);
  const [crops, setCrops] = useState({});

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!previewUrl || ocrState.items.length === 0) {
      setCrops({});
      return undefined;
    }
    let cancelled = false;
    const run = async () => {
      const image = await loadImage(previewUrl);
      const next = {};
      for (const item of ocrState.items) {
        if (item.has_image && item.image_box) {
          const cropped = cropImage(image, item.image_box);
          if (cropped) {
            next[item.id] = cropped;
          }
        }
      }
      if (!cancelled) {
        setCrops(next);
      }
    };
    run().catch(() => {
      if (!cancelled) {
        setCrops({});
      }
    });
    return () => {
      cancelled = true;
    };
  }, [previewUrl, ocrState.items]);

  const selectedItem = useMemo(
    () => ocrState.items.find((item) => item.id === selectedId),
    [ocrState.items, selectedId],
  );

  const resetFlow = () => {
    setOcrState({ ...emptyStatus });
    setVariantsState({ ...emptyStatus });
    setExportState({ status: "idle", data: null, error: "" });
    setSelectedId(null);
    setCrops({});
  };

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setFile(nextFile);
    resetFlow();
  };

  const handleExtract = async () => {
    if (!file) return;
    setOcrState({ status: "loading", items: [], error: "" });
    setVariantsState({ ...emptyStatus });
    setExportState({ status: "idle", data: null, error: "" });
    try {
      const data = await extractQuestions(file);
      const items = data.items ?? [];
      setOcrState({ status: "ok", items, error: "" });
      setSelectedId(items[0]?.id ?? null);
    } catch (error) {
      setOcrState({ status: "error", items: [], error: error?.message || "识别失败" });
    }
  };

  const handleGenerate = async () => {
    if (!selectedItem) return;
    setVariantsState({ status: "loading", items: [], error: "" });
    setExportState({ status: "idle", data: null, error: "" });
    try {
      const data = await generateVariants({
        source_text: selectedItem.text,
        count,
        grade: "小学",
        subject: "math",
      });
      setVariantsState({ status: "ok", items: data.items ?? [], error: "" });
    } catch (error) {
      setVariantsState({ status: "error", items: [], error: error?.message || "生成失败" });
    }
  };

  const handleExport = async () => {
    if (!selectedItem || variantsState.items.length === 0) return;
    setExportState({ status: "loading", data: null, error: "" });
    try {
      const data = await createExport({
        title: `举一反三-${selectedItem.id}`,
        original_text: selectedItem.text,
        variants: variantsState.items,
        include_images: true,
      });
      setExportState({ status: "ok", data, error: "" });
    } catch (error) {
      setExportState({ status: "error", data: null, error: error?.message || "导出失败" });
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedId(itemId);
    setVariantsState({ ...emptyStatus });
    setExportState({ status: "idle", data: null, error: "" });
  };

  const ocrMessage = (() => {
    if (ocrState.status === "loading") return "识别中...";
    if (ocrState.status === "error") return ocrState.error || "识别失败";
    if (ocrState.status === "ok") return `识别完成，已提取 ${ocrState.items.length} 题`;
    return "等待识别";
  })();

  const variantMessage = (() => {
    if (variantsState.status === "loading") return "生成中...";
    if (variantsState.status === "error") return variantsState.error || "生成失败";
    if (variantsState.status === "ok") return `已生成 ${variantsState.items.length} 道变式题`;
    return "等待生成";
  })();

  const exportMessage = (() => {
    if (exportState.status === "loading") return "导出中...";
    if (exportState.status === "error") return exportState.error || "导出失败";
    if (exportState.status === "ok") return "导出任务已创建";
    return "等待导出";
  })();

  return (
    <section className="section" id="demo">
      <div className="section-head">
        <h2>功能演示</h2>
        <p>快速验证上传、题干提取、同类题生成与导出流程。</p>
      </div>
      <div className="demo-grid">
        <div className="card demo-card">
          <div className="demo-header">
            <h3>上传与识别</h3>
            <span className="demo-subtitle">上传试卷图片后触发 OCR</span>
          </div>
          <label className="demo-upload">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            <span>{file ? `已选择：${file.name}` : "选择试卷图片"}</span>
          </label>
          {previewUrl && (
            <img className="demo-preview" src={previewUrl} alt="试卷预览" />
          )}
          <div className="demo-actions">
            <button
              className="btn-primary"
              type="button"
              onClick={handleExtract}
              disabled={!file || ocrState.status === "loading"}
            >
              识别题目
            </button>
            <button
              className="btn-ghost"
              type="button"
              onClick={resetFlow}
              disabled={!file}
            >
              清空结果
            </button>
          </div>
          <div className={`status-pill status-${ocrState.status}`}>
            <span>{ocrMessage}</span>
          </div>
          <p className="demo-tip">注：插图裁剪在前端模拟，正式版由后端处理。</p>
        </div>

        <div className="card demo-card">
          <div className="demo-header">
            <h3>识别结果与生成</h3>
            <span className="demo-subtitle">选择题目后生成同类变式题</span>
          </div>
          {ocrState.items.length === 0 ? (
            <p className="demo-empty">等待识别结果...</p>
          ) : (
            <div className="demo-list">
              {ocrState.items.map((item) => (
                <div
                  key={item.id}
                  className={`demo-item ${item.id === selectedId ? "selected" : ""}`}
                >
                  <div className="demo-item-head">
                    <strong>题目 {item.id}</strong>
                    <button
                      className="btn-ghost btn-small"
                      type="button"
                      onClick={() => handleSelectItem(item.id)}
                    >
                      使用此题
                    </button>
                  </div>
                  <p>{item.text}</p>
                  {item.has_image && item.image_box && (
                    <div className="demo-crop">
                      {crops[item.id] ? (
                        <img src={crops[item.id]} alt="插图裁剪" />
                      ) : (
                        <span>插图裁剪中...</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="demo-divider" />
          <div className="demo-controls">
            <label className="demo-count">
              生成数量
              <input
                type="number"
                min="1"
                max="5"
                value={count}
                onChange={(event) => {
                  const next = Number(event.target.value || 1);
                  setCount(Math.min(5, Math.max(1, next)));
                }}
              />
            </label>
            <button
              className="btn-primary"
              type="button"
              onClick={handleGenerate}
              disabled={!selectedItem || variantsState.status === "loading"}
            >
              生成同类题
            </button>
          </div>
          <div className={`status-pill status-${variantsState.status}`}>
            <span>{variantMessage}</span>
          </div>
          {variantsState.items.length > 0 && (
            <ol className="demo-variants">
              {variantsState.items.map((text, index) => (
                <li key={`${text}-${index}`}>{text}</li>
              ))}
            </ol>
          )}
          <div className="demo-divider" />
          <div className="demo-actions">
            <button
              className="btn-ghost"
              type="button"
              onClick={handleExport}
              disabled={variantsState.items.length === 0 || exportState.status === "loading"}
            >
              导出错题本
            </button>
            <div className={`status-pill status-${exportState.status}`}>
              <span>{exportMessage}</span>
              {exportState.data?.job_id && (
                <em>#{exportState.data.job_id.slice(0, 8)}</em>
              )}
            </div>
          </div>
          {exportState.data?.download_url && (
            <p className="demo-download">下载地址：{exportState.data.download_url}</p>
          )}
        </div>
      </div>
    </section>
  );
}
