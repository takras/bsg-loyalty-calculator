import type { ShipId } from "../components/ShipIcon";
import { t } from "../i18n";
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
// combat.<target>.* and ship.<ship> keys
const c = (key: string) => t(`combat.${key}`);
const ship = (id: string) => t(`ship.${id}`);

/** The combat table; built on each call so the text follows the current language. */
export const targets = (): Target[] => [
  {
    id: "raider",
    name: ship("raider"),
    ship: "raider",
    side: "cylon",
    rows: [{ bands: [r(3, 8, "destroy")] }],
    notes: [c("raider.note1")],
  },
  {
    id: "scar",
    name: ship("scar"),
    ship: "scar",
    side: "cylon",
    when: (f) => f.pegasus,
    rows: [{ bands: [r(7, 8, "destroy")] }],
    notes: [c("scar.note1"), c("scar.note2")],
  },
  {
    id: "heavy",
    name: ship("heavy"),
    ship: "heavy",
    side: "cylon",
    rows: [{ bands: [r(7, 8, "destroy")] }],
  },
  {
    id: "centurion",
    name: ship("centurion"),
    ship: "centurion",
    side: "cylon",
    rows: [{ bands: [r(7, 8, "destroy")] }],
    notes: [c("centurion.note1")],
  },
  {
    id: "basestar",
    name: ship("basestar"),
    ship: "basestar",
    side: "cylon",
    rows: [
      { by: ship("viper"), byShip: "viper", bands: [r(8, 8, "damage")] },
      { by: ship("assaultRaptor"), byShip: "assault", bands: [r(7, 8, "damage")], when: (f) => f.daybreak },
      { by: ship("galactica"), byShip: "galactica", bands: [r(5, 8, "damage")] },
    ],
    notes: [c("basestar.note1"), c("basestar.note2")],
  },
  {
    id: "nuke",
    name: ship("nuke"),
    ship: "nuke",
    side: "cylon",
    rows: [
      {
        by: c("nuke.targeted"),
        when: (f) => !f.cylonFleet,
        bands: [
          r(1, 2, "damage", c("nuke.damagedTwice")),
          r(3, 6, "destroy", c("nuke.destroyed")),
          r(7, 8, "destroy", c("nuke.destroyedRaiders")),
        ],
      },
      {
        by: c("nuke.area"),
        when: (f) => f.cylonFleet,
        bands: [
          r(1, 2, "damage", c("nuke.area.damageTwice")),
          r(3, 6, "destroy", c("nuke.area.destroy")),
          r(7, 7, "destroy", c("nuke.area.destroyRaiders")),
          r(8, 8, "destroy", c("nuke.area.destroyAll")),
        ],
      },
    ],
    notes: [c("nuke.note1")],
  },
  {
    id: "galactica",
    name: ship("galactica"),
    ship: "galactica",
    side: "colonial",
    rows: [
      { by: ship("raider"), byShip: "raider", bands: [r(8, 8, "damage")] },
      { by: ship("basestar"), byShip: "basestar", bands: [r(4, 8, "damage")] },
    ],
  },
  {
    id: "pegasus",
    name: ship("pegasus"),
    ship: "pegasus",
    side: "colonial",
    when: (f) => f.pegasus,
    rows: [
      { by: ship("raider"), byShip: "raider", bands: [r(8, 8, "damage")] },
      { by: ship("basestar"), byShip: "basestar", bands: [r(4, 8, "damage")] },
    ],
    notes: [c("pegasus.note1"), c("pegasus.note2")],
  },
  {
    id: "viper",
    name: ship("viperMk2"),
    ship: "viper",
    side: "colonial",
    rows: [{ by: ship("raider"), byShip: "raider", bands: [r(5, 7, "damage"), r(8, 8, "destroy")] }],
    notes: [c("viper.note1")],
  },
  {
    id: "viper7",
    name: ship("viperMk7"),
    ship: "viper7",
    side: "colonial",
    when: (f) => f.cylonFleet,
    rows: [{ by: ship("raider"), byShip: "raider", bands: [r(6, 7, "damage"), r(8, 8, "destroy")] }],
    notes: [c("viper7.note1")],
  },
  {
    id: "assault",
    name: ship("assaultRaptorTitle"),
    ship: "assault",
    side: "colonial",
    when: (f) => f.daybreak,
    rows: [{ by: ship("raider"), byShip: "raider", bands: [r(7, 8, "destroy")] }],
    notes: [c("assault.note1"), c("assault.note2")],
  },
  {
    id: "civilian",
    name: ship("civilian"),
    ship: "civilian",
    side: "colonial",
    rows: [{ by: ship("raider"), byShip: "raider", bands: [], noRoll: c("civilian.noRoll") }],
    notes: [c("civilian.note1")],
  },
  {
    id: "occupation",
    name: ship("occupation"),
    ship: "occupation",
    side: "newcaprica",
    when: (f) => f.ending === "newcaprica",
    rows: [{ bands: [r(5, 8, "destroy")] }],
  },
  {
    id: "detain",
    name: c("detain.name"),
    ship: "human",
    side: "newcaprica",
    when: (f) => f.ending === "newcaprica",
    rows: [{ bands: [r(1, 3, "special", c("detain.detention")), r(4, 7, "special", c("detain.medical"))] }],
  },
];

export interface Token {
  id: string; // image id in src/assets/tokens
  name: string;
  text: string;
}

// token.<id>.name / token.<id>.text
const token = (id: string, withText = true): Token => ({
  id,
  name: t(`token.${id}.name`),
  text: withText ? t(`token.${id}.text`) : "",
});

export const basestarTokens = (ionian: boolean): Token[] => [
  token("token-critical"),
  token("token-hangar"),
  token("token-weapons"),
  token("token-structural"),
  ...(ionian ? [token("token-collateral"), token("token-personnel")] : []),
];

/** Galactica location damage tokens (the remaining Galactica tokens show a resource: lose 1 of it). */
export const galacticaTokens = (): Token[] =>
  [
    "galactica-ftl-control",
    "galactica-weapons-control",
    "galactica-command",
    "galactica-admirals-quarters",
    "galactica-hangar-deck",
    "galactica-armory",
  ].map((id) => token(id, false));

export const pegasusTokens = (): Token[] =>
  ["pegasus-cic", "pegasus-airlock", "pegasus-main-batteries", "pegasus-engine-room"].map((id) => token(id, false));
