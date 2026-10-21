import type { Box } from "../data/characters";

// Game configuration and the derived rule flags.
// The derivation mirrors validateForm()/flipSwitches() in BSGRulebook/rulebook.md so the
// helper and the embedded rulebook always agree on which rules are in effect.

export type Ending = "kobol" | "newcaprica" | "ioniannebula" | "searchforhome";

export const ENDING_LABEL: Record<Ending, string> = {
  kobol: "Kobol",
  newcaprica: "New Caprica",
  ioniannebula: "Ionian Nebula",
  searchforhome: "Search for Home (Earth)",
};

export interface Config {
  pegasus: boolean;
  exodus: boolean;
  daybreak: boolean;
  // Exodus modules
  cylonFleet: boolean;
  personalGoal: boolean;
  finalFive: boolean;
  ending: Ending;
  // Variants
  noSympathizer: boolean;
  sympatheticCylon: boolean;
  forceExodusLoyalty: boolean; // Pegasus without Exodus, use "extra card" deck
  forcePegasusLoyalty: boolean; // Exodus, but use regular deck
  forceMotive: boolean;
  forceOverlay: boolean;
  allySeasons: boolean;
  forceDemetrius: boolean;
  /** House rule: offer characters from expansions that aren't in play. */
  allowAllCharacters: boolean;
  /** House rule: Political / Military / Pilot don't have to be chosen evenly. */
  ignoreTypeBalance: boolean;
}

export const defaultConfig: Config = {
  pegasus: false,
  exodus: false,
  daybreak: false,
  cylonFleet: false,
  personalGoal: false,
  finalFive: false,
  ending: "kobol",
  noSympathizer: false,
  sympatheticCylon: false,
  forceExodusLoyalty: false,
  forcePegasusLoyalty: false,
  forceMotive: false,
  forceOverlay: false,
  allySeasons: false,
  forceDemetrius: false,
  allowAllCharacters: false,
  ignoreTypeBalance: false,
};

/** Boxes whose characters can be chosen: the base game plus enabled expansions, or every box with the house rule. */
export function characterBoxes(c: Config): Box[] {
  if (c.allowAllCharacters) return ["core", "pegasus", "exodus", "daybreak"];
  return ["core", ...(["pegasus", "exodus", "daybreak"] as const).filter((b) => c[b])];
}

/** True when a character's box isn't one of the expansions in play. */
export const isOutsideExpansion = (c: Config, box: Box) => box !== "core" && !c[box];

/** Which options are currently selectable. */
export function allowed(c: Config, cylonLeader: boolean) {
  const loyaltyForced = c.ending === "ioniannebula" || c.allySeasons || c.personalGoal;
  return {
    cylonFleet: c.exodus,
    personalGoal: c.exodus,
    finalFive: c.exodus,
    newcaprica: c.pegasus,
    ioniannebula: c.exodus,
    searchforhome: c.daybreak,
    allySeasons: c.exodus && c.ending !== "ioniannebula",
    forcePegasusLoyalty: c.exodus && !loyaltyForced && !c.forceExodusLoyalty,
    forceExodusLoyalty: c.pegasus && !c.exodus && !loyaltyForced,
    forceDemetrius: c.daybreak && c.ending !== "searchforhome",
    cylonLeader: c.pegasus || c.daybreak,
    noSympathizer: !cylonLeader && !c.daybreak && !c.sympatheticCylon,
    sympatheticCylon: !cylonLeader && !c.daybreak && !c.noSympathizer,
    forceMotive: !c.daybreak && (cylonLeader || c.sympatheticCylon),
    forceOverlay: !(c.daybreak || c.pegasus || c.sympatheticCylon),
  };
}

/** Drop any option that is no longer allowed (e.g. after turning an expansion off). */
export function normalize(c: Config, cylonLeader: boolean): Config {
  let next = { ...c };
  // Iterate because one change can disable another.
  for (let i = 0; i < 3; i++) {
    const a = allowed(next, cylonLeader);
    const endingOk =
      next.ending === "kobol" ||
      (next.ending === "newcaprica" && a.newcaprica) ||
      (next.ending === "ioniannebula" && a.ioniannebula) ||
      (next.ending === "searchforhome" && a.searchforhome);
    next = {
      ...next,
      ending: endingOk ? next.ending : "kobol",
      cylonFleet: next.cylonFleet && a.cylonFleet,
      personalGoal: next.personalGoal && a.personalGoal,
      finalFive: next.finalFive && a.finalFive,
      allySeasons: next.allySeasons && a.allySeasons,
      forcePegasusLoyalty: next.forcePegasusLoyalty && a.forcePegasusLoyalty,
      forceExodusLoyalty: next.forceExodusLoyalty && a.forceExodusLoyalty,
      forceDemetrius: next.forceDemetrius && a.forceDemetrius,
      noSympathizer: next.noSympathizer && a.noSympathizer,
      sympatheticCylon: next.sympatheticCylon && a.sympatheticCylon,
      forceMotive: next.forceMotive && a.forceMotive,
      forceOverlay: next.forceOverlay && a.forceOverlay,
    };
  }
  return next;
}

export interface Flags {
  pegasus: boolean;
  exodus: boolean;
  daybreak: boolean;
  cylonFleet: boolean;
  personalGoal: boolean;
  finalFive: boolean;
  cylonLeader: boolean;
  ending: Ending;
  expansion: boolean;
  execution: boolean;
  exodusLoyalty: boolean;
  treachery: boolean;
  infiltrator: boolean;
  motive: boolean;
  agenda: boolean;
  allies: boolean;
  allySeasons: boolean;
  overlay: boolean;
  demetrius: boolean;
  noSympathizer: boolean;
  sympatheticCylon: boolean;
  /** Base-game Sympathizer card is in use (4/6 players only) */
  sympathizer: boolean;
}

export function deriveFlags(c: Config, cylonLeader: boolean): Flags {
  const infiltrator = cylonLeader || c.sympatheticCylon;
  const motive = infiltrator && (c.daybreak || c.forceMotive);
  return {
    pegasus: c.pegasus,
    exodus: c.exodus,
    daybreak: c.daybreak,
    cylonFleet: c.cylonFleet,
    personalGoal: c.personalGoal,
    finalFive: c.finalFive,
    cylonLeader,
    ending: c.ending,
    expansion: c.pegasus || c.exodus || c.daybreak,
    execution: c.pegasus || c.exodus,
    exodusLoyalty: (c.exodus && !c.forcePegasusLoyalty) || c.forceExodusLoyalty,
    treachery: c.pegasus || c.daybreak,
    infiltrator,
    motive,
    agenda: infiltrator && !motive,
    allies: c.ending === "ioniannebula" || c.allySeasons,
    allySeasons: c.allySeasons,
    overlay: c.pegasus || c.daybreak || c.sympatheticCylon || c.forceOverlay,
    demetrius: c.ending === "searchforhome" || c.forceDemetrius,
    noSympathizer: c.noSympathizer,
    sympatheticCylon: c.sympatheticCylon,
    sympathizer: !c.daybreak && !cylonLeader && !c.sympatheticCylon && !c.noSympathizer,
  };
}

/**
 * CSS classes the rulebook hides for this configuration. An element in the rulebook is hidden
 * when ANY of its classes is in this set (same semantics as the original jQuery code).
 */
export function rulebookHiddenClasses(c: Config, cylonLeader: boolean, showVariants: boolean): Set<string> {
  const f = deriveFlags(c, cylonLeader);
  const on: Record<string, boolean> = {
    pegasus: c.pegasus,
    forceexodus: c.forceExodusLoyalty,
    exodus: c.exodus,
    personalgoal: c.personalGoal,
    finalfive: c.finalFive,
    cylonfleet: c.cylonFleet,
    allyseasons: c.allySeasons,
    forcepegasus: c.forcePegasusLoyalty,
    daybreak: c.daybreak,
    forcedemetrius: c.forceDemetrius,
    cylonleader: cylonLeader,
    kobol: c.ending === "kobol",
    newcaprica: c.ending === "newcaprica",
    ioniannebula: c.ending === "ioniannebula",
    searchforhome: c.ending === "searchforhome",
    allendings: false,
    nosympathizer: c.noSympathizer,
    sympatheticcylon: c.sympatheticCylon,
    forceoverlay: c.forceOverlay,
    forcemotive: c.forceMotive,
    variants: showVariants,
    help: false,
    highlight: false,
    preconfigured: false,
    expansion: f.expansion,
    execution: f.execution,
    exodusloyalty: f.exodusLoyalty,
    treachery: f.treachery,
    infiltrator: f.infiltrator,
    allies: f.allies,
    overlay: f.overlay,
    demetrius: f.demetrius,
  };
  const hidden = new Set<string>(["nojs"]);
  for (const [k, v] of Object.entries(on)) hidden.add(v ? `no${k}` : k);
  // agenda / motive only exist when there is an infiltrator; no "no" variants.
  if (!f.agenda) hidden.add("agenda");
  if (!f.motive) hidden.add("motive");
  return hidden;
}
