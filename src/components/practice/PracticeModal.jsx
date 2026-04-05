import { useCallback } from "react";
import useEscapeKey from "../../hooks/useEscapeKey.js";

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
  maxWidth: 480,
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

const titleStyle = {
  fontSize: 18,
  fontWeight: 700,
  color: "#0f172a",
  marginBottom: 12,
  paddingRight: 32,
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
  transition: "opacity 0.15s",
};

const btnCorrect = {
  ...btnBase,
  background: "#dcfce7",
  color: "#16a34a",
};

const btnIncorrect = {
  ...btnBase,
  background: "#fee2e2",
  color: "#dc2626",
};

const btnSkip = {
  ...btnBase,
  background: "#f1f5f9",
  color: "#64748b",
};

export default function PracticeModal({ question, onResult, onClose }) {
  useEscapeKey(Boolean(question), onClose);

  const handleResult = useCallback(
    (result) => {
      if (onResult) onResult(question.id, result);
    },
    [question, onResult],
  );

  if (!question) return null;

  const imgSrc = question.image_data || question.imageUrl || "";

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <button style={closeButtonStyle} onClick={onClose} title="关闭">
          &times;
        </button>

        <div style={titleStyle}>{question.title || "未命名错题"}</div>

        {question.content && <div style={contentStyle}>{question.content}</div>}

        {imgSrc && (
          <div style={imageWrapStyle}>
            <img src={imgSrc} alt={question.title || "题目图片"} style={imageStyle} />
          </div>
        )}

        {question.error_reason && (
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>
            错因：{question.error_reason}
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
    </div>
  );
}
