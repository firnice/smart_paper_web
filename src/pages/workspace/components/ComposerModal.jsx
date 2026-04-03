import { getDefaultSchoolTerm } from "../../../services/studentDemo.js";
import {
  DIAGRAM_RENDER_MODES,
  ENTRY_MODES,
  PAPER_ZOOM_MAX,
  PAPER_ZOOM_MIN,
  PAPER_ZOOM_STEP,
  RECOGNITION_SCOPES,
} from "../constants.js";

const ENTRY_MODE_COPY = {
  camera: {
    title: "手机拍照录入",
    desc: "适合家长现场拍卷子或作业本，尽快进入识别和裁剪。",
    action: "打开摄像头拍照",
  },
  photo: {
    title: "从相册选图",
    desc: "适合已拍好的整张卷子或局部题目，直接继续识别。",
    action: "从相册选择照片",
  },
  upload: {
    title: "上传附件",
    desc: "更适合电脑端上传扫描图、图片文件或整理过的电子资料。",
    action: "上传文件",
  },
  text: {
    title: "仅录入文字",
    desc: "没有图片时，也可以先录题干与分类信息，后续再补图。",
    action: "",
  },
};

function PanelHead({ kicker, title, description, actions }) {
  return (
    <div className="student-panel-head">
      <div className="student-panel-copy">
        {kicker ? <p className="student-panel-kicker">{kicker}</p> : null}
        <h4>{title}</h4>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="student-panel-actions">{actions}</div> : null}
    </div>
  );
}

export default function ComposerModal({ composer, profile, formTermOptions }) {
  const {
    cameraInputRef,
    photoInputRef,
    uploadInputRef,
    paperImageRef,
    cropImageRef,
    elementStageRef,
    form,
    setForm,
    composerMode,
    setComposerMode,
    isComposerOpen,
    originalImageData,
    paperImageMetrics,
    setPaperImageMetrics,
    paperZoom,
    recognitionScope,
    setRecognitionScope,
    paperSelectionRect,
    cropRect,
    ocrStatus,
    ocrItems,
    ocrError,
    selectedOcrId,
    diagramRenderMode,
    diagramRequestKey,
    sourceImageSnapshot,
    elementEditor,
    elementDraftRect,
    analyzing,
    loading,
    canRunRecognition,
    paperZoomPercent,
    paperSelectionDisplayRect,
    onCloseComposer,
    onTriggerPick,
    onRemovePhoto,
    onApplyOcrItem,
    applyOcrTextOnly,
    onOpenElementEditor,
    onToggleElementHidden,
    onMarkAllElements,
    onClearElementMarks,
    onApplyElementErase,
    onRunRealOcr,
    onPickCamera,
    onPickPhoto,
    onPickUpload,
    persistWrongQuestion,
    onAddWrongQuestion,
    onApplyCrop,
    onWhitenBackground,
    onAutoRemoveHandwriting,
    onRestoreOriginalImage,
    updatePaperZoom,
    resetPaperSelection,
    resetElementEditor,
    onPaperMouseDown,
    onPaperMouseMove,
    onPaperMouseUp,
    onCropMouseDown,
    onCropMouseMove,
    onCropMouseUp,
    onElementStageMouseDown,
    onElementStageMouseMove,
    onElementStageMouseUp,
  } = composer;

  if (!isComposerOpen) return null;

  const isOriginalCropMode = diagramRenderMode === "original_crop";
  const currentRecognitionScopeMeta =
    RECOGNITION_SCOPES.find((scope) => scope.id === recognitionScope) || RECOGNITION_SCOPES[0];
  const currentDiagramModeMeta =
    DIAGRAM_RENDER_MODES.find((mode) => mode.id === diagramRenderMode) || DIAGRAM_RENDER_MODES[0];
  const currentEntryModeMeta = ENTRY_MODE_COPY[composerMode] || ENTRY_MODE_COPY.camera;
  const hasSourceAsset = Boolean(sourceImageSnapshot.data || sourceImageSnapshot.name);
  const hasPreviewContent = Boolean(form.image_data || form.image_name || form.content || form.title);
  const flowSteps = [
    { id: "pick", label: "选来源", active: true },
    { id: "recognize", label: "识别与裁剪", active: hasSourceAsset },
    { id: "save", label: "确认保存", active: hasPreviewContent },
  ];

  return (
    <div className="student-modal-backdrop" onClick={onCloseComposer}>
      <section className="student-modal student-modal-shell" onClick={(event) => event.stopPropagation()} style={{ position: "relative" }}>
        {(ocrStatus === "loading" || analyzing || diagramRequestKey) && (
          <div className="student-composer-overlay">
            <div className="student-composer-overlay-content">
              <div className="student-composer-spinner" />
              <p>{analyzing ? "正在智能分析题目，自动填写中..." : diagramRequestKey ? "正在生成图示，请稍候..." : "正在识别题目，请稍候..."}</p>
            </div>
          </div>
        )}

        <div className="student-modal-head student-modal-topbar">
          <div className="student-modal-copy">
            <p className="student-modal-kicker">错题录入</p>
            <h3>先录入，再整理，再打印</h3>
            <p>手机适合拍照和即时保存，电脑适合看整页、修 OCR 和批量整理。这里统一用同一套录入流。</p>
          </div>
          <button type="button" className="btn-ghost btn-small" onClick={onCloseComposer}>
            关闭
          </button>
        </div>

        <div className="student-modal-flow">
          {flowSteps.map((item, index) => (
            <div key={item.id} className={`student-flow-chip ${item.active ? "active" : ""}`}>
              <span>{`0${index + 1}`}</span>
              <strong>{item.label}</strong>
            </div>
          ))}
        </div>

        <div className="student-summary-strip">
          <div className="student-summary-pill">
            <span>当前入口</span>
            <strong>{currentEntryModeMeta.title}</strong>
          </div>
          <div className="student-summary-pill">
            <span>识别范围</span>
            <strong>{currentRecognitionScopeMeta.label}</strong>
          </div>
          <div className="student-summary-pill">
            <span>图示方案</span>
            <strong>{currentDiagramModeMeta.label}</strong>
          </div>
        </div>

        <div className="student-modal-layout">
          <div className="student-modal-main">
            <section className="student-panel">
              <PanelHead
                kicker="步骤 1"
                title="选择录入来源"
                description={currentEntryModeMeta.desc}
              />

              <div className="student-entry-mode-tabs">
                {ENTRY_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    className={`student-entry-mode-tab ${composerMode === mode.id ? "active" : ""}`}
                    onClick={() => setComposerMode(mode.id)}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="student-entry-launcher">
                {composerMode === "text" ? (
                  <div className="student-inline-note">
                    <strong>{currentEntryModeMeta.title}</strong>
                    <p>{currentEntryModeMeta.desc}</p>
                  </div>
                ) : (
                  <button type="button" className="btn-secondary student-launch-btn" onClick={() => onTriggerPick(composerMode)}>
                    {currentEntryModeMeta.action}
                  </button>
                )}
                <div className="student-inline-note subtle">
                  <strong>录入建议</strong>
                  <p>手机优先拍照，电脑优先上传整页图片或扫描件。保存后都会进入同一份错题本。</p>
                </div>
              </div>

              <input
                ref={cameraInputRef}
                className="student-hidden-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onPickCamera}
              />
              <input
                ref={photoInputRef}
                className="student-hidden-input"
                type="file"
                accept="image/*"
                onChange={onPickPhoto}
              />
              <input
                ref={uploadInputRef}
                className="student-hidden-input"
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={onPickUpload}
              />
            </section>

            {hasSourceAsset ? (
              <section className="student-panel">
                <PanelHead
                  kicker="步骤 2"
                  title="原始资料与识别范围"
                  description="先看整张资料，再决定是识别整页，还是先框出一道题后再识别。"
                  actions={(
                    <>
                      {recognitionScope === "manual_question" && sourceImageSnapshot.data ? (
                        <button
                          type="button"
                          className="btn-ghost btn-small"
                          disabled={!paperSelectionRect || ocrStatus === "loading"}
                          onClick={resetPaperSelection}
                        >
                          清空选区
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="btn-secondary btn-small"
                        disabled={ocrStatus === "loading" || !canRunRecognition}
                        onClick={onRunRealOcr}
                      >
                        {ocrStatus === "loading"
                          ? "识别中..."
                          : recognitionScope === "full_page" || !sourceImageSnapshot.data
                            ? "识别整张"
                            : "识别选中区域"}
                      </button>
                    </>
                  )}
                />

                {sourceImageSnapshot.data ? (
                  <div className="student-source-stage">
                    <div className="student-paper-source-scroll">
                      <div
                        className={`student-paper-source ${recognitionScope === "manual_question" ? "selectable" : ""}`}
                        onMouseDown={onPaperMouseDown}
                        onMouseMove={onPaperMouseMove}
                        onMouseUp={onPaperMouseUp}
                        onMouseLeave={onPaperMouseUp}
                      >
                        <img
                          ref={paperImageRef}
                          src={sourceImageSnapshot.data}
                          alt={sourceImageSnapshot.name || "试卷图片"}
                          onLoad={(event) => {
                            const target = event.currentTarget;
                            setPaperImageMetrics({
                              width: target.naturalWidth || 0,
                              height: target.naturalHeight || 0,
                            });
                          }}
                          style={{
                            width: paperImageMetrics.width ? `${Math.round(paperImageMetrics.width * paperZoom)}px` : "auto",
                            maxWidth: "none",
                          }}
                        />
                        {recognitionScope === "manual_question" && paperSelectionDisplayRect ? (
                          <div
                            className="student-crop-rect"
                            style={{
                              left: `${paperSelectionDisplayRect.x}px`,
                              top: `${paperSelectionDisplayRect.y}px`,
                              width: `${paperSelectionDisplayRect.width}px`,
                              height: `${paperSelectionDisplayRect.height}px`,
                            }}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="workspace-alert">当前附件：{sourceImageSnapshot.name}</div>
                )}

                <div className="student-source-toolbar">
                  <div className="student-file-name">
                    <span>当前文件</span>
                    <strong>{sourceImageSnapshot.name || "已选择文件"}</strong>
                  </div>
                  <div className="student-photo-actions">
                    {sourceImageSnapshot.data ? (
                      <div className="student-zoom-controls">
                        <button
                          type="button"
                          className="btn-small btn-ghost"
                          onClick={() => updatePaperZoom(paperZoom - PAPER_ZOOM_STEP)}
                          disabled={paperZoom <= PAPER_ZOOM_MIN}
                        >
                          缩小
                        </button>
                        <span className="student-zoom-label">{paperZoomPercent}</span>
                        <button
                          type="button"
                          className="btn-small btn-ghost"
                          onClick={() => updatePaperZoom(1)}
                          disabled={paperZoom === 1}
                        >
                          100%
                        </button>
                        <button
                          type="button"
                          className="btn-small btn-ghost"
                          onClick={() => updatePaperZoom(paperZoom + PAPER_ZOOM_STEP)}
                          disabled={paperZoom >= PAPER_ZOOM_MAX}
                        >
                          放大
                        </button>
                      </div>
                    ) : null}
                    <button type="button" className="btn-small btn-ghost" onClick={onRemovePhoto}>
                      清除文件
                    </button>
                  </div>
                </div>

                <div className="student-selection-shell">
                  <div className="student-selection-tabs">
                    {RECOGNITION_SCOPES.map((scope) => (
                      <button
                        key={scope.id}
                        type="button"
                        className={`student-selection-tab ${recognitionScope === scope.id ? "active" : ""}`}
                        onClick={() => {
                          setRecognitionScope(scope.id);
                          if (scope.id === "full_page") {
                            resetPaperSelection();
                          }
                        }}
                      >
                        {scope.label}
                      </button>
                    ))}
                  </div>
                  <p className="student-selection-hint">
                    {currentRecognitionScopeMeta.hint}
                    {recognitionScope === "manual_question" && !sourceImageSnapshot.data
                      ? " 当前图片无法预览，请改用整张识别。"
                      : ""}
                  </p>
                </div>
              </section>
            ) : null}

            {hasSourceAsset ? (
              <section className="student-panel">
                <PanelHead
                  kicker="步骤 3"
                  title="OCR 与题目候选"
                  description="识别后可逐题载入内容；如果图示不完整，再按需生成新的 SVG 预览。"
                />

                <div className="student-ocr-mode-hint">
                  当前识别范围：{currentRecognitionScopeMeta.label}。当前图示方案：{currentDiagramModeMeta.label}。{currentDiagramModeMeta.hint}
                </div>

                {ocrStatus === "loading" ? <div className="workspace-alert">正在识别题目，请稍候...</div> : null}
                {ocrStatus === "error" ? <div className="workspace-alert error">{ocrError || "识别失败"}</div> : null}
                {ocrStatus === "empty" ? (
                  <div className="workspace-alert">识别已完成，但未提取到题目，请手动补充题目内容。</div>
                ) : null}

                {ocrStatus === "success" && ocrItems.length > 0 ? (
                  <div className="student-ocr-list">
                    {ocrItems.map((item) => {
                      const isApplyingSvg = diagramRequestKey === `${item.id}:llm_svg`;
                      return (
                        <article
                          key={item.id}
                          className={`student-ocr-item ${selectedOcrId === item.id ? "active" : ""}`}
                          onClick={() => {
                            applyOcrTextOnly(item);
                          }}
                        >
                          <div className="student-ocr-item-head">
                            <strong>第 {item.id} 题</strong>
                            <div className="student-ocr-item-actions">
                              <button
                                type="button"
                                className="btn-ghost btn-small"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  applyOcrTextOnly(item);
                                }}
                              >
                                载入题目
                              </button>
                              <button
                                type="button"
                                className="btn-ghost btn-small"
                                disabled={Boolean(diagramRequestKey)}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onApplyOcrItem(item, false, "llm_svg");
                                }}
                              >
                                {isApplyingSvg ? "生成中..." : "生成SVG"}
                              </button>
                            </div>
                          </div>

                          <p className="student-ocr-text">{item.text || "（该题未返回文字）"}</p>

                          <div className="student-ocr-image-grid">
                            <div className="student-ocr-image-slot">
                              <span className="student-ocr-image-label">原始题目截图（仅参考）</span>
                              {item.questionImageUrl ? (
                                <div className="student-ocr-image-wrap">
                                  <img src={item.questionImageUrl} alt={`第${item.id}题题目截图`} />
                                </div>
                              ) : (
                                <div className="workspace-alert">未返回题目截图</div>
                              )}
                            </div>
                            <div className="student-ocr-image-slot">
                              <span className="student-ocr-image-label">LLM 生成 SVG 预览</span>
                              {diagramRenderMode === "llm_svg" && isApplyingSvg ? (
                                <div className="workspace-alert">正在生成 SVG 图示...</div>
                              ) : diagramRenderMode === "llm_svg" && item.diagramSvgUrl ? (
                                <div className="student-ocr-image-wrap diagram">
                                  <img src={item.diagramSvgUrl} alt={`第${item.id}题SVG图示`} />
                                </div>
                              ) : (
                                <div className="workspace-alert">
                                  点击“生成SVG”后，将基于该题识别文字生成新的 SVG 图示。
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            ) : null}

            {isOriginalCropMode && elementEditor.open ? (
              <section className="student-panel">
                <PanelHead
                  kicker="辅助工具"
                  title="元素扫描编辑"
                  description={`来源：${elementEditor.sourceLabel || "当前图片"}。已识别 ${elementEditor.elements.length} 个元素，已标记删除 ${elementEditor.hiddenIds.length} 个。点击框可切换，空白处拖拽可新增删除框。`}
                  actions={(
                    <>
                      <button type="button" className="btn-ghost btn-small" onClick={onMarkAllElements} disabled={elementEditor.loading || !elementEditor.elements.length}>
                        全部标记删除
                      </button>
                      <button type="button" className="btn-ghost btn-small" onClick={onClearElementMarks} disabled={elementEditor.loading || !elementEditor.hiddenIds.length}>
                        清空标记
                      </button>
                      <button type="button" className="btn-secondary btn-small" onClick={onApplyElementErase} disabled={elementEditor.loading || !elementEditor.hiddenIds.length}>
                        {elementEditor.loading ? "处理中..." : "应用删除到图片"}
                      </button>
                      <button type="button" className="btn-ghost btn-small" onClick={resetElementEditor}>
                        关闭编辑
                      </button>
                    </>
                  )}
                />

                {elementEditor.error ? <div className="workspace-alert">{elementEditor.error}</div> : null}
                {elementEditor.loading ? <div className="workspace-alert">元素扫描处理中...</div> : null}

                {elementEditor.sourceImage ? (
                  <div
                    ref={elementStageRef}
                    className="student-element-stage"
                    onMouseDown={onElementStageMouseDown}
                    onMouseMove={onElementStageMouseMove}
                    onMouseUp={onElementStageMouseUp}
                    onMouseLeave={onElementStageMouseUp}
                  >
                    <img src={elementEditor.sourceImage} alt="元素扫描底图" draggable={false} />
                    {elementEditor.elements.map((element) => {
                      const marked = elementEditor.hiddenIds.includes(element.id);
                      return (
                        <button
                          key={element.id}
                          type="button"
                          className={`student-element-box ${marked ? "marked" : ""}`}
                          style={{
                            left: `${(element.x / Math.max(1, elementEditor.imageWidth)) * 100}%`,
                            top: `${(element.y / Math.max(1, elementEditor.imageHeight)) * 100}%`,
                            width: `${(element.width / Math.max(1, elementEditor.imageWidth)) * 100}%`,
                            height: `${(element.height / Math.max(1, elementEditor.imageHeight)) * 100}%`,
                          }}
                          onMouseDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.stopPropagation();
                            onToggleElementHidden(element.id);
                          }}
                          title={marked ? "已标记删除，点击恢复" : "点击标记删除"}
                        />
                      );
                    })}
                    {elementDraftRect ? (
                      <div
                        className="student-element-draft"
                        style={{
                          left: `${(elementDraftRect.x / Math.max(1, elementEditor.imageWidth)) * 100}%`,
                          top: `${(elementDraftRect.y / Math.max(1, elementEditor.imageHeight)) * 100}%`,
                          width: `${(elementDraftRect.width / Math.max(1, elementEditor.imageWidth)) * 100}%`,
                          height: `${(elementDraftRect.height / Math.max(1, elementEditor.imageHeight)) * 100}%`,
                        }}
                      />
                    ) : null}
                  </div>
                ) : null}
              </section>
            ) : null}

            {isOriginalCropMode && form.image_data ? (
              <section className="student-panel">
                <PanelHead
                  kicker="辅助工具"
                  title="图示处理"
                  description="如果题目里有图，可以在这里抠图、去手写或把背景置白，再带入右侧预览。"
                  actions={(
                    <div className="student-crop-buttons">
                      <button
                        type="button"
                        className="btn-ghost btn-small"
                        onClick={() =>
                          onOpenElementEditor({
                            imageUrl: form.image_data,
                            sourceLabel: "当前预览图",
                            sourceType: "form",
                            itemId: selectedOcrId,
                          })
                        }
                      >
                        扫描当前图元素
                      </button>
                      <button type="button" className="btn-ghost btn-small" onClick={onAutoRemoveHandwriting}>
                        自动去手写
                      </button>
                      <button type="button" className="btn-ghost btn-small" onClick={onWhitenBackground}>
                        背景置白
                      </button>
                      <button type="button" className="btn-secondary btn-small" onClick={onApplyCrop}>
                        抠选中区域
                      </button>
                      {originalImageData && originalImageData !== form.image_data ? (
                        <button type="button" className="btn-small btn-ghost" onClick={onRestoreOriginalImage}>
                          恢复原图
                        </button>
                      ) : null}
                    </div>
                  )}
                />

                <div
                  className="student-crop-area"
                  onMouseDown={onCropMouseDown}
                  onMouseMove={onCropMouseMove}
                  onMouseUp={onCropMouseUp}
                  onMouseLeave={onCropMouseUp}
                >
                  <img ref={cropImageRef} src={form.image_data} alt="待抠图题目" draggable={false} />
                  {cropRect ? (
                    <div
                      className="student-crop-rect"
                      style={{
                        left: `${cropRect.x}px`,
                        top: `${cropRect.y}px`,
                        width: `${cropRect.width}px`,
                        height: `${cropRect.height}px`,
                      }}
                    />
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>

          <div className="student-modal-side">
            {hasPreviewContent ? (
              <section className="student-panel">
                <PanelHead
                  kicker="预览"
                  title="错题卡片预览"
                  description="保存后将在错题列表按下方样式展示。"
                />

                <article className="student-question-item student-preview-card">
                  <div className="student-question-head">
                    <div className="student-chip-row">
                      <span className="student-subject-badge">{form.subject || "未分类学科"}</span>
                      <span className="student-term-badge">{form.term || getDefaultSchoolTerm(null, profile.grade)}</span>
                    </div>
                    <span className="student-status status-new">新错题</span>
                  </div>
                  <strong className="student-question-title">{form.title || "未命名错题"}</strong>
                  <p>{form.content || "请补充题目内容。"}</p>
                  {form.image_data ? (
                    <div className="student-question-image-wrap">
                      <img className="student-question-image" src={form.image_data} alt={form.image_name || "错题图片预览"} />
                    </div>
                  ) : form.image_name ? (
                    <div className="workspace-alert student-preview-note">
                      附件：{form.image_name}
                    </div>
                  ) : null}
                  <div className="student-meta">
                    <span>分类：{form.category || "未分类"}</span>
                    <span>错因：{form.error_reason || "待分析"}</span>
                  </div>
                </article>
              </section>
            ) : null}

            <section className="student-panel student-form-panel">
              <PanelHead
                kicker="步骤 4"
                title="确认并保存"
                description="右侧只放保存前必须确认的信息，减少一长串工具和表单混在一起。"
              />

              <form className="workspace-form student-form-grid" onSubmit={onAddWrongQuestion}>
                <label>
                  标题（可选）
                  <input
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                </label>
                <label>
                  学科
                  <select
                    value={form.subject}
                    onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                  >
                    <option value="数学">数学</option>
                    <option value="语文">语文</option>
                    <option value="英语">英语</option>
                    <option value="科学">科学</option>
                  </select>
                </label>
                <label>
                  学期
                  <select
                    value={form.term}
                    onChange={(event) => setForm((prev) => ({ ...prev, term: event.target.value }))}
                  >
                    {formTermOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  错题分类
                  <input
                    value={form.category}
                    onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  />
                </label>
                <label>
                  错误原因
                  <input
                    value={form.error_reason}
                    onChange={(event) => setForm((prev) => ({ ...prev, error_reason: event.target.value }))}
                  />
                </label>
                <label className="student-full-col">
                  题目内容（支持手动输入）
                  <textarea
                    rows={4}
                    value={form.content}
                    onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                  />
                </label>
                <div className="student-form-actions student-full-col">
                  <button
                    className="btn-secondary"
                    type="button"
                    disabled={loading || !sourceImageSnapshot.data}
                    onClick={() => persistWrongQuestion(true)}
                  >
                    保存并继续下一题
                  </button>
                  <button className="btn-primary" type="submit" disabled={loading}>
                    保存到错题本
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
