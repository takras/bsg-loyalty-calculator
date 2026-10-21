// Renders the app icon / splash sources for `npx @capacitor/assets generate`.
// Crest artwork in the style of a ship insignia (khaki/cream, segmented ring) with a flat, simplified
// Cylon Raider (three-quarter view) at its centre, its wings overlapping the ring. Deliberately not the trademarked Battlestar Galactica logo or BSG-75 crest.
// Run: node assets/emblem.mjs   (or `npm run icons`, which also regenerates all native sizes)
import sharp from "sharp";
import { readFileSync } from "node:fs";

// Cylon Raider, three-quarter view, simplified to the crest's flat style (see assets/raider-flat.mjs,
// built from the render cut-out made by assets/raider-render.mjs).
// ICON_RAIDER / ICON_OUT let you render a preview with another raider image into another folder.
const raiderFile = process.env.ICON_RAIDER ?? "assets/raider-flat.png";
const OUT_DIR = process.env.ICON_OUT ?? "assets";
const raiderMeta = await sharp(raiderFile).metadata();
const raiderData = `data:image/png;base64,${readFileSync(raiderFile).toString("base64")}`;
const RAIDER_RATIO = raiderMeta.width / raiderMeta.height;

const defs = `
  <defs>
    <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.6">
      <stop offset="0" stop-color="#3a382d"/>
      <stop offset="1" stop-color="#22211b" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.55"/>
    </filter>
  </defs>`;

// Crest colours (khaki / cream insignia style)
const OLIVE = "#6f6b58";
const OLIVE_DARK = "#4a4739";
const CREAM = "#f2dbb2";

/** Point on a circle, angle in degrees (0 = up, clockwise). */
const pt = (cx, cy, r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

/** Annular sector path between radii r1 < r2 from angle a to b. */
const sector = (cx, cy, r1, r2, a, b) => {
  const [x1, y1] = pt(cx, cy, r2, a), [x2, y2] = pt(cx, cy, r2, b);
  const [x3, y3] = pt(cx, cy, r1, b), [x4, y4] = pt(cx, cy, r1, a);
  const large = b - a > 180 ? 1 : 0;
  return `M${x1} ${y1} A${r2} ${r2} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${r1} ${r1} 0 ${large} 0 ${x4} ${y4} Z`;
};

/**
 * Original crest: cream disc, segmented olive outer band, cream band with tick marks,
 * dark centre disc with a Cylon Raider (nose up) in cream, wings overlapping the ring. `d` = diameter.
 */
const crest = (cx, cy, d) => {
  const R = d / 2;
  const outer = R, band = R * 0.8, inner = R * 0.64, core = R * 0.6;
  const segments = 16, gap = 3.2; // degrees of cream between olive segments
  const segs = Array.from({ length: segments }, (_, i) => {
    const a = (360 / segments) * i + gap / 2 - 360 / segments / 2;
    return `<path d="${sector(cx, cy, band, outer * 0.985, a, a + 360 / segments - gap)}"/>`;
  }).join("");
  // tick marks around the cream band, leaving the bottom clear for two dashes
  const ticks = Array.from({ length: 48 }, (_, i) => {
    const deg = (360 / 48) * i;
    if (deg > 140 && deg < 220) return "";
    const [x1, y1] = pt(cx, cy, inner + (band - inner) * 0.28, deg);
    const [x2, y2] = pt(cx, cy, band - (band - inner) * 0.28, deg);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }).join("");
  const dash = (deg1, deg2) => {
    const r = (inner + band) / 2;
    const [x1, y1] = pt(cx, cy, r, deg1), [x2, y2] = pt(cx, cy, r, deg2);
    return `<path d="M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}"/>`;
  };
  // raider size: wide enough that the wing tips reach into the cream tick band on both sides
  const rw = band * 2.12, rh = rw / RAIDER_RATIO;
  const rx = cx - rw / 2, ry = cy - rh / 2 + R * 0.03;
  return `
    <circle cx="${cx}" cy="${cy}" r="${outer}" fill="${CREAM}"/>
    <g fill="${OLIVE}">${segs}</g>
    <circle cx="${cx}" cy="${cy}" r="${inner}" fill="${OLIVE_DARK}"/>
    <g stroke="${OLIVE}" stroke-width="${R * 0.022}" stroke-linecap="round">${ticks}</g>
    <g fill="none" stroke="${OLIVE}" stroke-width="${R * 0.03}" stroke-linecap="round">${dash(150, 172)}${dash(188, 210)}</g>
    <circle cx="${cx}" cy="${cy}" r="${core}" fill="none" stroke="${CREAM}" stroke-width="${R * 0.012}" opacity="0.55"/>
    <image href="${raiderData}" x="${rx}" y="${ry}" width="${rw}" height="${rh}" filter="url(#shadow)"/>`;
};

/** Plain dark backdrop that matches the crest palette. */
const backdrop = (s) => `
  <rect width="${s}" height="${s}" fill="#22211b"/>
  <circle cx="${s / 2}" cy="${s / 2}" r="${s * 0.5}" fill="url(#vignette)"/>`;

const svg = (s, body) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">${defs}${body}</svg>`);

const S = 1024;
const out = (name, buf) => sharp(buf).png().toFile(`${OUT_DIR}/${name}`).then(() => console.log("wrote", name));

await out("icon-only.png", svg(S, backdrop(S) + crest(S / 2, S / 2, S * 0.9)));
// Android adaptive icon: launcher masks crop to their own shape; keep the crest in the ~66% safe zone.
await out("icon-foreground.png", svg(S, crest(S / 2, S / 2, S * 0.64)));
await out("icon-background.png", svg(S, backdrop(S)));
const L = 2732;
for (const name of ["splash.png", "splash-dark.png"]) {
  await out(name, svg(L, backdrop(L) + crest(L / 2, L / 2, L * 0.34)));
}
