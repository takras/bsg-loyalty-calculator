// Cuts the three-quarter-view Cylon Raider render out of its black background for the app icon.
// Source: assets/source/raider-render.webp (right-hand raider). Output: assets/raider-render.png
// Run: node assets/raider-render.mjs
import sharp from "sharp";

const SRC = "assets/source/raider-render.webp";
const CROP = { left: 680, top: 140, width: 1220, height: 680 }; // the right-hand raider
const BLACK = 16; // background luminance threshold

const { data, info } = await sharp(SRC).extract(CROP).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const lum = (i) => 0.3 * data[i * 4] + 0.59 * data[i * 4 + 1] + 0.11 * data[i * 4 + 2];

// Background = near-black pixels connected to the border (dark hull panels inside the ship are kept).
const bg = new Uint8Array(W * H);
const stack = [];
for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
while (stack.length) {
  const i = stack.pop();
  if (bg[i] || lum(i) > BLACK) continue;
  bg[i] = 1;
  const x = i % W, y = (i - x) / W;
  if (x > 0) stack.push(i - 1);
  if (x < W - 1) stack.push(i + 1);
  if (y > 0) stack.push(i - W);
  if (y < H - 1) stack.push(i + W);
}

// Alpha from the mask, softened at the edge so the cut-out doesn't look jagged.
const mask = Buffer.from(Array.from(bg, (b) => (b ? 0 : 255)));
const soft = await sharp(mask, { raw: { width: W, height: H, channels: 1 } }).blur(1.2).extractChannel(0).raw().toBuffer();
for (let i = 0; i < W * H; i++) data[i * 4 + 3] = soft[i];

const out = await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
const info2 = await sharp(out).trim({ threshold: 1 }).png().toFile("assets/raider-render.png");
console.log("wrote assets/raider-render.png", info2.width, "x", info2.height);
