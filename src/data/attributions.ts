// Named imports so only the version maps (not all of package.json) end up in the bundle.
import { dependencies, devDependencies } from "../../package.json";

const deps = { ...dependencies, ...devDependencies } as Record<string, string>;

export interface Credit {
  name: string;
  detail?: string;
  license?: string;
  url?: string;
}

/** Public website (GitHub Pages, custom domain). Absolute so native apps open it in the browser. */
export const SITE_URL = "https://bsg.takras.net/";
export const PRIVACY_URL = `${SITE_URL}privacy.html`;

export const DISCLAIMER =
  "BSG Companion is an unofficial fan project. It is not affiliated with, endorsed or sponsored by Fantasy Flight Games, Universal or NBCUniversal.";

export const gameCredits: Credit[] = [
  {
    name: "Battlestar Galactica: The Board Game",
    detail:
      "Designed by Corey Konieczka, Daniel Lovat Clark, James Kniffen and Tim Uren; published by Fantasy Flight Games. Game rules and mechanics © Fantasy Flight Publishing.",
    url: "https://www.fantasyflightgames.com/en/products/battlestar-galactica/",
  },
  {
    name: "Battlestar Galactica",
    detail: "The TV series, names and likenesses are trademarks and © of Universal / NBCUniversal.",
  },
  {
    name: "Game component art",
    detail:
      "Character standees, the combat table icons from the main board, Cylon activation icons, damage and trauma tokens, and rulebook card images are taken from the board game and belong to their owners. They are used here for reference only.",
  },
];

export const ruleCredits: Credit[] = [
  {
    name: "BSG – The unified rulebook",
    detail: "By jbiatek. Embedded in the Rulebook tab, filtered by your setup; also the source for most rule summaries.",
    url: "https://jbiatek.github.io/BSGRulebook/rulebook.html",
  },
  {
    name: "Allies for All Seasons",
    detail: "Fan variant by Alexander DeSouza, as described in the unified rulebook.",
  },
  {
    name: "The Unofficial Combined Rulebook v2.0 & Complete BSG Quick Reference v2.0",
    detail:
      "By Mattias Elfström with support from Kris Vanhoyland (July 2025). Used to check the rules, for the Cylon turn and other summaries, and as the source of the damage token, trauma token, Activate Viper, Occupation Forces and civilian ship icons. Earlier v1.0 used as a reference too.",
    url: "https://boardgamegeek.com/filepage/68433/battlestar-galactica-combined-rule-book",
  },
];

const lib = (name: string, license: string, detail: string, url: string): Credit => ({
  name: deps[name] ? `${name} ${deps[name]}` : name,
  license,
  detail,
  url,
});

export const softwareCredits: Credit[] = [
  lib("react", "MIT", "User interface (with react-dom).", "https://react.dev"),
  lib("marked", "MIT", "Renders the rulebook Markdown.", "https://marked.js.org"),
  lib("@capacitor/core", "MIT", "iOS and Android apps, with @capacitor/ios, /android, /preferences and /splash-screen.", "https://capacitorjs.com"),
  lib("vite", "MIT", "Build tool and dev server (with @vitejs/plugin-react).", "https://vite.dev"),
  lib("typescript", "Apache-2.0", "Type checking.", "https://www.typescriptlang.org"),
  lib("sharp", "Apache-2.0", "Image processing for icons, standees and splash screens (build time only).", "https://sharp.pixelplumbing.com"),
  lib("@capacitor/assets", "MIT", "Generates native app icons and splash screens.", "https://github.com/ionic-team/capacitor-assets"),
];

export const fontCredits: Credit[] = [
  { name: "VT323", detail: "By Peter Hull. Console-style labels.", license: "OFL-1.1", url: "https://fonts.google.com/specimen/VT323" },
  { name: "Rajdhani", detail: "By Indian Type Foundry. Body text.", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Rajdhani" },
  { name: "Michroma", detail: "By Vernon Adams. Rulebook theme headings.", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Michroma" },
  { name: "Saira", detail: "By Omnibus-Type. Rulebook theme text and labels.", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Saira" },
  { name: "Fontsource", detail: "Self-hosted font packages, so the app works offline.", license: "MIT", url: "https://fontsource.org" },
  {
    name: "SF Viper Squadron",
    detail: "By Derek Vogelpohl, ShyFoundry. The app title, included as an image (the font itself isn't bundled).",
    license: "ShyFoundry Freeware EULA",
    url: "https://www.fontspace.com/sf-viper-squadron-font-f8289",
  },
];

export const originalCredits: Credit[] = [
  {
    name: "Original artwork",
    detail: "The app icon, splash screen, navigation icons and the ship silhouettes for units without board art were drawn for this project.",
  },
];
