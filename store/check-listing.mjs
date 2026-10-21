// Checks the App Store listing text against Apple's character limits.
// Run: node store/check-listing.mjs
import { readFileSync } from "node:fs";

const lines = readFileSync(new URL("./app-store/listing.md", import.meta.url), "utf8").split(/\r?\n/);
const LIMITS = {
  Name: 30,
  Subtitle: 30,
  "Promotional text": 170,
  Description: 4000,
  Keywords: 100,
  "What's New in This Version": 4000,
};

/** The fenced block that follows the "**Field**" line. */
function block(field) {
  const start = lines.findIndex((l) => l.startsWith(`**${field}**`));
  if (start < 0) return null;
  const open = lines.indexOf("```", start + 1);
  const close = lines.indexOf("```", open + 1);
  return open < 0 || close < 0 ? null : lines.slice(open + 1, close).join("\n");
}

let failed = false;
for (const [field, limit] of Object.entries(LIMITS)) {
  const text = block(field);
  if (text === null) {
    console.log(`?         ${field}: not found`);
    failed = true;
    continue;
  }
  const n = [...text].length;
  if (n > limit) failed = true;
  console.log(`${n <= limit ? "ok       " : "TOO LONG "} ${field}: ${n}/${limit}`);
}
process.exit(failed ? 1 : 0);
