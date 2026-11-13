import { characterById } from "../data/characters";
import { t, tp } from "../i18n";
import type { Config, Flags } from "./config";

/** Loyalty card kinds; the label comes from loyalty.card.<kind>. */
export type LoyaltyCard = "cylon" | "notCylon" | "mutineer" | "sympatheticCylon" | "sympathizer";

export interface LoyaltyLine {
  count: number;
  kind: LoyaltyCard;
  card: string;
  note?: string;
}

export interface LoyaltySetup {
  valid: boolean;
  errors: string[];
  players: number;
  /** Cards shuffled into the initial Loyalty deck */
  deck: LoyaltyLine[];
  /** Cards set aside and added after the first round of dealing */
  laterAdd: LoyaltyLine[];
  deckSize: number;
  firstDeal: string[];
  sleeperDeal: string[];
  extras: string[];
  notACylonPool: string[];
}

// Rows: [cylon, notACylon] per player count, from the rulebook's four tables.
const TABLES: Record<string, Record<number, [number, number]>> = {
  "noCL-regular": { 3: [1, 5], 4: [1, 6], 5: [2, 8], 6: [2, 9] },
  "CL-regular": { 4: [1, 5], 5: [1, 7], 6: [2, 8], 7: [2, 10] },
  "noCL-exodus": { 3: [1, 6], 4: [1, 7], 5: [2, 9], 6: [2, 10] },
  "CL-exodus": { 4: [1, 6], 5: [1, 8], 6: [2, 9], 7: [2, 11] },
};

export function loyaltyTable(cylonLeader: boolean, exodusLoyalty: boolean) {
  return TABLES[`${cylonLeader ? "CL" : "noCL"}-${exodusLoyalty ? "exodus" : "regular"}`];
}

const line = (count: number, kind: LoyaltyCard, note?: string): LoyaltyLine => ({
  count,
  kind,
  card: t(`loyalty.card.${kind}`),
  note,
});

export function computeLoyalty(config: Config, flags: Flags, characterIds: string[]): LoyaltySetup {
  const n = characterIds.length;
  const errors: string[] = [];
  const cl = flags.cylonLeader;
  const leaders = characterIds.filter((id) => characterById[id]?.type === "cylonleader");
  if (leaders.length > 1) errors.push(t("loyalty.error.oneLeader"));
  if (cl && n < 4) errors.push(t("loyalty.error.leaderNotIn3"));

  const table = loyaltyTable(cl, flags.exodusLoyalty);
  const row = table[n];
  if (!row) errors.push(t(cl ? "loyalty.error.countWithLeader" : "loyalty.error.count"));

  const [cylon, nac] = row ?? [0, 0];
  const hasBoomer = characterIds.includes("boomer");
  const hasBaltar = characterIds.includes("gaius");
  const even = n === 4 || n === 6;
  const odd = n === 5 || n === 7;

  const deck: LoyaltyLine[] = [
    line(cylon, "cylon"),
    line(
      nac,
      "notCylon",
      t(cl ? "loyalty.note.baseWithLeader" : "loyalty.note.base", {
        count: n,
        deck: t(flags.exodusLoyalty ? "loyalty.note.deckExodus" : "loyalty.note.deckRegular"),
      }),
    ),
  ];
  if (hasBoomer) deck.push(line(1, "notCylon", t("loyalty.note.boomer")));
  if (hasBaltar) deck.push(line(1, "notCylon", t("loyalty.note.baltar")));

  const laterAdd: LoyaltyLine[] = [];
  const extras: string[] = [];

  if (config.daybreak) {
    if (cl && odd) deck.push(line(1, "mutineer", t("loyalty.note.daybreakLeaderOdd")));
    if (!cl && even) {
      deck.push(line(1, "mutineer", t("loyalty.note.daybreakEven")));
      deck.push(line(1, "notCylon", t("loyalty.note.daybreakEven")));
    }
  } else if (!cl && even) {
    if (flags.sympatheticCylon) {
      laterAdd.push(line(1, "sympatheticCylon", t("loyalty.note.sympatheticCylon")));
      extras.push(t(flags.motive ? "loyalty.extra.sympatheticMotive" : "loyalty.extra.sympatheticAgenda"));
    } else if (flags.noSympathizer) {
      laterAdd.push(line(1, "notCylon", t("loyalty.note.noSympathizer")));
      extras.push(t("loyalty.extra.noSympathizerResources"));
      extras.push(t("loyalty.extra.noSympathizerSkills"));
    } else {
      laterAdd.push(line(1, "sympathizer", t("loyalty.note.evenPlayers")));
    }
  }

  const deckSize = deck.reduce((s, l) => s + l.count, 0);
  const humansDealt = characterIds.filter((id) => characterById[id]?.type !== "cylonleader");

  const deal = (id: string, cards: number) => `${characterById[id].short}: ${tp("loyalty.cards", cards)}`;
  const firstDeal = humansDealt.map((id) => deal(id, id === "gaius" ? 2 : 1));
  if (cl) firstDeal.push(t("loyalty.leaderNoCard", { name: characterById[leaders[0]]?.short ?? t("type.cylonleader") }));

  const sleeperDeal = humansDealt.map((id) => deal(id, id === "boomer" ? 2 : 1));

  if (cl) {
    if (flags.agenda) extras.push(t(even ? "loyalty.extra.leaderSympatheticAgenda" : "loyalty.extra.leaderHostileAgenda"));
    else extras.push(t("loyalty.extra.leaderMotives"));
    extras.push(t("loyalty.extra.leaderSkills"));
  }
  if (flags.motive && !config.daybreak) {
    extras.push(t(flags.treachery ? "loyalty.extra.motiveDeckTreachery" : "loyalty.extra.motiveDeck"));
  }
  if (deck.some((l) => l.kind === "mutineer")) extras.push(t("loyalty.extra.mutineer"));

  const notACylonPool: string[] = [];
  if (flags.finalFive) notACylonPool.push(t("loyalty.pool.finalFive"));
  if (flags.personalGoal) notACylonPool.push(t("loyalty.pool.personalGoal"));

  return {
    valid: errors.length === 0,
    errors,
    players: n,
    deck,
    laterAdd,
    deckSize,
    firstDeal,
    sleeperDeal,
    extras,
    notACylonPool,
  };
}
