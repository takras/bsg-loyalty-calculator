import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { thirdPartyLicenses } from "./licenses-plugin";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// Relative base so the build can be dropped into any folder on any static host.
export default defineConfig({
  base: "./",
  plugins: [react(), thirdPartyLicenses()],
  // The web version shown under Rules → About; the native apps report their own installed version instead.
  define: { __APP_VERSION__: JSON.stringify(version) },
});
