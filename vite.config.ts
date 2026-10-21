import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { thirdPartyLicenses } from "./licenses-plugin";

// Relative base so the build can be dropped into any folder on any static host.
export default defineConfig({
  base: "./",
  plugins: [react(), thirdPartyLicenses()],
});
