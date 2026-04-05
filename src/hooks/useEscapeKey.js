import { useEffect, useRef } from "react";

const escapeKeyStack = [];

export default function useEscapeKey(enabled, onEscape) {
  const tokenRef = useRef(Symbol("escape-key-handler"));
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!enabled) return undefined;

    const token = tokenRef.current;
    escapeKeyStack.push(token);

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (escapeKeyStack[escapeKeyStack.length - 1] !== token) return;

      event.preventDefault();
      onEscapeRef.current?.(event);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      const stackIndex = escapeKeyStack.lastIndexOf(token);
      if (stackIndex >= 0) {
        escapeKeyStack.splice(stackIndex, 1);
      }
    };
  }, [enabled]);
}
