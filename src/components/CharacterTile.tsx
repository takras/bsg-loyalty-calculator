import { plateName, TYPE_LABEL, type Character } from "../data/characters";
import { FitText } from "./FitText";

// Standee images live in src/assets/characters/<id>.<ext>; only files that exist get bundled.
const files = import.meta.glob("../assets/characters/*.{webp,png,jpg,jpeg}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const imageById: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split("/").pop()!.replace(/\.[^.]+$/, ""), url]),
);

// Standee art is 174×256 with a name plate in the bottom ~15%.
const RATIO = 256 / 174;

const initialsOf = (c: Character) =>
  c.name
    .replace(/“.*?”/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

/** Character standee. With `label`, the short name is printed in the standee's name plate. */
export function Portrait({ c, size = 72, label = false }: { c: Character; size?: number; label?: boolean }) {
  const src = imageById[c.id];
  return (
    <span
      className={`portrait type-${c.type} ${src ? "has-img" : ""}`}
      style={{ width: size, height: Math.round(size * RATIO) }}
    >
      {src ? (
        <img src={src} alt="" loading="lazy" draggable={false} />
      ) : (
        <span className="portrait-initials" style={{ fontSize: size * 0.34 }}>
          {initialsOf(c)}
        </span>
      )}
      {label && <FitText className="plate" text={plateName(c)} />}
    </span>
  );
}

export function CharacterTile({
  c,
  selected,
  disabled,
  warn,
  note,
  faded,
  onClick,
}: {
  c: Character;
  selected?: boolean;
  disabled?: boolean;
  /** Shown under the tile, e.g. a rule this pick conflicts with */
  warn?: string;
  /** Neutral extra line, e.g. which expansion an out-of-play character comes from */
  note?: string;
  /** Dimmed but still selectable, e.g. the other version of a character that's already chosen */
  faded?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`char-tile ${selected ? "selected" : ""} ${warn ? "warned" : ""} ${faded ? "faded" : ""}`}
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`${c.name}, ${TYPE_LABEL[c.type]}${c.version ? `, ${c.version} version` : ""}`}
    >
      <Portrait c={c} size={96} label />
      <span className={`char-type type-${c.type}`}>
        {TYPE_LABEL[c.type].replace(" Leader", "")}
        {c.version && <em> · {c.version === "original" ? "Orig." : "Alt."}</em>}
      </span>
      {note && <span className="char-note">{note}</span>}
      {warn && <span className="char-reason">{warn}</span>}
    </button>
  );
}
