import { Fragment, type ReactNode } from "react";
import en from "./en.json";

// App text lives in one JSON file per language (src/i18n/<lang>.json), flat "area.name" keys. English is the source
// and the fallback for anything not translated. Translators work on a CSV: see scripts/i18n-export.mjs/-import.mjs.
//
// Message syntax:
//   {name}                 replaced by vars.name
//   {count, plural}        picks "<key>.one" / "<key>.other" (by the language's plural rules) — use tp()
//   <b>…</b>, <i>…</i>     bold / italic, rendered by <T>; t() strips them for plain strings

type Messages = Record<string, string>;
const files = import.meta.glob<{ default: Messages }>("./*.json", { eager: true });
const catalogs: Record<string, Messages> = Object.fromEntries(
  Object.entries(files).map(([path, mod]) => [path.slice(2, -5), mod.default]),
);

/** Languages with a translation file, English first. */
export const LANGUAGES = Object.keys(catalogs).sort((a, b) => (a === "en" ? -1 : b === "en" ? 1 : a.localeCompare(b)));
export const LANGUAGE_NAME: Record<string, string> = { en: "English", it: "Italiano" };

const KEY = "bsg-lang";
let current = "en";

export function initialLanguage(): string {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && catalogs[saved]) return saved;
  } catch {
    // no storage: fall through to the device language
  }
  const device = (navigator.languages?.[0] ?? navigator.language ?? "en").slice(0, 2).toLowerCase();
  return catalogs[device] ? device : "en";
}

export function setLanguage(lang: string) {
  current = catalogs[lang] ? lang : "en";
  document.documentElement.lang = current;
  try {
    localStorage.setItem(KEY, current);
  } catch {
    // language just won't be remembered
  }
}

export const getLanguage = () => current;

function lookup(key: string): string {
  const msg = catalogs[current]?.[key] || (en as Messages)[key];
  if (msg === undefined) {
    if (import.meta.env.DEV) console.warn(`i18n: missing key "${key}"`);
    return key;
  }
  return msg;
}

const fill = (msg: string, vars?: Record<string, string | number>) =>
  vars ? msg.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m)) : msg;

/** Plain text (markup tags removed). */
export function t(key: string, vars?: Record<string, string | number>): string {
  return fill(lookup(key), vars).replace(/<\/?[bi]>/g, "");
}

/** Plural: uses "<key>.one", "<key>.other" (and "<key>.few"/"many" where a language needs them); {count} is filled. */
export function tp(key: string, count: number, vars?: Record<string, string | number>): string {
  const form = new Intl.PluralRules(current).select(count);
  const k = `${key}.${form}`;
  const has = (catalogs[current]?.[k] ?? (en as Messages)[k]) !== undefined;
  return t(has ? k : `${key}.other`, { count, ...vars });
}

/** A lookup table whose values are translated when read: labels(["a", "b"], "x") gives { a: t("x.a"), b: t("x.b") }. */
export function labels<K extends string>(ids: readonly K[], prefix: string): Record<K, string> {
  const out = {} as Record<K, string>;
  for (const id of ids) Object.defineProperty(out, id, { get: () => t(`${prefix}.${id}`), enumerable: true });
  return out;
}

/** Rich text: renders <b> and <i> from the message; `slots` replace {name} with React nodes. */
export function T({ k, vars, slots }: { k: string; vars?: Record<string, string | number>; slots?: Record<string, ReactNode> }) {
  return <>{render(fill(lookup(k), vars), slots)}</>;
}

function render(msg: string, slots?: Record<string, ReactNode>): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /<(b|i)>([\s\S]*?)<\/\1>|\{(\w+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(msg))) {
    if (m.index > last) out.push(msg.slice(last, m.index));
    if (m[1]) {
      const inner = render(m[2], slots);
      out.push(m[1] === "b" ? <strong key={out.length}>{inner}</strong> : <em key={out.length}>{inner}</em>);
    } else if (slots && m[3] in slots) {
      out.push(<Fragment key={out.length}>{slots[m[3]]}</Fragment>);
    } else {
      out.push(m[0]);
    }
    last = re.lastIndex;
  }
  if (last < msg.length) out.push(msg.slice(last));
  return out;
}
