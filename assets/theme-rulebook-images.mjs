// Removes the light "page" backgrounds baked into some rulebook images so they sit on the app's
// dark theme. Reads the originals from ../BSGRulebook/images and writes PNGs to public/rulebook/images.
// Run: node assets/theme-rulebook-images.mjs
import sharp from "sharp";

const SRC = "../BSGRulebook/images";
const OUT = "public/rulebook/images";

/**
 * Flood-fills light pixels connected to the image border and makes them transparent.
 * `recolorDarkText` turns dark, unsaturated pixels (captions) light so they stay readable.
 */
async function knockOut(file, out, { threshold = 200, recolorDarkText = false, invert = false } = {}) {
  const { data, info } = await sharp(`${SRC}/${file}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const lum = (i) => (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
  const bg = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const i = stack.pop();
    if (bg[i] || lum(i) < threshold) continue;
    bg[i] = 1;
    const x = i % W, y = (i - x) / W;
    if (x > 0) stack.push(i - 1);
    if (x < W - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - W);
    if (y < H - 1) stack.push(i + W);
  }
  for (let i = 0; i < W * H; i++) {
    const p = i * 4;
    if (bg[i]) {
      data[p + 3] = 0;
      continue;
    }
    // soften the anti-aliased rim next to the removed background
    const x = i % W;
    const edge = (x > 0 && bg[i - 1]) || (x < W - 1 && bg[i + 1]) || bg[i - W] || bg[i + W];
    if (edge) {
      const l = lum(i);
      if (l > 120) data[p + 3] = Math.round(data[p + 3] * Math.max(0, 1 - (l - 120) / (threshold - 120 + 1)));
    }
    if (recolorDarkText) {
      const r = data[p], g = data[p + 1], b = data[p + 2];
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (sat < 40 && lum(i) < 170) {
        // grey caption text → light grey with alpha from its darkness
        const a = Math.min(1, (200 - lum(i)) / 140);
        data[p] = 225; data[p + 1] = 232; data[p + 2] = 240;
        data[p + 3] = Math.round(255 * a);
      }
    }
    if (invert) {
      data[p] = 255 - data[p]; data[p + 1] = 255 - data[p + 1]; data[p + 2] = 255 - data[p + 2];
    }
  }
  await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toFile(`${OUT}/${out}`);
  console.log("wrote", out);
}

await knockOut("loyalty.png", "loyalty.png", { threshold: 200 });
await knockOut("skill.png", "skill.png", { threshold: 200 });
await knockOut("supercrisis.png", "supercrisis.png", { threshold: 200 });
await knockOut("final_battle.png", "final_battle.png", { threshold: 235 });
await knockOut("succession.jpg", "succession.png", { threshold: 235 });
await knockOut("trauma_tokens.png", "trauma_tokens.png", { threshold: 190, recolorDarkText: true });
await knockOut("skillcheckability.png", "skillcheckability.png", { threshold: 190, invert: true });
