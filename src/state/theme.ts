import { useEffect, useState } from "react";
import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";

export type Theme = "cic" | "colonial";
const KEY = "bsg-theme";

export function initialTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === "colonial" ? "colonial" : "cic";
  } catch {
    return "cic";
  }
}

export function applyTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  const bg = t === "colonial" ? "#000000" : "#04070b";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg);
  // Both themes are dark: light status bar / navigation bar content.
  if (Capacitor.isNativePlatform()) SystemBars.setStyle({ style: SystemBarsStyle.Dark }).catch(() => {});
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      // ignore – theme just won't be remembered
    }
  }, [theme]);
  return [theme, () => setTheme((t) => (t === "cic" ? "colonial" : "cic"))];
}
