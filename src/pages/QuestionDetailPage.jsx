import { Link, useNavigate, useParams } from "react-router-dom";
import { QUESTIONS } from "../data/figmaMock.js";

export default function QuestionDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const question = QUESTIONS.find((item) => item.id === id) || QUESTIONS[0];

  return (
    <div className="figma-page figma-detail-page">
      <div className="figma-detail-nav">
        <button type="button" className="figma-inline-back" onClick={() => navigate(-1)}>
          返回错题本
        </button>
        <Link className="figma-inline-link" to="/print">
          打印此题
        </Link>
      </div>

      <section className="figma-detail-shell">
        <div className="figma-detail-head">
          <div className="figma-chip-row">
            <span className="figma-subject-tag">{question.subject}</span>
            <span className="figma-date-tag">录入于 {question.date}</span>
          </div>
          {question.isRecurring ? <span className="figma-warn-banner">反复错题 · {question.recurringCount} 次</span> : null}
        </div>

        <div className="figma-detail-body">
          <h1>{question.originalText}</h1>

          <article className="figma-analysis-card is-danger">
            <span className="figma-kicker">AI 错因深度剖析</span>
            <h2>{question.errorReason}</h2>
            <p>
              当前错误集中在 <strong>{question.topic}</strong>。这类题容易在关键判断点掉链子，通常不是不会做，而是没有按步骤把
              条件、边界和公式关系检查完整。
            </p>
          </article>

          <article className="figma-analysis-card is-safe">
            <span className="figma-kicker">正确参考答案与步骤</span>
            <h2>{question.topic}</h2>
            <p>{question.correctAnswer}</p>
          </article>
        </div>
      </section>

      <div className="figma-split-actions">
        <Link className="figma-secondary-button" to="/print">
          打印此题及变式
        </Link>
        <Link className="figma-primary-button" to={`/practice/${question.id}`}>
          开始举一反三练习
        </Link>
      </div>
    </div>
  );
}
