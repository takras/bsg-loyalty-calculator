import { characterById } from "../data/characters";
import type { Config, Flags } from "./config";

export interface ChecklistSection {
  title: string;
  items: string[];
}

/** Board/component setup steps for the chosen configuration (summarised from the unified rulebook). */
export function setupChecklist(config: Config, f: Flags, characterIds: string[]): ChecklistSection[] {
  const out: ChecklistSection[] = [];
  const push = (title: string, items: (string | false | undefined)[]) => {
    const list = items.filter(Boolean) as string[];
    if (list.length) out.push({ title, items: list });
  };

  const nosymp = f.noSympathizer && (characterIds.length === 4 || characterIds.length === 6);
  push("Main board", [
    nosymp
      ? "Resources: 8 fuel, 7 food, 9 morale, 10 population (No Sympathizer variant)."
      : "Resources: 8 fuel, 8 food, 10 morale, 12 population.",
    "Ships: 1 basestar + 3 raiders in front of Galactica, 2 vipers below (launch tube areas), 2 civilian ships behind.",
    "Vipers and raptors in the Reserves, fleet marker on the start of the jump track.",
    "Admiral gets 2 nukes.",
    "Skill decks by the board, each with its own face-up discard pile.",
    `Destiny deck: 2 of each Skill type${f.treachery ? " (including 2 Treachery)" : ""}, shuffled.`,
    f.overlay && !f.pegasus && !f.daybreak && "Cover the Cylon Locations with a Cylon Locations overlay (from Pegasus or Daybreak).",
  ]);

  if (f.pegasus)
    push("Pegasus", [
      "Swap the base game “Investigative Committee” Politics cards for the Pegasus ones.",
      "Pegasus board to the right of the main board; Pegasus damage tokens.",
      !f.daybreak && "Place the Pegasus “Cylon Locations” overlay.",
      f.daybreak
        ? "Add the new Skill cards but NOT the Pegasus Treachery cards (Daybreak’s are used)."
        : "Add the new Skill cards, including the Reckless Treachery cards.",
      "Add the new Crisis, Destination, Quorum, Super Crisis and Loyalty cards.",
      "Scar token with the Cylon ships.",
    ]);

  if (f.exodus)
    push("Exodus", [
      f.cylonFleet
        ? "Add all new Crisis/Super Crisis cards, including “CAG Chooses”."
        : "Add the new Crisis/Super Crisis cards, except those that say “CAG Chooses”.",
      "Add the new Quorum, Skill and Destination cards.",
      "Put the 3rd nuke token by the board (Admiral still starts with 2; nukes are discarded, not removed).",
    ]);

  if (f.cylonFleet)
    push("Cylon Fleet board", [
      "Remove ALL Cylon Attack cards from the Crisis and Super Crisis decks, and the “Mining Asteroid” destination.",
      "Cylon Fleet board to the left of the main board, pursuit marker on Start.",
      "Remove 2 regular vipers; put the 4 Mark VII vipers in the Damaged Vipers box.",
      "Add the 4 extra raiders (20 total).",
      "Add the CAG title card.",
      `Use the Exodus Admiral title card (new nuke rules)${f.ending === "newcaprica" ? " together with the New Caprica Admiral card" : ""}.`,
    ]);

  if (f.daybreak)
    push("Daybreak", [
      "Colonial One overlay and Daybreak Cylon Locations overlay (destroyed sides face down).",
      "1 assault raptor in the Reserves, the rest by the board.",
      "Shuffle the Mutiny deck.",
      f.pegasus
        ? "Add the new Skill cards incl. Daybreak Treachery; remove the Pegasus Treachery cards."
        : "Add the new Skill cards incl. the Mutiny Treachery cards.",
      "Give each player 1 Miracle token.",
      f.demetrius && "Demetrius board left of the main board (room for the Rebel Basestar); shuffle the Mission deck.",
    ]);

  const endingItems: Record<string, string[]> = {
    kobol: ["Give the Kobol objective card to the Admiral."],
    newcaprica: [
      "Give the New Caprica objective card to the Admiral.",
      "Use the New Caprica President and Admiral title cards.",
      "Keep the New Caprica board, New Caprica Crisis deck and Occupation Force tokens ready.",
    ],
    ioniannebula: [
      "Give the Ionian Nebula objective card to the Admiral.",
      "Use the rectangular basestar damage tokens (remove the old ones).",
      "Trauma tokens face down and mixed; Crossroads cards shuffled aside; Ally cards shuffled, Ally tokens ready.",
      "After choosing characters: 1 Trauma token face down in the Brig and 1 in Sickbay.",
      "Each player draws 3 Trauma tokens (a Disaster drawn now is shown, replaced and returned).",
      "Place Allies until 3 are on the board (skip duplicates of chosen characters), each with a face-down Trauma token.",
    ],
    searchforhome: [
      "Give the Earth objective card to the Admiral.",
      "Demetrius board left of the main board; shuffle the Mission deck.",
    ],
  };
  push(`Ending: ${{ kobol: "Kobol", newcaprica: "New Caprica", ioniannebula: "Ionian Nebula", searchforhome: "Search for Home" }[config.ending]}`, endingItems[config.ending]);

  if (f.allySeasons)
    push("Allies for All Seasons", [
      "Remove all Disaster trauma tokens; mix the rest face down.",
      "Place Allies until 3 are on the board (skip duplicates of chosen characters).",
      "Each player draws 4 Trauma tokens and puts 1 into the Mood Pool.",
    ]);

  if (f.cylonLeader)
    push("Cylon Leader", ["Add the Cylon Leader sheet and the Infiltrator card."]);

  const charNotes = characterIds.flatMap((id) => {
    const c = characterById[id];
    return (c?.notes ?? []).map((n) => `${c.short}: ${n}`);
  });
  push("Characters", [
    "Distribute titles to the highest in each line of succession (see below / Titles tab).",
    "Every player except the first draws 3 Skill cards from their skill set.",
    ...charNotes,
    f.daybreak && characterIds.includes("tom-alt") && "Tom Zarek (Military)’s “Necessary Steps” applies to his own setup Mutiny draw.",
  ]);

  return out;
}
