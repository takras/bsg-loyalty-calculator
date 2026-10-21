// Builds icons from images extracted from the Complete BSG Quick Reference v2.0
// (assets/reference/Battlestar_Galactica_CR2-0_CBSGQR_printer_friendly.pdf).
// Source: assets/source/qr/<name>.png, plus <name>.mask.png where the PDF stored a transparency mask.
// Output: src/assets/tokens/<name>.webp. Run: node assets/build-qr-icons.mjs
import sharp from "sharp";
import { existsSync, mkdirSync, readdirSync } from "node:fs";

const SRC = "assets/source/qr";
const OUT = "src/assets/tokens";
const MAX = 256; // longest side of the output icon
mkdirSync(OUT, { recursive: true });

/** Apply the PDF's soft mask (it can be stored at a different resolution than the image). */
async function withMask(name) {
  const { width, height } = await sharp(`${SRC}/${name}.png`).metadata();
  const rgb = await sharp(`${SRC}/${name}.png`).removeAlpha().raw().toBuffer();
  const mask = await sharp(`${SRC}/${name}.mask.png`).resize(width, height, { fit: "fill" }).extractChannel(0).raw().toBuffer();
  const out = Buffer.alloc(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    out[p * 4] = rgb[p * 3];
    out[p * 4 + 1] = rgb[p * 3 + 1];
    out[p * 4 + 2] = rgb[p * 3 + 2];
    out[p * 4 + 3] = mask[p];
  }
  return sharp(out, { raw: { width, height, channels: 4 } });
}

/** No mask: make the light page background (connected to the border) transparent. */
async function knockOutLight(name, threshold = 205) {
  const { data, info } = await sharp(`${SRC}/${name}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
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
    if (bg[i]) data[i * 4 + 3] = 0;
    else {
      // fade the anti-aliased rim
      const x = i % W;
      const edge = (x > 0 && bg[i - 1]) || (x < W - 1 && bg[i + 1]) || bg[i - W] || bg[i + W];
      const l = lum(i);
      if (edge && l > 150) data[i * 4 + 3] = Math.round(255 * Math.max(0, (threshold - l) / (threshold - 150)));
    }
  }
  return sharp(data, { raw: { width: W, height: H, channels: 4 } });
}

const names = readdirSync(SRC)
  .filter((f) => f.endsWith(".png") && !f.endsWith(".mask.png"))
  .map((f) => f.replace(/\.png$/, ""));

for (const name of names) {
  const img = existsSync(`${SRC}/${name}.mask.png`) ? await withMask(name) : await knockOutLight(name);
  const buf = await img.png().toBuffer();
  await sharp(buf)
    .trim({ threshold: 1 })
    .resize(MAX, MAX, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(`${OUT}/${name}.webp`);
  console.log("wrote", name);
}
