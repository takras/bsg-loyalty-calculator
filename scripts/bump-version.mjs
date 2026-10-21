// Bumps the patch version in package.json (and package-lock.json) and stages the bump.
// Run by the pre-commit hook in .githooks, so every commit gets a new version; Android's versionCode
// is derived from it in android/app/build.gradle.
// Skipped when the commit already changes the version (e.g. a manual minor/major bump),
// or with SKIP_BUMP=1 git commit ...
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

if (process.env.SKIP_BUMP === "1") process.exit(0);

const git = (args, input) => execFileSync("git", args, { encoding: "utf8", input });

const staged = git(["diff", "--cached", "--unified=0", "--", "package.json"]);
if (/^\+\s*"version":/m.test(staged)) process.exit(0);

const current = JSON.parse(git(["show", ":package.json"])).version;
const [major, minor, patch] = current.split(".").map(Number);
const version = `${major}.${minor}.${patch + 1}`;

// Rewrite only the first `count` "version" values (package-lock.json repeats the project's version at the top
// and under packages[""]), leaving the rest of the file untouched.
const bump = (text, count) => {
  let n = 0;
  return text.replace(/("version":\s*")[^"]+(")/g, (m, a, b) => (n++ < count ? a + version + b : m));
};

for (const [file, count] of [["package.json", 1], ["package-lock.json", 2]]) {
  if (!existsSync(file)) continue;
  // Bump the staged copy and the working copy separately, so unrelated unstaged edits stay unstaged.
  const blob = git(["hash-object", "-w", "--stdin", "--path", file], bump(git(["show", `:${file}`]), count)).trim();
  const mode = git(["ls-files", "--stage", "--", file]).split(" ")[0] || "100644";
  git(["update-index", "--cacheinfo", `${mode},${blob},${file}`]);
  writeFileSync(file, bump(readFileSync(file, "utf8"), count));
}
console.log(`version ${current} → ${version}`);
