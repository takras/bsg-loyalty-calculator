// Named imports so only the version maps (not all of package.json) end up in the bundle.
import { dependencies, devDependencies } from "../../package.json";
import { t } from "../i18n";

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
export const CONTACT_EMAIL = "takras@takras.net";
export const APP_STORE_URL = "https://apps.apple.com/no/app/bsg-companion/id6825431292";

/** Opens the visitor's email program with a request to join the Android closed test (there is no backend).
 *  Kept in English: it's written to the developer. */
export const ANDROID_TESTER_MAILTO = `mailto:${CONTACT_EMAIL}?${new URLSearchParams({
  subject: "BSG Companion - Android tester request",
  body: [
    "Hi,",
    "",
    "I'd like to join the closed test of BSG Companion on Android.",
    "",
    "Google account email (the one I use on Google Play): ",
    "Android device (optional): ",
    "",
    "Thanks!",
  ].join("\n"),
})
  .toString()
  .replace(/\+/g, "%20")}`;

export const disclaimer = () => t("credit.disclaimer");

// Product, people and licence names stay as they are; descriptions come from credit.<key>.detail
// (and credit.<key>.name for descriptive names).
const credit = (key: string, c: Omit<Credit, "detail">, translatedName = false): Credit => ({
  ...c,
  name: translatedName ? t(`credit.${key}.name`) : c.name,
  detail: t(`credit.${key}.detail`),
});

export const gameCredits = (): Credit[] => [
  credit("game", {
    name: "Battlestar Galactica: The Board Game",
    url: "https://www.fantasyflightgames.com/en/products/battlestar-galactica/",
  }),
  credit("series", { name: "Battlestar Galactica" }),
  credit("componentArt", { name: "Game component art" }, true),
];

export const ruleCredits = (): Credit[] => [
  credit("unifiedRulebook", {
    name: "BSG - The unified rulebook",
    url: "https://jbiatek.github.io/BSGRulebook/rulebook.html",
  }),
  credit("allySeasons", { name: "Allies for All Seasons" }),
  credit("combinedRules", {
    name: "The Unofficial Combined Rulebook v2.0 & Complete BSG Quick Reference v2.0",
    url: "https://boardgamegeek.com/filepage/68433/battlestar-galactica-combined-rule-book",
  }),
];

const lib = (key: string, name: string, license: string, url: string): Credit =>
  credit(key, { name: deps[name] ? `${name} ${deps[name]}` : name, license, url });

export const softwareCredits = (): Credit[] => [
  lib("react", "react", "MIT", "https://react.dev"),
  lib("marked", "marked", "MIT", "https://marked.js.org"),
  lib("capacitor", "@capacitor/core", "MIT", "https://capacitorjs.com"),
  lib("vite", "vite", "MIT", "https://vite.dev"),
  lib("typescript", "typescript", "Apache-2.0", "https://www.typescriptlang.org"),
  lib("sharp", "sharp", "Apache-2.0", "https://sharp.pixelplumbing.com"),
  lib("capacitorAssets", "@capacitor/assets", "MIT", "https://github.com/ionic-team/capacitor-assets"),
];

export const fontCredits = (): Credit[] => [
  credit("vt323", { name: "VT323", license: "OFL-1.1", url: "https://fonts.google.com/specimen/VT323" }),
  credit("rajdhani", { name: "Rajdhani", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Rajdhani" }),
  credit("michroma", { name: "Michroma", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Michroma" }),
  credit("saira", { name: "Saira", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Saira" }),
  credit("fontsource", { name: "Fontsource", license: "MIT", url: "https://fontsource.org" }),
  credit("viperSquadron", {
    name: "SF Viper Squadron",
    license: "ShyFoundry Freeware EULA",
    url: "https://www.fontspace.com/sf-viper-squadron-font-f8289",
  }),
];

export const originalCredits = (): Credit[] => [credit("originalArt", { name: "Original artwork" }, true)];
