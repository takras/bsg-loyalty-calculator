// Small game icons taken from the rulebook (assets/extract-activation-icons.mjs).
const files = import.meta.glob("../assets/icons/*.webp", { eager: true, query: "?url", import: "default" }) as Record<
  string,
  string
>;
const iconById: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split("/").pop()!.replace(/\.[^.]+$/, ""), url]),
);

export type GameIconId = "act-raiders" | "act-launch" | "act-heavy" | "act-basestars" | "skill-check-ability";

export function GameIcon({ id, alt = "", className = "" }: { id: GameIconId; alt?: string; className?: string }) {
  return <img className={`game-icon ${id} ${className}`} src={iconById[id]} alt={alt} draggable={false} />;
}
