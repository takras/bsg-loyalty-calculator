import { ShipIcon, type ShipId } from "./ShipIcon";
import { tokenUrl } from "./TokenImg";

// Ship art cut from the game board (assets/extract-ship-icons.mjs). Units without board art fall
// back to the SVG silhouettes, drawn in the same glowing board style.
const files = import.meta.glob("../assets/ships/*.{webp,png}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const artById: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split("/").pop()!.replace(/\.[^.]+$/, ""), url]),
);

// Board icons face right; the SVG silhouettes face up, so turn ships (not figures) to match.
const UPRIGHT: ShipId[] = ["centurion", "occupation", "human", "nuke"];

export function ShipArt({ ship, title }: { ship: ShipId; title: string }) {
  // Scar is a special raider: raider art, tinted red in CSS.
  // Quick-reference art fills the gaps the board doesn't cover.
  const fromTokens: Partial<Record<ShipId, string>> = { civilian: "civilian-ship", occupation: "occupation-forces" };
  const src = artById[ship] ?? (ship === "scar" ? artById.raider : undefined) ?? tokenUrl[fromTokens[ship] ?? ""];
  return (
    <span className={`ship-art ${ship}`} title={title}>
      {src ? (
        <img src={src} alt={title} draggable={false} />
      ) : (
        <span className={`ship-art-svg ${UPRIGHT.includes(ship) ? "" : "turn"}`}>
          <ShipIcon ship={ship} size={56} title={title} />
        </span>
      )}
    </span>
  );
}
