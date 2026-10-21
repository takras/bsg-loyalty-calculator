import { useEffect, useState } from "react";
import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";

/** Cycle order of the theme button. */
export const THEMES = ["cic", "colonial", "caprica"] as const;
export type Theme = (typeof THEMES)[number];
const KEY = "bsg-theme";

export const THEME_LABEL: Record<Theme, { short: string; name: string }> = {
  cic: { short: "CIC", name: "CIC" },
  colonial: { short: "COL", name: "Colonial" },
  caprica: { short: "CAP", name: "Caprica" },
};

const THEME_BG: Record<Theme, string> = { cic: "#04070b", colonial: "#000000", caprica: "#e9e2d4" };

export const nextTheme = (t: Theme): Theme => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length];

export function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    return THEMES.includes(saved as Theme) ? (saved as Theme) : "cic";
  } catch {
    return "cic";
  }
}

export function applyTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_BG[t]);
  // Dark style = light status bar / navigation bar content, for the two dark themes.
  if (Capacitor.isNativePlatform())
    SystemBars.setStyle({ style: t === "caprica" ? SystemBarsStyle.Light : SystemBarsStyle.Dark }).catch(() => {});
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
  return [theme, () => setTheme(nextTheme)];
}
