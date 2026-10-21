// Simplified, flat version of the raider render in the crest's insignia style: cream body,
// olive panels, dark outline, red eye. Input: assets/raider-render.png (see raider-render.mjs).
// Output: assets/raider-flat.png.  Run: node assets/raider-flat.mjs
import sharp from "sharp";

const SRC = "assets/raider-render.png";
const OUT = "assets/raider-flat.png";
const CREAM = [242, 219, 178];
const OLIVE = [111, 107, 88];
const DARK = [74, 71, 57];
const PAD = 40; // room for the outline
const OUTLINE = 9; // outline width in px
const DARK_PANEL = 52; // luminance below which a panel counts as a dark (olive) panel

const { data, info } = await sharp(SRC)
  .extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, N = W * H;

// helpers: blur a 1-channel buffer (separate pipelines; sharp keeps one blur per chain and
// returns 3 channels for 1-channel input, so take channel 0 back out)
const blur = (buf, sigma) =>
  sharp(buf, { raw: { width: W, height: H, channels: 1 } }).blur(sigma).extractChannel(0).raw().toBuffer();
const step = (buf, t) => Buffer.from(buf.map((v) => (v >= t ? 255 : 0)));

const alpha = Buffer.alloc(N), dark = Buffer.alloc(N), eye = Buffer.alloc(N);
for (let p = 0; p < N; p++) {
  const r = data[p * 4], g = data[p * 4 + 1], b = data[p * 4 + 2], a = data[p * 4 + 3];
  alpha[p] = a > 128 ? 255 : 0;
  dark[p] = a > 128 && 0.3 * r + 0.59 * g + 0.11 * b < DARK_PANEL ? 255 : 0;
  eye[p] = a > 128 && r > 150 && g < 90 && b < 90 ? 255 : 0;
}

// Smooth shapes: silhouette lightly, the dark-panel map strongly (turns the metal texture into a
// few clean blocks); panels hugging the edge are dropped so the outline stays clean.
const body = await blur(step(await blur(alpha, 2.5), 128), 0.7);
const inner = step(await blur(step(body, 128), 6), 250); // body shrunk a little
const darkInner = Buffer.from(dark.map((v, i) => (inner[i] ? v : 0)));
const panels = await blur(step(await blur(darkInner, 7), 150), 0.7);
const rim = await blur(step(await blur(step(body, 128), OUTLINE / 2), 30), 0.7);
const eyeGlow = await blur(step(await blur(eye, 4), 12), 1.2); // grown a little so it reads at icon size

const out = Buffer.alloc(N * 4);
for (let p = 0; p < N; p++) {
  const inside = body[p] / 255, shade = panels[p] / 255, red = eyeGlow[p] / 255;
  for (let c = 0; c < 3; c++) {
    // dark rim → cream body with olive dark panels, then the red eye on top
    let v = DARK[c] * (1 - inside) + (CREAM[c] * (1 - shade) + OLIVE[c] * shade) * inside;
    v = v * (1 - red) + [255, 58, 44][c] * red;
    out[p * 4 + c] = Math.round(v);
  }
  out[p * 4 + 3] = Math.round(Math.max(inside, rim[p] / 255) * 255);
}

const res = await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
const done = await sharp(res).trim({ threshold: 1 }).png().toFile(OUT);
console.log("wrote", OUT, done.width, "x", done.height);
