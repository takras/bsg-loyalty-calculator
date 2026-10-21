// Draws the Pegasus combat icon in the same glowing style as the board art cut by extract-ship-icons.mjs
// (the board has no Pegasus). Traced from a blueprint-style top-down image: the ship's silhouette and its
// thick outline strokes are kept, the thin interior detail lines are dropped and replaced by the striped fill.
// Faces right, like the board icons.
// Run: node assets/pegasus-icon.mjs  → writes src/assets/ships/pegasus.webp
import sharp from "sharp";

const SRC = "assets/source/pegasus-blueprint.webp";
const OUT = "src/assets/ships/pegasus.webp";
const W = 147;
const H = 82;
const S = 4; // work at 4× and downsample for smooth edges
const CW = W * S;
const CH = H * S;


// Square min/max filters (separable) for erosion/dilation, on a w×h 0/1 mask.
function morph(src, r, max, w = CW, h = CH) {
  const tmp = new Uint8Array(src.length);
  const out = new Uint8Array(src.length);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = max ? 0 : 1;
      for (let k = -r; k <= r; k++) {
        const s = src[y * w + Math.min(w - 1, Math.max(0, x + k))];
        v = max ? Math.max(v, s) : Math.min(v, s);
      }
      tmp[y * w + x] = v;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = max ? 0 : 1;
      for (let k = -r; k <= r; k++) {
        const s = tmp[Math.min(h - 1, Math.max(0, y + k)) * w + x];
        v = max ? Math.max(v, s) : Math.min(v, s);
      }
      out[y * w + x] = v;
    }
  return out;
}
const dilate = (m, r, w, h) => morph(m, r, true, w, h);
const erode = (m, r, w, h) => morph(m, r, false, w, h);

// Find the outlines at full resolution, where they're ~14px wide and the interior detail lines at most ~8px:
// an opening drops the thin lines, then only the large connected network (the outlines) is kept, which
// removes leftover interior fragments. Background is G≈55, the ship's fill G≈99, outlines G≈180+.
const { data: g, info } = await sharp(SRC).removeAlpha().extractChannel(1).raw().toBuffer({ resolveWithObject: true });
const FW = info.width;
const FH = info.height;
const thick = dilate(erode(Uint8Array.from(g, (v) => (v > 150 ? 1 : 0)), 4, FW, FH), 4, FW, FH);
const label = new Int32Array(FW * FH);
const sizes = [0];
for (let i = 0; i < FW * FH; i++) {
  if (!thick[i] || label[i]) continue;
  const id = sizes.length;
  let n = 0;
  const stack = [i];
  label[i] = id;
  while (stack.length) {
    const p = stack.pop();
    n++;
    const x = p % FW;
    const y = (p / FW) | 0;
    for (const q of [x > 0 ? p - 1 : -1, x < FW - 1 ? p + 1 : -1, y > 0 ? p - FW : -1, y < FH - 1 ? p + FW : -1])
      if (q >= 0 && thick[q] && !label[q]) {
        label[q] = id;
        stack.push(q);
      }
  }
  sizes.push(n);
}
const fullShip = Buffer.alloc(FW * FH);
const fullOutline = Buffer.alloc(FW * FH);
for (let i = 0; i < FW * FH; i++) {
  fullShip[i] = g[i] > 75 ? 255 : 0;
  fullOutline[i] = thick[i] && sizes[label[i]] >= 20000 ? 255 : 0;
}

// Scale both masks onto the 4× canvas.
const sw = (W - 4) * S;
const sh = Math.round((FH / FW) * sw);
const ox = Math.round((CW - sw) / 2);
const oy = Math.round((CH - sh) / 2);
const toCanvas = async (full) => {
  const small = await sharp(full, { raw: { width: FW, height: FH, channels: 1 } }).resize(sw, sh, { kernel: "lanczos3" }).extractChannel(0).raw().toBuffer();
  const m = new Uint8Array(CW * CH);
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) m[(y + oy) * CW + x + ox] = small[y * sw + x] > 110 ? 1 : 0;
  return m;
};
const ship = await toCanvas(fullShip);
const traced = await toCanvas(fullOutline);

// Box blur ×3 ≈ gaussian; returns 0–1 floats.
function blur(m, r) {
  let a = Float32Array.from(m);
  for (let pass = 0; pass < 3; pass++) {
    const b = new Float32Array(a.length);
    for (let y = 0; y < CH; y++)
      for (let x = 0; x < CW; x++) {
        let s = 0;
        for (let k = -r; k <= r; k++) s += a[y * CW + Math.min(CW - 1, Math.max(0, x + k))];
        b[y * CW + x] = s / (2 * r + 1);
      }
    const c = new Float32Array(a.length);
    for (let y = 0; y < CH; y++)
      for (let x = 0; x < CW; x++) {
        let s = 0;
        for (let k = -r; k <= r; k++) s += b[Math.min(CH - 1, Math.max(0, y + k)) * CW + x];
        c[y * CW + x] = s / (2 * r + 1);
      }
    a = c;
  }
  return a;
}

// Clean the silhouette and thicken the outlines to the board-art weight.
const body = erode(dilate(ship, 1), 1);
const outline = dilate(traced, 2);
const halo = blur(dilate(body, 12), 5);
const glow = blur(outline, 2);

const rgba = Buffer.alloc(CW * CH * 4);
const over = (i, [r, g, b], a) => {
  const p = i * 4;
  const da = rgba[p + 3] / 255;
  const oa = a + da * (1 - a);
  if (oa <= 0) return;
  rgba[p] = Math.round((r * a + rgba[p] * da * (1 - a)) / oa);
  rgba[p + 1] = Math.round((g * a + rgba[p + 1] * da * (1 - a)) / oa);
  rgba[p + 2] = Math.round((b * a + rgba[p + 2] * da * (1 - a)) / oa);
  rgba[p + 3] = Math.round(oa * 255);
};
for (let y = 0; y < CH; y++)
  for (let x = 0; x < CW; x++) {
    const i = y * CW + x;
    over(i, [14, 43, 79], Math.min(1, halo[i] * 1.6)); // dark navy halo
    if (body[i]) over(i, y % 16 < 8 ? [59, 122, 171] : [43, 98, 144], 1); // interlaced fill
    over(i, [143, 203, 245], Math.min(1, glow[i] * 0.7)); // soft glow along the outlines
    if (outline[i]) over(i, [180, 222, 252], 1); // outline
  }

await sharp(rgba, { raw: { width: CW, height: CH, channels: 4 } })
  .resize(W, H, { kernel: "lanczos3" })
  .webp({ quality: 92, alphaQuality: 100 })
  .toFile(OUT);
console.log(`wrote ${OUT}`);
