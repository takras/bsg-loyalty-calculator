import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "net.takras.bsg",
  appName: "BSG Companion",
  webDir: "dist",
  backgroundColor: "#04070b",
  ios: {
    contentInset: "never",
  },
  android: {
    backgroundColor: "#04070b",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: "#04070b",
      showSpinner: false,
    },
    SystemBars: {
      // Edge-to-edge; Android also gets --safe-area-inset-* CSS variables (used in styles.css)
      insetsHandling: "css",
      initialViewportFitValueHint: "cover",
      style: "DARK",
    },
  },
};

export default config;
