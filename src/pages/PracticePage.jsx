import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QUESTIONS } from "../data/figmaMock.js";

export default function PracticePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const question = QUESTIONS.find((item) => item.id === id) || QUESTIONS[0];
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="figma-page">
      <div className="figma-detail-nav">
        <button type="button" className="figma-inline-back" onClick={() => navigate(-1)}>
          退出练习
        </button>
        <span className="figma-progress-tag">练习进度 1 / 3</span>
      </div>

      <header className="figma-centered-header">
        <span className="figma-kicker">举一反三特训</span>
        <h1>围绕「{question.topic}」做一轮针对性变式训练。</h1>
        <p>先按自己的方式解，再看 AI 批改意见。</p>
      </header>

      <section className="figma-practice-card">
        <div className="figma-chip-row">
          <span className="figma-practice-badge">变式题</span>
          <span className="figma-date-tag">难度评级：中等</span>
        </div>
        <h2>
          【变式训练】围绕 {question.topic}，将题设条件做一步变化，要求你重新判断关键变量之间的关系并给出完整结论。
        </h2>
        <label className="figma-textarea-block">
          <span>写下你的解题思路或答案</span>
          <textarea
            rows="8"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="在这里输入你的过程，先不要急着看答案。"
          />
        </label>
      </section>

      <div className="figma-split-actions center">
        <button type="button" className="figma-primary-button" onClick={() => setSubmitted(true)} disabled={!answer.trim()}>
          提交答案，看 AI 批改
        </button>
        <button type="button" className="figma-secondary-button" onClick={() => setAnswer("")}>
          跳过此题
        </button>
      </div>

      {submitted ? (
        <section className="figma-feedback-card">
          <span className="figma-kicker">AI 批改摘要</span>
          <h3>思路方向正确，但还可以更稳。</h3>
          <p>建议回到 {question.topic} 的标准解题步骤，先把条件拆清，再列关系式，避免直接代入导致漏掉边界判断。</p>
        </section>
      ) : null}
    </div>
  );
}
