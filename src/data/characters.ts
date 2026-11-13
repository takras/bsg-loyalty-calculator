import { labels, t } from "../i18n";

export type Box = "core" | "pegasus" | "exodus" | "daybreak";
export type CharacterType = "political" | "military" | "pilot" | "support" | "cylonleader";

export interface Character {
  id: string;
  name: string;
  /** Display name: nickname if the character has one, else the full name. Alternate/duplicate
   *  versions get a "(Type)" suffix so lists stay unambiguous. */
  short: string;
  type: CharacterType;
  box: Box;
  /** Id of the other version of the same person (original <-> alternate). */
  versionOf?: string;
  /** "original" or "alternate" when two versions exist */
  version?: "original" | "alternate";
  /** Setup / rule notes that matter for this helper */
  notes?: string[];
}

const TYPES = ["political", "military", "pilot", "support", "cylonleader"] as const;
/** Full type name, e.g. "Political Leader". */
export const TYPE_LABEL = labels(TYPES, "type");
/** Short type name for suffixes and tiles, e.g. "Political". */
export const TYPE_SHORT = labels(TYPES, "typeShort");
export const BOX_LABEL = labels(["core", "pegasus", "exodus", "daybreak"] as const, "box");

export const characters: Character[] = [
  // Base game
  { id: "laura", name: "Laura Roslin", short: "Laura Roslin", type: "political", box: "core" },
  {
    id: "gaius",
    name: "Gaius Baltar",
    short: "Gaius Baltar",
    type: "political",
    box: "core",
    versionOf: "gaius-alt",
    version: "original",
    notes: ["Receives 2 Loyalty cards at setup; adds 1 extra “Not a Cylon” card to the deck."],
  },
  { id: "tom", name: "Tom Zarek", short: "Tom Zarek", type: "political", box: "core", versionOf: "tom-alt", version: "original" },
  { id: "william", name: "William Adama", short: "William Adama", type: "military", box: "core" },
  { id: "saul", name: "Saul Tigh", short: "Saul Tigh", type: "military", box: "core" },
  {
    id: "helo",
    name: "Karl “Helo” Agathon",
    short: "Helo",
    type: "military",
    box: "core",
    versionOf: "helo-alt",
    version: "original",
    notes: ["Starts the game “Stranded” (not on a ship)."],
  },
  {
    id: "apollo",
    name: "Lee “Apollo” Adama",
    short: "Apollo",
    type: "pilot",
    box: "core",
    versionOf: "apollo-alt",
    version: "original",
    notes: ["Starts in a viper launched from the Reserves."],
  },
  { id: "starbuck", name: "Kara “Starbuck” Thrace", short: "Starbuck", type: "pilot", box: "core" },
  {
    id: "boomer",
    name: "Sharon “Boomer” Valerii",
    short: "Boomer",
    type: "pilot",
    box: "core",
    notes: [
      "Adds 1 extra “Not a Cylon” card to the Loyalty deck.",
      "Receives 2 Loyalty cards in the Sleeper Agent phase.",
    ],
  },
  { id: "chief", name: "“Chief” Galen Tyrol", short: "Chief", type: "support", box: "core" },

  // Pegasus
  { id: "ellen", name: "Ellen Tigh", short: "Ellen Tigh", type: "political", box: "pegasus" },
  { id: "helena", name: "Helena Cain", short: "Helena Cain", type: "military", box: "pegasus" },
  { id: "kat", name: "Louanne “Kat” Katraine", short: "Kat", type: "pilot", box: "pegasus" },
  { id: "dee", name: "Anastasia “Dee” Dualla", short: "Dee", type: "support", box: "pegasus" },
  { id: "caprica", name: "Caprica Six", short: "Caprica Six", type: "cylonleader", box: "pegasus" },
  { id: "leoben", name: "Leoben Conoy", short: "Leoben Conoy", type: "cylonleader", box: "pegasus" },
  { id: "cavil", name: "Cavil", short: "Cavil", type: "cylonleader", box: "pegasus" },

  // Exodus
  { id: "tory", name: "Tory Foster", short: "Tory Foster", type: "political", box: "exodus" },
  { id: "felix", name: "Felix Gaeta", short: "Felix Gaeta", type: "military", box: "exodus" },
  {
    id: "samuel",
    name: "Samuel T. Anders",
    short: "Samuel Anders",
    type: "pilot",
    box: "exodus",
    notes: ["“Starts on the Bench”: skips Receive Skills on his first turn."],
  },
  { id: "cally", name: "Callandra “Cally” Tyrol", short: "Cally", type: "support", box: "exodus" },

  // Daybreak
  { id: "romo", name: "Romo Lampkin", short: "Romo Lampkin", type: "political", box: "daybreak" },
  { id: "apollo-alt", name: "Lee Adama", short: "Lee Adama", type: "political", box: "daybreak", versionOf: "apollo", version: "alternate" },
  { id: "louis", name: "Louis Hoshi", short: "Louis Hoshi", type: "military", box: "daybreak" },
  {
    id: "tom-alt",
    name: "Tom Zarek",
    short: "Tom Zarek (Military)",
    type: "military",
    box: "daybreak",
    versionOf: "tom",
    version: "alternate",
    notes: ["“Disreputable”: draws a Mutiny card at setup (and when chosen after an execution)."],
  },
  { id: "hotdog", name: "Brendan “Hot Dog” Costanza", short: "Hot Dog", type: "pilot", box: "daybreak" },
  { id: "helo-alt", name: "Karl “Helo” Agathon", short: "Helo (Pilot)", type: "pilot", box: "daybreak", versionOf: "helo", version: "alternate" },
  { id: "doc", name: "Sherman “Doc” Cottle", short: "Doc", type: "support", box: "daybreak" },
  { id: "gaius-alt", name: "Gaius Baltar", short: "Gaius Baltar (Support)", type: "support", box: "daybreak", versionOf: "gaius", version: "alternate" },
  { id: "athena", name: "Sharon “Athena” Agathon", short: "Athena", type: "cylonleader", box: "daybreak" },
  { id: "danna", name: "D’Anna Biers", short: "D’Anna Biers", type: "cylonleader", box: "daybreak" },
  { id: "doral", name: "Aaron Doral", short: "Aaron Doral", type: "cylonleader", box: "daybreak" },
  { id: "simon", name: "Simon O’Neill", short: "Simon O’Neill", type: "cylonleader", box: "daybreak" },
];

// Translated text: the "(Type)" suffix of duplicate names, and the notes (the English above is the source text,
// mirrored in i18n/en.json as character.<id>.noteN).
for (const c of characters) {
  const suffixed = /\s*\(.*\)$/.test(c.short);
  if (suffixed) {
    const base = c.short.replace(/\s*\(.*\)$/, "");
    Object.defineProperty(c, "short", { get: () => `${base} (${TYPE_SHORT[c.type]})`, enumerable: true });
  }
  if (c.notes) {
    const count = c.notes.length;
    Object.defineProperty(c, "notes", {
      get: () => Array.from({ length: count }, (_, i) => t(`character.${c.id}.note${i + 1}`)),
      enumerable: true,
    });
  }
}

export const characterById = Object.fromEntries(characters.map((c) => [c.id, c])) as Record<
  string,
  Character
>;

export function displayName(c: Character): string {
  if (!c.version) return c.name;
  return `${c.name} (${t(c.version === "original" ? "character.orig" : "character.alt")} ${TYPE_SHORT[c.type]})`;
}

/** Name for the standee name plate: the display name without the "(Type)" suffix. */
export const plateName = (c: Character) => c.short.replace(/\s*\(.*\)$/, "");
