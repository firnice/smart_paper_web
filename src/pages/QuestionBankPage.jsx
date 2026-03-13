import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QUESTIONS, SUBJECTS } from "../data/figmaMock.js";

export default function QuestionBankPage() {
  const navigate = useNavigate();
  const [activeSubject, setActiveSubject] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const filteredQuestions = useMemo(
    () =>
      QUESTIONS.filter((question) => {
        const matchSubject = activeSubject === "全部" || question.subject === activeSubject;
        const haystack = `${question.originalText} ${question.topic} ${question.errorReason}`;
        return matchSubject && haystack.includes(searchQuery.trim());
      }),
    [activeSubject, searchQuery],
  );

  const toggleSelected = (questionId) => {
    setSelectedIds((current) =>
      current.includes(questionId) ? current.filter((item) => item !== questionId) : [...current, questionId],
    );
  };

  const handleCardClick = (questionId) => {
    if (isSelectMode) {
      toggleSelected(questionId);
      return;
    }
    navigate(`/question/${questionId}`);
  };

  const handleToggleSelectMode = () => {
    setIsSelectMode((current) => !current);
    setSelectedIds([]);
  };

  const handleGoPrint = () => {
    navigate("/print", { state: { selectedIds } });
  };

  return (
    <div className="figma-page">
      <header className="figma-page-header">
        <div>
          <span className="figma-kicker">错题本</span>
          <h1>按知识点回看错题，再决定复习还是组卷。</h1>
          <p>这一页按 Figma 原型恢复成搜索 + 科目筛选 + 组卷选择的结构。</p>
        </div>
        <div className="figma-header-actions">
          <div className="figma-search">
            <input
              type="search"
              placeholder="搜索题目、知识点..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <button type="button" className={`figma-pill-button ${isSelectMode ? "is-active" : ""}`} onClick={handleToggleSelectMode}>
            {isSelectMode ? "取消选择" : "批量组卷"}
          </button>
        </div>
      </header>

      <div className="figma-pill-row">
        {SUBJECTS.map((subject) => (
          <button
            key={subject}
            type="button"
            className={`figma-subject-pill ${activeSubject === subject ? "is-active" : ""}`}
            onClick={() => setActiveSubject(subject)}
          >
            {subject === "全部" ? "全部科目" : subject}
          </button>
        ))}
      </div>

      {filteredQuestions.length ? (
        <section className="figma-card-grid">
          {filteredQuestions.map((question) => {
            const selected = selectedIds.includes(question.id);
            return (
              <button
                key={question.id}
                type="button"
                className={`figma-question-card ${selected ? "is-selected" : ""}`}
                data-subject={question.subject}
                onClick={() => handleCardClick(question.id)}
              >
                <div className="figma-question-top">
                  <div className="figma-chip-row">
                    <span className="figma-subject-tag">{question.subject}</span>
                    <span className="figma-date-tag">{question.date}</span>
                  </div>
                  {question.isRecurring ? (
                    <span className="figma-warn-tag">反复错 {question.recurringCount} 次</span>
                  ) : null}
                </div>
                <h3>{question.originalText}</h3>
                <p className="figma-question-topic">{question.topic}</p>
                <div className="figma-question-bottom">
                  <span className="figma-reason-tag">{question.errorReason}</span>
                  <span className="figma-inline-arrow">{isSelectMode ? (selected ? "已选中" : "点击加入") : "看解析与练习"}</span>
                </div>
              </button>
            );
          })}
        </section>
      ) : (
        <section className="figma-empty-card">
          <strong>暂无符合条件的错题</strong>
          <p>尝试调整搜索词或切换科目标签。</p>
        </section>
      )}

      {isSelectMode ? (
        <div className="figma-floating-bar">
          <div>
            <strong>{selectedIds.length}</strong>
            <span>道题已加入打印车</span>
          </div>
          <button type="button" className="figma-dark-button" onClick={handleGoPrint} disabled={selectedIds.length === 0}>
            生成 A4 试卷
          </button>
        </div>
      ) : null}
    </div>
  );
}
