import { useCallback, useState } from "react";

const fullscreenStyle = {
  position: "fixed",
  inset: 0,
  background: "#fff",
  zIndex: 80,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 20px",
  borderBottom: "1px solid #e2e8f0",
  flexShrink: 0,
};

const progressBarWrapStyle = {
  height: 6,
  background: "#e2e8f0",
  borderRadius: 3,
  flex: 1,
  marginLeft: 16,
  marginRight: 16,
};

const exitBtnStyle = {
  background: "none",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: "6px 16px",
  fontSize: 14,
  color: "#64748b",
  cursor: "pointer",
  flexShrink: 0,
};

const bodyStyle = {
  flex: 1,
  overflowY: "auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const cardStyle = {
  maxWidth: 480,
  width: "100%",
  background: "#fff",
  borderRadius: 12,
  padding: 24,
};

const titleStyle = {
  fontSize: 18,
  fontWeight: 700,
  color: "#0f172a",
  marginBottom: 12,
};

const contentStyle = {
  fontSize: 14,
  color: "#334155",
  lineHeight: 1.7,
  marginBottom: 16,
  whiteSpace: "pre-wrap",
};

const imageWrapStyle = {
  marginBottom: 16,
  borderRadius: 8,
  overflow: "hidden",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
};

const imageStyle = {
  display: "block",
  maxWidth: "100%",
  maxHeight: 240,
  objectFit: "contain",
  margin: "0 auto",
};

const buttonRowStyle = {
  display: "flex",
  gap: 10,
  marginTop: 20,
};

const btnBase = {
  flex: 1,
  padding: "10px 0",
  borderRadius: 8,
  border: "none",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};

const btnCorrect = { ...btnBase, background: "#dcfce7", color: "#16a34a" };
const btnIncorrect = { ...btnBase, background: "#fee2e2", color: "#dc2626" };
const btnSkip = { ...btnBase, background: "#f1f5f9", color: "#64748b" };

const summaryStyle = {
  textAlign: "center",
  padding: "40px 20px",
};

const summaryStatStyle = {
  display: "flex",
  justifyContent: "center",
  gap: 24,
  marginBottom: 24,
  fontSize: 16,
};

const finishBtnStyle = {
  ...btnBase,
  flex: "none",
  padding: "12px 48px",
  background: "#6366f1",
  color: "#fff",
  fontSize: 15,
};

export default function PracticeSession({ questions, onComplete, onExit }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState([]); // { questionId, result }
  const [finished, setFinished] = useState(false);

  const total = questions?.length || 0;
  const progress = total > 0 ? Math.round(((currentIdx + (finished ? 1 : 0)) / total) * 100) : 0;
  const currentQ = questions?.[currentIdx];

  const handleResult = useCallback(
    (result) => {
      const entry = { questionId: currentQ.id, result };
      const newResults = [...results, entry];
      setResults(newResults);

      if (currentIdx + 1 >= total) {
        setFinished(true);
      } else {
        setCurrentIdx((prev) => prev + 1);
      }
    },
    [currentQ, currentIdx, total, results],
  );

  const handleExit = useCallback(() => {
    if (results.length > 0) {
      const confirmed = window.confirm("确定退出？已做的结果将保存");
      if (!confirmed) return;
      if (onComplete) onComplete(results);
    }
    if (onExit) onExit();
  }, [results, onComplete, onExit]);

  const handleFinish = useCallback(() => {
    if (onComplete) onComplete(results);
  }, [results, onComplete]);

  if (!questions || total === 0) return null;

  const correctCount = results.filter((r) => r.result === "correct").length;
  const incorrectCount = results.filter((r) => r.result === "incorrect").length;
  const skippedCount = results.filter((r) => r.result === "skipped").length;

  return (
    <div style={fullscreenStyle}>
      <div style={headerStyle}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap" }}>
          第 {Math.min(currentIdx + 1, total)} / {total} 题
        </span>
        <div style={progressBarWrapStyle}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "#6366f1",
              borderRadius: 3,
              transition: "width 0.3s",
            }}
          />
        </div>
        <button style={exitBtnStyle} onClick={handleExit}>
          退出
        </button>
      </div>

      <div style={bodyStyle}>
        {!finished && currentQ && (
          <div style={cardStyle}>
            <div style={titleStyle}>{currentQ.title || "未命名错题"}</div>

            {currentQ.content && <div style={contentStyle}>{currentQ.content}</div>}

            {(currentQ.image_data || currentQ.imageUrl) && (
              <div style={imageWrapStyle}>
                <img
                  src={currentQ.image_data || currentQ.imageUrl}
                  alt={currentQ.title || "题目图片"}
                  style={imageStyle}
                />
              </div>
            )}

            {currentQ.error_reason && (
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>
                错因：{currentQ.error_reason}
              </div>
            )}

            <div style={buttonRowStyle}>
              <button style={btnCorrect} onClick={() => handleResult("correct")}>
                做对了 &#10003;
              </button>
              <button style={btnIncorrect} onClick={() => handleResult("incorrect")}>
                做错了 &#10007;
              </button>
              <button style={btnSkip} onClick={() => handleResult("skipped")}>
                跳过
              </button>
            </div>
          </div>
        )}

        {finished && (
          <div style={summaryStyle}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
              练习完成！
            </div>
            <div style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>
              共 {total} 题
            </div>
            <div style={summaryStatStyle}>
              <span style={{ color: "#16a34a" }}>{correctCount} 做对</span>
              <span style={{ color: "#dc2626" }}>{incorrectCount} 做错</span>
              <span style={{ color: "#64748b" }}>{skippedCount} 跳过</span>
            </div>
            <button style={finishBtnStyle} onClick={handleFinish}>
              完成
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
