// Vite plugin: writes dist/third-party-licenses.txt with the licence text of every npm package
// that ends up in the build (JS, CSS and fonts), plus the native Capacitor runtimes shipped in the
// iOS/Android apps. Satisfies the "include the notice" condition of MIT / OFL / Apache licences.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";

// Shipped inside the native apps but not part of the web bundle.
const NATIVE_PACKAGES = ["@capacitor/android", "@capacitor/ios", "@capacitor/preferences", "@capacitor/splash-screen"];

const LICENSE_FILE = /^(licen[cs]e|copying|ofl)(\.(md|txt))?$/i;

function packageOf(id: string): string | null {
  // Rollup ids may carry a \0 prefix and a ?query; normalise Windows separators to "/".
  const path = id.replace(/^\0/, "").split("?")[0].split("\\").join("/");
  const i = path.lastIndexOf("node_modules/");
  if (i < 0) return null;
  const parts = path.slice(i + "node_modules/".length).split("/");
  return parts[0].startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
}

function readPackage(root: string, name: string) {
  const dir = join(root, "node_modules", ...name.split("/"));
  const pkgFile = join(dir, "package.json");
  if (!existsSync(pkgFile)) return null;
  const pkg = JSON.parse(readFileSync(pkgFile, "utf8"));
  const file = readdirSync(dir).find((f) => LICENSE_FILE.test(f));
  const text = file ? readFileSync(join(dir, file), "utf8").trim() : null;
  const author = typeof pkg.author === "string" ? pkg.author : pkg.author?.name;
  return { name, version: pkg.version as string, license: pkg.license as string, author, homepage: pkg.homepage as string, text };
}

export function thirdPartyLicenses(): Plugin {
  let root = process.cwd();
  return {
    name: "third-party-licenses",
    apply: "build",
    configResolved(config) {
      root = config.root;
    },
    generateBundle() {
      const names = new Set<string>(NATIVE_PACKAGES);
      for (const id of this.getModuleIds()) {
        const name = packageOf(id);
        if (name) names.add(name);
      }
      const own = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).name;
      const entries = [...names]
        .filter((n) => n !== own)
        .sort()
        .map((n) => readPackage(root, n))
        .filter((p): p is NonNullable<typeof p> => !!p);

      const missing = entries.filter((e) => !e.text).map((e) => e.name);
      if (missing.length) this.warn(`No licence file found for: ${missing.join(", ")}`);

      const rule = "=".repeat(78);
      const body = [
        "BSG Companion – third-party software licences",
        "",
        "This app includes the following open-source software. Each package is listed with its",
        "licence and the full licence text as published by its authors.",
        "",
        ...entries.flatMap((e) => [
          rule,
          `${e.name} ${e.version} – ${e.license}`,
          ...(e.author ? [`Author: ${e.author}`] : []),
          ...(e.homepage ? [`Homepage: ${e.homepage}`] : []),
          rule,
          "",
          e.text ?? `Licence: ${e.license} (no licence file included in the package)`,
          "",
        ]),
      ].join("\n");

      this.emitFile({ type: "asset", fileName: "third-party-licenses.txt", source: body });
    },
  };
}
