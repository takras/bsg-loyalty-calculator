// Web icons from the app icon crest: favicon.ico (16/32/48), PNG favicons, Apple touch icon and
// manifest icons, written to public/. Run after assets/emblem.mjs (`npm run icons` does both).
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const OUT = "public";
// The Android foreground layer is the crest alone on transparency – ideal for browser tabs.
const crest = await sharp("assets/icon-foreground.png").trim({ threshold: 1 }).png().toBuffer();
// Full-bleed square (crest on its dark background) for places that don't do transparency well.
const square = "assets/icon-only.png";

const png = (src, size, pad = 0) =>
  sharp(src)
    .resize(size - pad * 2, size - pad * 2, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

/** ICO container holding PNG images (supported by all current browsers). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // width
    e.writeUInt8(size >= 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const sizes = [16, 32, 48];
writeFileSync(`${OUT}/favicon.ico`, ico(await Promise.all(sizes.map(async (size) => ({ size, data: await png(crest, size) })))));
writeFileSync(`${OUT}/favicon-32.png`, await png(crest, 32));
// iOS home screen: no transparency, the system rounds the corners itself
writeFileSync(`${OUT}/apple-touch-icon.png`, await sharp(square).resize(180, 180).png().toBuffer());
// Web app manifest icons: "any" uses the transparent crest, "maskable" the full-bleed square
writeFileSync(`${OUT}/icon-192.png`, await png(crest, 192, 8));
writeFileSync(`${OUT}/icon-512.png`, await png(crest, 512, 20));
writeFileSync(`${OUT}/icon-maskable-512.png`, await sharp(square).resize(512, 512).png().toBuffer());
console.log("wrote web icons to public/");
