// Imports a filled-in translation CSV (from scripts/i18n-export.mjs) into src/i18n/<lang>.json.
// Checks every row against the English text: {placeholders} and <b>/<i> tags must match. Rows that fail are
// left out (the app shows English for them) and listed so they can be fixed. Empty cells are simply untranslated.
// Run: node scripts/i18n-import.mjs it [path/to/file.csv]   (default translations/it.csv)
import { readFileSync, writeFileSync } from "node:fs";

const lang = process.argv[2];
if (!lang || lang === "en") throw new Error("Usage: node scripts/i18n-import.mjs <language code> [file.csv]");
const file = process.argv[3] ?? `translations/${lang}.csv`;
const en = JSON.parse(readFileSync("src/i18n/en.json", "utf8"));

/** RFC 4180 CSV: quoted fields may contain commas, quotes ("") and line breaks. Also accepts ; or tab separators. */
function parseCsv(text) {
  text = text.replace(/^﻿/, "");
  const firstLine = text.slice(0, text.indexOf("\n"));
  const sep = [",", ";", "\t"].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

const rows = parseCsv(readFileSync(file, "utf8"));
const header = rows.shift().map((h) => h.trim().toLowerCase());
const keyCol = header.indexOf("key");
const langCol = header.indexOf(lang.toLowerCase());
if (keyCol < 0 || langCol < 0) throw new Error(`CSV needs "key" and "${lang}" columns; found: ${header.join(", ")}`);

const tokens = (s, re) => (s.match(re) ?? []).sort().join(" ");
const out = {};
const problems = [];
let unknown = 0;
for (const r of rows) {
  const key = r[keyCol]?.trim();
  const value = r[langCol] ?? "";
  if (!key) continue;
  if (!(key in en)) { unknown++; continue; }
  if (!value.trim()) continue;
  const issues = [];
  if (tokens(value, /\{\w+\}/g) !== tokens(en[key], /\{\w+\}/g)) issues.push(`placeholders should be ${tokens(en[key], /\{\w+\}/g) || "none"}`);
  if (tokens(value, /<\/?[bi]>/g) !== tokens(en[key], /<\/?[bi]>/g)) issues.push("bold/italic tags don't match the English");
  if (issues.length) problems.push(`${key}: ${issues.join("; ")}`);
  else out[key] = value;
}

// Keep the English key order, so diffs of the JSON stay readable.
const ordered = Object.fromEntries(Object.keys(en).filter((k) => k in out).map((k) => [k, out[k]]));
writeFileSync(`src/i18n/${lang}.json`, JSON.stringify(ordered, null, 2) + "\n", "utf8");

const total = Object.keys(en).length;
console.log(`wrote src/i18n/${lang}.json: ${Object.keys(ordered).length}/${total} strings translated` +
  (unknown ? `, ${unknown} rows with unknown keys ignored` : ""));
if (problems.length) {
  console.log(`\n${problems.length} rows skipped (shown in English until fixed):`);
  for (const p of problems) console.log("  " + p);
  process.exitCode = 1;
}
