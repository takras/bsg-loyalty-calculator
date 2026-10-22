import { StrictMode } from "react";
import { Capacitor } from "@capacitor/core";
import { createRoot } from "react-dom/client";
import "@fontsource/vt323/400.css";
import "@fontsource/rajdhani/500.css";
import "@fontsource/rajdhani/600.css";
import "@fontsource/rajdhani/700.css";
import { App } from "./App";
import { loadRaw } from "./state/persist";
import { STORAGE_KEY, StoreProvider } from "./state/store";
import { applyTheme, initialTheme } from "./state/theme";
import "./styles.css";

// Native app (not a mobile browser): lets CSS fit the full-screen layout, e.g. the Rulebook frame's chamfered corners.
if (Capacitor.isNativePlatform()) document.documentElement.dataset.native = "";
applyTheme(initialTheme());

loadRaw(STORAGE_KEY).then((raw) => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <StoreProvider initialRaw={raw}>
        <App />
      </StoreProvider>
    </StrictMode>,
  );
});
