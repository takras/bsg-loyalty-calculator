// Token and icon art from the Complete BSG Quick Reference v2.0 (assets/build-qr-icons.mjs).
const files = import.meta.glob("../assets/tokens/*.webp", { eager: true, query: "?url", import: "default" }) as Record<
  string,
  string
>;
export const tokenUrl: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split("/").pop()!.replace(/\.[^.]+$/, ""), url]),
);

export function TokenImg({ id, alt = "", className = "" }: { id: string; alt?: string; className?: string }) {
  const src = tokenUrl[id];
  if (!src) return null;
  return <img className={`token-img ${className}`} src={src} alt={alt} loading="lazy" draggable={false} />;
}
