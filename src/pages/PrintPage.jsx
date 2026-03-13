import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { QUESTIONS } from "../data/figmaMock.js";

export default function PrintPage() {
  const location = useLocation();
  const selectedIds = location.state?.selectedIds ?? [];
  const cartQuestions = useMemo(
    () => (selectedIds.length ? QUESTIONS.filter((item) => selectedIds.includes(item.id)) : QUESTIONS.slice(0, 3)),
    [selectedIds],
  );

  const [paperMode, setPaperMode] = useState("both");
  const [variationCount, setVariationCount] = useState(1);
  const [hideAnswers, setHideAnswers] = useState(true);
  const [spacing, setSpacing] = useState("medium");
  const [mixMode, setMixMode] = useState(false);

  const generatedQuestions = useMemo(() => {
    const items = [];
    cartQuestions.forEach((question) => {
      if (paperMode !== "variations") {
        items.push({
          id: `${question.id}-origin`,
          title: `【原题】${question.topic}`,
          content: question.originalText,
          answer: question.correctAnswer,
          isVariation: false,
        });
      }
      if (paperMode !== "original") {
        Array.from({ length: variationCount }).forEach((_, index) => {
          items.push({
            id: `${question.id}-variation-${index}`,
            title: `【举一反三】${question.topic} · 变式 ${index + 1}`,
            content: `围绕 ${question.topic} 改变一个关键条件，请重新建立关系并完成求解。`,
            answer: `建议回到原题的标准思路，对比变化条件后再列式求解。`,
            isVariation: true,
          });
        });
      }
    });
    return mixMode ? [...items].sort((left, right) => left.id.localeCompare(right.id)).reverse() : items;
  }, [cartQuestions, hideAnswers, mixMode, paperMode, variationCount]);

  return (
    <div className="figma-page figma-print-page">
      <header className="figma-page-header">
        <div>
          <span className="figma-kicker">智能组卷打印</span>
          <h1>已选 {cartQuestions.length} 道基准错题，按 Figma 的出卷面板重新排版。</h1>
          <p>支持原题、变式题、混合排序与留白高度切换。</p>
        </div>
        <Link className="figma-inline-link" to="/bank">
          返回继续选题
        </Link>
      </header>

      <section className="figma-print-grid">
        <aside className="figma-print-panel">
          <div className="figma-panel-block">
            <span className="figma-kicker">题目构成</span>
            <div className="figma-option-list">
              {[
                { id: "original", label: "仅重做原题", desc: "不含拓展" },
                { id: "both", label: "原题 + 变式", desc: "巩固与延伸" },
                { id: "variations", label: "仅测变式题", desc: "全新挑战" },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={`figma-option-card ${paperMode === mode.id ? "is-active" : ""}`}
                  onClick={() => setPaperMode(mode.id)}
                >
                  <strong>{mode.label}</strong>
                  <span>{mode.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {paperMode !== "original" ? (
            <div className="figma-panel-block">
              <span className="figma-kicker">每题衍生变式数</span>
              <div className="figma-segmented">
                {[1, 2, 3].map((count) => (
                  <button
                    key={count}
                    type="button"
                    className={variationCount === count ? "is-active" : ""}
                    onClick={() => setVariationCount(count)}
                  >
                    {count} 道
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="figma-panel-block">
            <span className="figma-kicker">排版模式</span>
            <div className="figma-inline-toggle-row">
              <button type="button" className={!mixMode ? "is-active" : ""} onClick={() => setMixMode(false)}>
                按原题归类
              </button>
              <button type="button" className={mixMode ? "is-active" : ""} onClick={() => setMixMode(true)}>
                随机混合打乱
              </button>
            </div>
            <label className="figma-switch-row">
              <span>隐藏参考答案</span>
              <input type="checkbox" checked={hideAnswers} onChange={() => setHideAnswers((current) => !current)} />
            </label>
            <label className="figma-select-row">
              <span>作答留白区域</span>
              <select value={spacing} onChange={(event) => setSpacing(event.target.value)}>
                <option value="small">紧凑</option>
                <option value="medium">适中</option>
                <option value="large">宽敞</option>
              </select>
            </label>
          </div>
        </aside>

        <div className="figma-paper-stage">
          <article className="figma-paper-sheet">
            <header className="figma-paper-head">
              <h2>专属错题巩固练习卷</h2>
              <div>
                <span>姓名：______________</span>
                <span>日期：______________</span>
                <span>得分：______________</span>
              </div>
            </header>

            <div className="figma-paper-list">
              {generatedQuestions.map((item, index) => (
                <article key={item.id} className="figma-paper-question">
                  <div className="figma-paper-question-head">
                    <strong>{index + 1}.</strong>
                    <span className={`figma-paper-tag ${item.isVariation ? "is-variation" : ""}`}>{item.title}</span>
                  </div>
                  <p>{item.content}</p>
                  <div className={`figma-paper-space spacing-${spacing}`} />
                  {!hideAnswers ? (
                    <div className="figma-paper-answer">
                      <strong>参考解析：</strong>
                      <span>{item.answer}</span>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
