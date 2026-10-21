// Converts the character standee art (assets/source/standees/standee-*.png) to WebP files named by
// character id in src/assets/characters/. Run: node assets/convert-standees.mjs
import sharp from "sharp";

// standee file name → character id (see src/data/characters.ts)
const MAP = {
  adama: "william", saul: "saul", agathon: "helo", "agathon-pilot": "helo-alt", lee: "apollo",
  "lee-political": "apollo-alt", starbuck: "starbuck", boomer: "boomer", chief: "chief",
  roslin: "laura", "gaius-original": "gaius", "gaius-political": "gaius-alt", tom: "tom",
  "zarek-military": "tom-alt", helen: "ellen", cain: "helena", kat: "kat", dee: "dee",
  tori: "tory", felix: "felix", anders: "samuel", cally: "cally", romo: "romo", hoshi: "louis",
  hotdog: "hotdog", cottle: "doc",
  six: "caprica", leoben: "leoben", cavil: "cavil", athena: "athena", diana: "danna", doral: "doral", simon: "simon",
};

for (const [file, id] of Object.entries(MAP)) {
  await sharp(`assets/source/standees/standee-${file}.png`)
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(`src/assets/characters/${id}.webp`);
}
console.log(`converted ${Object.keys(MAP).length} standees`);
