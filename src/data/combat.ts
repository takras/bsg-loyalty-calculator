import type { ShipId } from "../components/ShipIcon";
import type { Flags } from "../logic/config";

export type Effect = "miss" | "damage" | "destroy" | "special";

export interface Band {
  min: number;
  max: number;
  effect: Effect;
  label?: string;
}

export interface AttackRow {
  /** Who is attacking (empty = any attacker) */
  by?: string;
  byShip?: ShipId;
  bands: Band[];
  /** No die roll: show this text instead of a die strip */
  noRoll?: string;
  when?: (f: Flags) => boolean;
  note?: string;
}

export interface Target {
  id: string;
  name: string;
  ship: ShipId;
  side: "cylon" | "colonial" | "newcaprica";
  rows: AttackRow[];
  notes?: string[];
  when?: (f: Flags) => boolean;
}

const r = (min: number, max: number, effect: Effect, label?: string): Band => ({ min, max, effect, label });

export const targets: Target[] = [
  {
    id: "raider",
    name: "Raider",
    ship: "raider",
    side: "cylon",
    rows: [{ bands: [r(3, 8, "destroy")] }],
    notes: ["Viper, assault raptor or Galactica (Weapons Control) all use the same roll."],
  },
  {
    id: "scar",
    name: "Scar",
    ship: "scar",
    side: "cylon",
    when: (f) => f.pegasus,
    rows: [{ bands: [r(7, 8, "destroy")] }],
    notes: [
      "Only destroyed by a die roll of 7–8 (modifiers count, e.g. Strategic Planning).",
      "Cannot be chosen for “destroy a raider” effects without a roll (incl. Kat’s Hot Shot).",
    ],
  },
  {
    id: "heavy",
    name: "Heavy Raider",
    ship: "heavy",
    side: "cylon",
    rows: [{ bands: [r(7, 8, "destroy")] }],
  },
  {
    id: "centurion",
    name: "Centurion",
    ship: "centurion",
    side: "cylon",
    rows: [{ bands: [r(7, 8, "destroy")] }],
    notes: ["Centurions do not push each other on the Boarding Party track."],
  },
  {
    id: "basestar",
    name: "Basestar",
    ship: "basestar",
    side: "cylon",
    rows: [
      { by: "Viper", byShip: "viper", bands: [r(8, 8, "damage")] },
      { by: "Assault raptor", byShip: "assault", bands: [r(7, 8, "damage")], when: (f) => f.daybreak },
      { by: "Galactica", byShip: "galactica", bands: [r(5, 8, "damage")] },
    ],
    notes: [
      "Destroyed at 3 damage. Draw a damage token per hit (Critical Hit counts as 2).",
      "Structural Damage token: +2 to rolls attacking this basestar.",
    ],
  },
  {
    id: "nuke",
    name: "Nuke",
    ship: "nuke",
    side: "cylon",
    rows: [
      {
        by: "Targeted with a nuke",
        when: (f) => !f.cylonFleet,
        bands: [r(1, 2, "damage", "Damaged twice"), r(3, 6, "destroy", "Destroyed"), r(7, 8, "destroy", "Destroyed + 3 raiders in area")],
      },
      {
        by: "Attack a space area with a nuke",
        when: (f) => f.cylonFleet,
        bands: [
          r(1, 2, "damage", "Damage a basestar twice"),
          r(3, 6, "destroy", "Destroy a basestar"),
          r(7, 7, "destroy", "Destroy a basestar + 3 raiders"),
          r(8, 8, "destroy", "Destroy every ship in area"),
        ],
      },
    ],
    notes: [
      "Admiral’s title card action; the Admiral starts with 2 nukes.",
    ],
  },
  {
    id: "galactica",
    name: "Galactica",
    ship: "galactica",
    side: "colonial",
    rows: [
      { by: "Raider", byShip: "raider", bands: [r(8, 8, "damage")] },
      { by: "Basestar", byShip: "basestar", bands: [r(4, 8, "damage")] },
    ],
  },
  {
    id: "pegasus",
    name: "Pegasus",
    ship: "pegasus",
    side: "colonial",
    when: (f) => f.pegasus,
    rows: [
      { by: "Raider", byShip: "raider", bands: [r(8, 8, "damage")] },
      { by: "Basestar", byShip: "basestar", bands: [r(4, 8, "damage")] },
    ],
    notes: [
      "When Galactica is damaged, the current player may damage Pegasus instead.",
      "Destroyed when all 4 locations are damaged; characters aboard go to Sickbay.",
    ],
  },
  {
    id: "viper",
    name: "Viper Mk II",
    ship: "viper",
    side: "colonial",
    rows: [{ by: "Raider", byShip: "raider", bands: [r(5, 7, "damage"), r(8, 8, "destroy")] }],
    notes: ["Damaged → Damaged Vipers box. Pilot goes to Sickbay if damaged or destroyed."],
  },
  {
    id: "viper7",
    name: "Viper Mk VII",
    ship: "viper7",
    side: "colonial",
    when: (f) => f.cylonFleet,
    rows: [{ by: "Raider", byShip: "raider", bands: [r(6, 7, "damage"), r(8, 8, "destroy")] }],
    notes: ["Moves 2 space areas instead of 1. Starts the game damaged."],
  },
  {
    id: "assault",
    name: "Assault Raptor",
    ship: "assault",
    side: "colonial",
    when: (f) => f.daybreak,
    rows: [{ by: "Raider", byShip: "raider", bands: [r(7, 8, "destroy")] }],
    notes: ["Never damaged: “damage a viper” on an assault raptor destroys it.", "Cannot be risked."],
  },
  {
    id: "civilian",
    name: "Civilian Ship",
    ship: "civilian",
    side: "colonial",
    rows: [{ by: "Raider", byShip: "raider", bands: [], noRoll: "Always destroyed – no die roll" }],
    notes: ["Flip the tile and lose the resources shown."],
  },
  {
    id: "occupation",
    name: "Occupation Force",
    ship: "occupation",
    side: "newcaprica",
    when: (f) => f.ending === "newcaprica",
    rows: [{ bands: [r(5, 8, "destroy")] }],
  },
  {
    id: "detain",
    name: "Detain a Human",
    ship: "human",
    side: "newcaprica",
    when: (f) => f.ending === "newcaprica",
    rows: [{ bands: [r(1, 3, "special", "Detention"), r(4, 7, "special", "Medical Center")] }],
  },
];

export interface Token {
  id: string; // image id in src/assets/tokens
  name: string;
  text: string;
}

export const basestarTokens = (ionian: boolean): Token[] => [
  { id: "token-critical", name: "Critical Hit", text: "Counts as 2 damage." },
  { id: "token-hangar", name: "Disabled Hangar", text: "Cannot launch raiders or heavy raiders." },
  { id: "token-weapons", name: "Disabled Weapons", text: "Cannot fire on Galactica." },
  { id: "token-structural", name: "Structural Damage", text: "+2 to rolls attacking it." },
  ...(ionian
    ? [
        { id: "token-collateral", name: "Collateral Damage", text: "When added: destroy 3 raiders in the area." },
        { id: "token-personnel", name: "Damage to Personnel", text: "When added: each Cylon player draws 2 Trauma." },
      ]
    : []),
];

/** Galactica location damage tokens (the remaining Galactica tokens show a resource: lose 1 of it). */
export const galacticaTokens: Token[] = [
  { id: "galactica-ftl-control", name: "FTL Control", text: "" },
  { id: "galactica-weapons-control", name: "Weapons Control", text: "" },
  { id: "galactica-command", name: "Command", text: "" },
  { id: "galactica-admirals-quarters", name: "Admiral’s Quarters", text: "" },
  { id: "galactica-hangar-deck", name: "Hangar Deck", text: "" },
  { id: "galactica-armory", name: "Armory", text: "" },
];

export const pegasusTokens: Token[] = [
  { id: "pegasus-cic", name: "Pegasus CIC", text: "" },
  { id: "pegasus-airlock", name: "Airlock", text: "" },
  { id: "pegasus-main-batteries", name: "Main Batteries", text: "" },
  { id: "pegasus-engine-room", name: "Engine Room", text: "" },
];
