import { useEffect, useLayoutEffect, useRef } from "react";

export default function AutoTextarea({ value, onChange, className = "", ...props }) {
  const ref = useRef(null);

  const resize = () => {
    const element = ref.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  };

  useLayoutEffect(() => {
    resize();
  }, []);

  useEffect(() => {
    resize();
  }, [value]);

  return (
    <textarea
      {...props}
      ref={ref}
      rows={1}
      value={value}
      className={className}
      onChange={(event) => {
        onChange?.(event);
        resize();
      }}
    />
  );
}
