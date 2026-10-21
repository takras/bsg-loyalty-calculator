import { characterById } from "../data/characters";
import type { Config, Flags } from "./config";

export interface LoyaltyLine {
  count: number;
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

export function computeLoyalty(config: Config, flags: Flags, characterIds: string[]): LoyaltySetup {
  const n = characterIds.length;
  const errors: string[] = [];
  const cl = flags.cylonLeader;
  const leaders = characterIds.filter((id) => characterById[id]?.type === "cylonleader");
  if (leaders.length > 1) errors.push("Only one player may choose a Cylon Leader.");
  if (cl && n < 4) errors.push("Cylon Leaders cannot be used in a 3 player game (needs 4–7 players).");

  const table = loyaltyTable(cl, flags.exodusLoyalty);
  const row = table[n];
  if (!row) {
    errors.push(
      cl
        ? "With a Cylon Leader the game needs 4–7 players (including the Leader)."
        : "The game needs 3–6 players (7 only with a Cylon Leader).",
    );
  }

  const [cylon, nac] = row ?? [0, 0];
  const hasBoomer = characterIds.includes("boomer");
  const hasBaltar = characterIds.includes("gaius");
  const even = n === 4 || n === 6;
  const odd = n === 5 || n === 7;

  const deck: LoyaltyLine[] = [
    { count: cylon, card: "You Are a Cylon" },
    {
      count: nac,
      card: "You Are Not a Cylon",
      note: `${n} players${cl ? " incl. Cylon Leader" : ""}, ${flags.exodusLoyalty ? "Exodus “extra card”" : "regular"} deck`,
    },
  ];
  if (hasBoomer) deck.push({ count: 1, card: "You Are Not a Cylon", note: "Boomer chosen" });
  if (hasBaltar) deck.push({ count: 1, card: "You Are Not a Cylon", note: "Gaius Baltar (Political) chosen" });

  const laterAdd: LoyaltyLine[] = [];
  const extras: string[] = [];

  if (config.daybreak) {
    if (cl && odd) deck.push({ count: 1, card: "You Are the Mutineer", note: "Daybreak, Cylon Leader, 5 or 7 players" });
    if (!cl && even) {
      deck.push({ count: 1, card: "You Are the Mutineer", note: "Daybreak, 4 or 6 players" });
      deck.push({ count: 1, card: "You Are Not a Cylon", note: "Daybreak, 4 or 6 players" });
    }
  } else if (!cl && even) {
    if (flags.sympatheticCylon) {
      laterAdd.push({ count: 1, card: "You Are a Sympathetic Cylon", note: "Sympathetic Cylon variant" });
      extras.push(
        flags.motive
          ? "Keep the Motive deck and the Infiltration card ready for the Sympathetic Cylon."
          : "Keep the Sympathetic Agenda cards (Caprica Six on the back) and the Infiltration card ready.",
      );
    } else if (flags.noSympathizer) {
      laterAdd.push({ count: 1, card: "You Are Not a Cylon", note: "No Sympathizer variant" });
      extras.push("No Sympathizer: set resources to 8 fuel, 7 food, 9 morale, 10 population.");
      extras.push("No Sympathizer: revealed Cylons draw 3 Skill cards instead of 2.");
    } else {
      laterAdd.push({ count: 1, card: "You Are a Sympathizer", note: "4 or 6 players" });
    }
  }

  const deckSize = deck.reduce((s, l) => s + l.count, 0);
  const humansDealt = characterIds.filter((id) => characterById[id]?.type !== "cylonleader");

  const firstDeal = humansDealt.map((id) =>
    id === "gaius" ? `${characterById[id].short}: 2 cards` : `${characterById[id].short}: 1 card`,
  );
  if (cl) firstDeal.push(`${characterById[leaders[0]]?.short ?? "Cylon Leader"}: no Loyalty card`);

  const sleeperDeal = humansDealt.map((id) =>
    id === "boomer" ? `${characterById[id].short}: 2 cards` : `${characterById[id].short}: 1 card`,
  );

  if (cl) {
    if (flags.agenda) {
      extras.push(
        even
          ? "Cylon Leader: deal 1 random Sympathetic Agenda card (Caprica Six on the back)."
          : "Cylon Leader: deal 1 random Hostile Agenda card (Centurion on the back).",
      );
    } else {
      extras.push("Cylon Leader: deal 2 random Motive cards now, and 2 more at the Sleeper Agent phase.");
    }
    extras.push("Cylon Leader draws 2 Skill cards at start (instead of 3) unless starting as an Infiltrator.");
  }
  if (flags.motive && !config.daybreak) {
    extras.push(
      flags.treachery
        ? "Motive deck: remove “Make an Ally”, then remove 1 random card of the 7 with Cylon allegiance."
        : "Motive deck: remove “Make an Ally” and “Fight with Honor”.",
    );
  }
  if (deck.some((l) => l.card === "You Are the Mutineer")) {
    extras.push("If the Mutineer is still in the deck after the Sleeper Agent phase, the current player picks a human to draw 1 more Loyalty card.");
  }

  const notACylonPool: string[] = [];
  if (flags.finalFive) notACylonPool.push("Final Five cards");
  if (flags.personalGoal) notACylonPool.push("Personal Goal cards");

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
