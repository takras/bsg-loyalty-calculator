// Cuts the Cylon activation icons out of the rulebook reference (assets/source/icons/rulebook-cylon-ships.png)
// and prepares the other small icons. Run: node assets/extract-activation-icons.mjs
import sharp from "sharp";

const OUT = "src/assets/icons";
const SCALE = 4;

/** Make light pixels connected to the border transparent (the page background). */
async function knockOut(input, { left, top, width, height }, out, threshold = 200, keepLargest = false) {
  const { data, info } = await sharp(input)
    .extract({ left, top, width, height })
    .resize(width * SCALE, height * SCALE, { kernel: "lanczos3" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const light = (i) => (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3 > threshold;
  const bg = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const i = stack.pop();
    if (bg[i] || !light(i)) continue;
    bg[i] = 1;
    const x = i % W, y = (i - x) / W;
    if (x > 0) stack.push(i - 1);
    if (x < W - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - W);
    if (y < H - 1) stack.push(i + W);
  }
  if (keepLargest) {
    // drop specks: everything not in the largest foreground region becomes background
    const label = new Int32Array(W * H).fill(-1);
    let best = -1, bestSize = 0;
    for (let s0 = 0; s0 < W * H; s0++) {
      if (bg[s0] || label[s0] >= 0) continue;
      let size = 0;
      const st = [s0];
      while (st.length) {
        const i = st.pop();
        if (bg[i] || label[i] >= 0) continue;
        label[i] = s0;
        size++;
        const x = i % W, y = (i - x) / W;
        if (x > 0) st.push(i - 1);
        if (x < W - 1) st.push(i + 1);
        if (y > 0) st.push(i - W);
        if (y < H - 1) st.push(i + W);
      }
      if (size > bestSize) { bestSize = size; best = s0; }
    }
    for (let i = 0; i < W * H; i++) if (!bg[i] && label[i] !== best) bg[i] = 1;
  }
  for (let i = 0; i < W * H; i++) {
    if (bg[i]) data[i * 4 + 3] = 0;
    else {
      // soften the anti-aliased rim: partially light edge pixels become partially transparent
      const l = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
      const touchesBg = (i % W > 0 && bg[i - 1]) || (i % W < W - 1 && bg[i + 1]) || bg[i - W] || bg[i + W];
      if (touchesBg && l > 90) data[i * 4 + 3] = Math.round(255 * (1 - (l - 90) / 165));
    }
  }
  await sharp(data, { raw: { width: W, height: H, channels: 4 } }).trim().webp({ quality: 92, alphaQuality: 100 }).toFile(`${OUT}/${out}.webp`);
  console.log("wrote", out);
}

const src = "assets/source/icons/rulebook-cylon-ships.png";
await knockOut(src, { left: 33, top: 32, width: 65, height: 31 }, "act-raiders");
await knockOut(src, { left: 33, top: 273, width: 65, height: 31 }, "act-launch");
await knockOut(src, { left: 33, top: 328, width: 65, height: 28 }, "act-heavy");
await knockOut(src, { left: 33, top: 548, width: 65, height: 34 }, "act-basestars");
await knockOut("assets/source/icons/skill-check-ability.png", { left: 30, top: 16, width: 60, height: 62 }, "skill-check-ability");

// Centurion helmet for the combat list (white page background knocked out)
{
  const { width, height } = await sharp("assets/source/icons/centurion.png").metadata();
  await knockOut("assets/source/icons/centurion.png", { left: 0, top: 0, width, height }, "../ships/centurion", 225, true);
}
