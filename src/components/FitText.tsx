import { useLayoutEffect, useRef } from "react";

/**
 * Single-line text that shrinks its font until it fits its container's width.
 * Starts from the CSS font-size and steps down to `min` px; re-fits when the container resizes.
 */
export function FitText({ text, className, min = 7 }: { text: string; className?: string; min?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = ""; // back to the stylesheet size
      let size = parseFloat(getComputedStyle(el).fontSize);
      while (el.scrollWidth > el.clientWidth + 0.5 && size > min) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    // Web fonts change the text width once loaded.
    document.fonts?.ready.then(fit).catch(() => {});
    return () => ro.disconnect();
  }, [text, min]);

  return (
    <span ref={ref} className={className} title={text}>
      {text}
    </span>
  );
}
