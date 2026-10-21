// Cuts the ship icons out of the board image (assets/source/board.png) with a transparent background.
// Run: node assets/extract-ship-icons.mjs  → writes src/assets/ships/<id>.webp
import sharp from "sharp";
import { mkdirSync } from "node:fs";

sharp.cache(false);
const OUT = "src/assets/ships";
mkdirSync(OUT, { recursive: true });

// Icon centres on the 7350×3675 board image (left-hand Cylon/human combat table).
const ICONS = {
  raider: [1054, 1034],
  heavy: [1054, 1156],
  basestar: [1054, 1294],
  nuke: [1054, 1462],
  viper: [1054, 2118],
  viper7: [1054, 2238],
  assault: [1054, 2376],
  galactica: [1054, 2522],
};
const W = 260, H = 150, OUTLINE = 6;

const board = sharp("assets/source/board.png", { limitInputPixels: false });

for (const [id, [cx, cy]] of Object.entries(ICONS)) {
  const { data, info } = await board
    .clone()
    .extract({ left: cx - W / 2, top: cy - H / 2, width: W, height: H })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const px = (x, y) => (y * W + x) * 4;
  const lum = (i) => 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];

  // 1. flood fill the light icon body: the largest bright region touching the centre area
  //    (stars are bright too, but tiny)
  const flood = (sx, sy, into) => {
    let n = 0;
    const stack = [[sx, sy]];
    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= W || y >= H || into[y * W + x]) continue;
      if (lum(px(x, y)) < 105) continue;
      into[y * W + x] = 1;
      n++;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    return n;
  };
  const seen = new Uint8Array(W * H);
  let body = new Uint8Array(W * H), bestSize = 0;
  for (let y = H / 2 - 25; y < H / 2 + 25; y += 2)
    for (let x = W / 2 - 40; x < W / 2 + 40; x += 2) {
      if (seen[y * W + x] || lum(px(x, y)) < 105) continue;
      const comp = new Uint8Array(W * H);
      const size = flood(x, y, comp);
      for (let i = 0; i < comp.length; i++) if (comp[i]) seen[i] = 1;
      if (size > bestSize) { bestSize = size; body = comp; }
    }
  // fill enclosed holes (dark details inside the body) by flooding the outside instead
  const outside = new Uint8Array(W * H);
  const s2 = [];
  for (let x = 0; x < W; x++) s2.push([x, 0], [x, H - 1]);
  for (let y = 0; y < H; y++) s2.push([0, y], [W - 1, y]);
  while (s2.length) {
    const [x, y] = s2.pop();
    if (x < 0 || y < 0 || x >= W || y >= H || outside[y * W + x] || body[y * W + x]) continue;
    outside[y * W + x] = 1;
    s2.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  // 2. grow by the outline width to keep the dark border
  const dist = new Float32Array(W * H).fill(1e9);
  for (let i = 0; i < W * H; i++) if (!outside[i]) dist[i] = 0;
  for (let pass = 0; pass < 2; pass++)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            dist[i] = Math.min(dist[i], dist[ny * W + nx] + Math.hypot(dx, dy));
          }
      }
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const a = Math.max(0, Math.min(1, OUTLINE + 1 - dist[i]));
      data[i * 4 + 3] = Math.round(a * 255);
      if (a > 0) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    }
  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(`${OUT}/${id}.webp`);
  console.log("wrote", id, maxX - minX + 1, "x", maxY - minY + 1);
}
