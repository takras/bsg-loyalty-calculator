// Exports the app text to a CSV a translator can fill in (Google Sheets, Excel, LibreOffice).
// Columns: key, English, <lang> (existing translation, if any), notes (where it appears and what to keep intact).
// Run: node scripts/i18n-export.mjs it   → translations/it.csv
// Then send the CSV to the translator; import the result with scripts/i18n-import.mjs.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const lang = process.argv[2];
if (!lang || lang === "en") throw new Error("Usage: node scripts/i18n-export.mjs <language code, e.g. it>");

const en = JSON.parse(readFileSync("src/i18n/en.json", "utf8"));
const existing = existsSync(`src/i18n/${lang}.json`) ? JSON.parse(readFileSync(`src/i18n/${lang}.json`, "utf8")) : {};

// Where each key prefix appears in the app, for the translator's context.
const AREAS = {
  app: "App header and navigation", toggle: "On/off switches", setup: "Setup tab", loyalty: "Setup tab, Loyalty deck",
  checklist: "Setup tab, board & components checklist", validate: "Setup tab, line-up check", type: "Character type",
  typeShort: "Character type (short)", box: "Expansion name", character: "Character details", title: "Title name",
  ending: "Game ending", titles: "Titles tab", log: "Titles tab, game log", ship: "Ship name", combat: "Combat tab",
  token: "Combat tab, damage token", crisis: "Crisis tab", reckless: "Reckless Skill Check rules", exec: "Execute tab",
  quick: "Rules tab, quick rules", credit: "Rules tab, About & attributions", about: "Rules tab, About & attributions",
  collapse: "Show/hide label on folding sections", rulebook: "Rules tab, rulebook search",
};

function notes(key, text) {
  const out = [AREAS[key.split(".")[0]] ?? ""];
  const vars = text.match(/\{\w+\}/g);
  if (vars) out.push(`keep ${[...new Set(vars)].join(" ")} unchanged (filled in by the app)`);
  if (/<[bi]>/.test(text)) out.push("keep the <b>…</b> (bold) / <i>…</i> (italic) tags around the matching words");
  if (/\.(one|other)$/.test(key)) out.push(`plural form "${key.split(".").pop()}" (one = 1 item, other = everything else)`);
  if (/^\s|\s$/.test(text)) out.push("starts/ends with a space or punctuation that joins it to other text; keep that");
  return out.filter(Boolean).join("; ");
}

const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const rows = [["key", "English", lang, "notes"].map(cell).join(",")];
for (const [key, text] of Object.entries(en)) rows.push([key, text, existing[key] ?? "", notes(key, text)].map(cell).join(","));

mkdirSync("translations", { recursive: true });
const out = `translations/${lang}.csv`;
// BOM so Excel opens it as UTF-8 (accents, quotes and arrows intact).
writeFileSync(out, "﻿" + rows.join("\r\n") + "\r\n", "utf8");
const done = Object.keys(en).filter((k) => existing[k]).length;
console.log(`wrote ${out}: ${Object.keys(en).length} strings, ${done} already translated`);
