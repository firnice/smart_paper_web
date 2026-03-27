import { useCallback, useEffect, useState } from "react";

const backdropStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.42)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 70,
  padding: 16,
};

const modalStyle = {
  background: "#fff",
  borderRadius: 12,
  maxWidth: 560,
  width: "100%",
  maxHeight: "90vh",
  overflowY: "auto",
  padding: 24,
  position: "relative",
  boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
};

const closeButtonStyle = {
  position: "absolute",
  top: 12,
  right: 12,
  background: "none",
  border: "none",
  fontSize: 22,
  cursor: "pointer",
  color: "#94a3b8",
  lineHeight: 1,
  padding: 4,
};

const headingStyle = {
  fontSize: 18,
  fontWeight: 700,
  color: "#0f172a",
  marginBottom: 16,
  paddingRight: 32,
};

const spinnerWrapStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 0",
  gap: 16,
};

const spinnerStyle = {
  width: 36,
  height: 36,
  border: "4px solid #e2e8f0",
  borderTopColor: "#6366f1",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
};

const progressTextStyle = {
  fontSize: 13,
  color: "#64748b",
  marginBottom: 12,
};

const questionTextStyle = {
  fontSize: 15,
  color: "#1e293b",
  lineHeight: 1.7,
  marginBottom: 16,
  whiteSpace: "pre-wrap",
  padding: "12px 16px",
  background: "#f8fafc",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
};

const toggleBtnStyle = {
  background: "none",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: "8px 16px",
  fontSize: 14,
  color: "#6366f1",
  cursor: "pointer",
  marginBottom: 12,
  width: "100%",
  textAlign: "left",
};

const answerPanelStyle = {
  padding: "12px 16px",
  background: "#fefce8",
  borderRadius: 8,
  border: "1px solid #fde68a",
  marginBottom: 16,
  fontSize: 14,
  color: "#713f12",
  lineHeight: 1.6,
};

const buttonRowStyle = {
  display: "flex",
  gap: 10,
  marginTop: 12,
};

const btnBase = {
  flex: 1,
  padding: "10px 0",
  borderRadius: 8,
  border: "none",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const btnCorrect = { ...btnBase, background: "#dcfce7", color: "#16a34a" };
const btnIncorrect = { ...btnBase, background: "#fee2e2", color: "#dc2626" };
const btnNext = { ...btnBase, background: "#e0e7ff", color: "#4338ca" };

const summaryCardStyle = {
  textAlign: "center",
  padding: "24px 0",
};

const summaryStatStyle = {
  display: "flex",
  justifyContent: "center",
  gap: 24,
  marginBottom: 20,
  fontSize: 15,
};

const finishBtnStyle = {
  ...btnBase,
  flex: "none",
  padding: "10px 40px",
  background: "#6366f1",
  color: "#fff",
  fontSize: 15,
};

const errorStyle = {
  padding: "20px 0",
  textAlign: "center",
  color: "#dc2626",
  fontSize: 14,
};

// inject spinner keyframes once
if (typeof document !== "undefined" && !document.getElementById("variant-spinner-style")) {
  const style = document.createElement("style");
  style.id = "variant-spinner-style";
  style.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
  document.head.appendChild(style);
}

export default function VariantModal({ question, onClose, generateFn }) {
  const [items, setItems] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState([]); // { idx, result }
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!question?.id || !generateFn) return;
    let cancelled = false;
    setLoadingVariants(true);
    setErrorMsg("");
    generateFn(question.id)
      .then((data) => {
        if (cancelled) return;
        const fetched = data?.items || [];
        if (fetched.length === 0) {
          setErrorMsg("未能生成变式题，请稍后再试");
        }
        setItems(fetched);
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err?.message || "生成变式题失败");
      })
      .finally(() => {
        if (!cancelled) setLoadingVariants(false);
      });
    return () => {
      cancelled = true;
    };
  }, [question?.id, generateFn]);

  const goNext = useCallback(() => {
    setShowAnswer(false);
    setCurrentIdx((prev) => {
      if (prev + 1 >= items.length) {
        setFinished(true);
        return prev;
      }
      return prev + 1;
    });
  }, [items.length]);

  const recordResult = useCallback(
    (result) => {
      setResults((prev) => [...prev, { idx: currentIdx, result }]);
      goNext();
    },
    [currentIdx, goNext],
  );

  if (!question) return null;

  const correctCount = results.filter((r) => r.result === "correct").length;
  const incorrectCount = results.filter((r) => r.result === "incorrect").length;
  const skippedCount = items.length - correctCount - incorrectCount;

  const currentItem = items[currentIdx];

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <button style={closeButtonStyle} onClick={onClose} title="关闭">
          &times;
        </button>

        <div style={headingStyle}>
          举一反三 - {question.title || "变式练习"}
        </div>

        {loadingVariants && (
          <div style={spinnerWrapStyle}>
            <div style={spinnerStyle} />
            <div style={{ color: "#64748b", fontSize: 14 }}>AI 正在出题...</div>
          </div>
        )}

        {errorMsg && !loadingVariants && (
          <div style={errorStyle}>
            <p>{errorMsg}</p>
            <button
              style={{ ...btnBase, flex: "none", marginTop: 16, padding: "8px 32px", background: "#f1f5f9", color: "#64748b" }}
              onClick={onClose}
            >
              关闭
            </button>
          </div>
        )}

        {!loadingVariants && !errorMsg && !finished && currentItem && (
          <div>
            <div style={progressTextStyle}>
              第 {currentIdx + 1} / {items.length} 题
            </div>

            <div style={questionTextStyle}>{currentItem.text}</div>

            <button style={toggleBtnStyle} onClick={() => setShowAnswer((prev) => !prev)}>
              {showAnswer ? "收起答案 ▲" : "查看答案 ▼"}
            </button>

            {showAnswer && (
              <div style={answerPanelStyle}>
                <div style={{ marginBottom: 8 }}><strong>答案：</strong>{currentItem.answer}</div>
                {currentItem.hint && <div><strong>提示：</strong>{currentItem.hint}</div>}
              </div>
            )}

            <div style={buttonRowStyle}>
              <button style={btnCorrect} onClick={() => recordResult("correct")}>
                做对了
              </button>
              <button style={btnIncorrect} onClick={() => recordResult("incorrect")}>
                做错了
              </button>
              <button style={btnNext} onClick={goNext}>
                下一题
              </button>
            </div>
          </div>
        )}

        {!loadingVariants && !errorMsg && finished && (
          <div style={summaryCardStyle}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 16 }}>
              练习完成！
            </div>
            <div style={summaryStatStyle}>
              <span style={{ color: "#16a34a" }}>{correctCount} 道做对</span>
              <span style={{ color: "#dc2626" }}>{incorrectCount} 道做错</span>
              <span style={{ color: "#64748b" }}>{skippedCount} 道跳过</span>
            </div>
            <button style={finishBtnStyle} onClick={onClose}>
              完成
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
