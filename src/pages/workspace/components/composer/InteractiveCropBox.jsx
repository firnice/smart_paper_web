import { useRef, useState } from "react";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clampRect(rect, minSize) {
  const x = clamp(rect.x, 0, 100 - minSize);
  const y = clamp(rect.y, 0, 100 - minSize);
  const w = clamp(rect.w, minSize, 100 - x);
  const h = clamp(rect.h, minSize, 100 - y);
  return { x, y, w, h };
}

export default function InteractiveCropBox({ value, onChange, color = "blue", minSize = 10 }) {
  const stageRef = useRef(null);
  const [dragState, setDragState] = useState(null);

  const palette = color === "purple"
    ? {
      border: "border-purple-500",
      fill: "bg-purple-500/20",
      dot: "bg-purple-500",
    }
    : {
      border: "border-blue-500",
      fill: "bg-blue-500/20",
      dot: "bg-blue-500",
    };

  const handlePointerDown = (event, mode) => {
    event.preventDefault();
    event.stopPropagation();
    stageRef.current?.setPointerCapture?.(event.pointerId);
    setDragState({
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startRect: value,
      pointerId: event.pointerId,
    });
  };

  const handlePointerMove = (event) => {
    if (!dragState || !stageRef.current) return;
    const bounds = stageRef.current.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const dx = ((event.clientX - dragState.startX) / bounds.width) * 100;
    const dy = ((event.clientY - dragState.startY) / bounds.height) * 100;

    if (dragState.mode === "move") {
      const nextRect = clampRect({
        ...dragState.startRect,
        x: dragState.startRect.x + dx,
        y: dragState.startRect.y + dy,
      }, minSize);
      onChange(nextRect);
      return;
    }

    const nextRect = clampRect({
      ...dragState.startRect,
      w: dragState.startRect.w + dx,
      h: dragState.startRect.h + dy,
    }, minSize);
    onChange(nextRect);
  };

  const handlePointerUp = (event) => {
    if (!dragState) return;
    if (dragState.pointerId === event.pointerId) {
      stageRef.current?.releasePointerCapture?.(event.pointerId);
      setDragState(null);
    }
  };

  return (
    <div
      ref={stageRef}
      className="absolute inset-0 touch-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div
        className={`absolute cursor-move border-2 ${palette.border} ${palette.fill}`}
        style={{
          left: `${value.x}%`,
          top: `${value.y}%`,
          width: `${value.w}%`,
          height: `${value.h}%`,
          boxShadow: "0 0 0 9999px rgba(15,23,42,0.6)",
        }}
        onPointerDown={(event) => handlePointerDown(event, "move")}
      >
        {["-top-1.5 -left-1.5", "-top-1.5 -right-1.5", "-bottom-1.5 -left-1.5"].map((position) => (
          <div
            key={position}
            className={`absolute ${position} h-3 w-3 rounded-full border-2 bg-white ${palette.border}`}
          />
        ))}
        <button
          type="button"
          className={`absolute -right-2 -bottom-2 z-10 flex h-5 w-5 cursor-nwse-resize items-center justify-center rounded-full border-2 bg-white ${palette.border}`}
          onPointerDown={(event) => handlePointerDown(event, "resize")}
        >
          <div className={`h-1.5 w-1.5 rounded-full ${palette.dot}`} />
        </button>
      </div>
    </div>
  );
}
