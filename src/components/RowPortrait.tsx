import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { Character } from "../data/characters";
import { Portrait } from "./CharacterTile";

/**
 * Portrait for list rows (Titles players, Execution picker): 40px wide normally, but when a row's text column beside
 * it grows (wrapped name or buttons) the portraits grow to that height (up to a limit), so they fill the row with the
 * same top/bottom margin. Every row reports its height and all portraits in the list use the tallest, so the rows
 * stay consistent. The text column is the portrait's next sibling.
 */
export function RowPortrait({ c, size, onHeight }: { c: Character; size: number; onHeight: (h: number) => void }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const main = ref.current?.nextElementSibling;
    if (!main) return;
    const measure = () => onHeight(main.getBoundingClientRect().height);
    measure(); // before first paint, so the row doesn't flash at the small size
    const ro = new ResizeObserver(measure);
    ro.observe(main);
    return () => ro.disconnect();
  }, [onHeight]);
  return (
    <span ref={ref} className="row-portrait">
      <Portrait c={c} size={size} />
    </span>
  );
}

/** Shared portrait width for a list of rows, from the tallest row's text column. */
export function useRowPortraitSize() {
  const heights = useRef(new Map<number, number>());
  const callbacks = useRef(new Map<number, (h: number) => void>());
  const [tallest, setTallest] = useState(0);
  // One stable callback per row, so the rows' ResizeObservers aren't recreated on every render.
  const onHeight = useCallback((key: number) => {
    let cb = callbacks.current.get(key);
    if (!cb) {
      cb = (h: number) => {
        heights.current.set(key, h);
        setTallest(Math.max(0, ...heights.current.values()));
      };
      callbacks.current.set(key, cb);
    }
    return cb;
  }, []);
  // Standee art is 174×256. Capped at 57px wide (a name plus two rows of buttons): growing further would squeeze
  // the text beside it.
  const size = Math.min(57, Math.max(40, Math.floor((tallest * 174) / 256)));
  return { size, onHeight };
}
