import { characterById } from "../data/characters";
import { t } from "../i18n";
import { endingLabel, type Config, type Flags } from "./config";

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
  // checklist.<section>.<item>
  const c = (key: string, vars?: Record<string, string | number>) => t(`checklist.${key}`, vars);

  const nosymp = f.noSympathizer && (characterIds.length === 4 || characterIds.length === 6);
  push(c("main.title"), [
    c(nosymp ? "main.resourcesNoSympathizer" : "main.resources"),
    c("main.ships"),
    c("main.reserves"),
    c("main.nukes"),
    c("main.skillDecks"),
    c("main.destiny", { treachery: f.treachery ? c("main.destinyTreachery") : "" }),
    f.overlay && !f.pegasus && !f.daybreak && c("main.overlay"),
  ]);

  if (f.pegasus)
    push(c("pegasus.title"), [
      c("pegasus.politics"),
      c("pegasus.board"),
      !f.daybreak && c("pegasus.overlay"),
      c(f.daybreak ? "pegasus.skillsDaybreak" : "pegasus.skills"),
      c("pegasus.cards"),
      c("pegasus.scar"),
    ]);

  if (f.exodus)
    push(c("exodus.title"), [
      c(f.cylonFleet ? "exodus.crisisWithCag" : "exodus.crisis"),
      c("exodus.cards"),
      c("exodus.nuke"),
    ]);

  if (f.cylonFleet)
    push(c("cylonFleet.title"), [
      c("cylonFleet.removeAttacks"),
      c("cylonFleet.board"),
      c("cylonFleet.vipers"),
      c("cylonFleet.raiders"),
      c("cylonFleet.cag"),
      c("cylonFleet.admiral", { newCaprica: f.ending === "newcaprica" ? c("cylonFleet.admiralNewCaprica") : "" }),
    ]);

  if (f.daybreak)
    push(c("daybreak.title"), [
      c("daybreak.overlays"),
      c("daybreak.assaultRaptor"),
      c("daybreak.mutiny"),
      c(f.pegasus ? "daybreak.skillsPegasus" : "daybreak.skills"),
      c("daybreak.miracle"),
      f.demetrius && c("daybreak.demetrius"),
    ]);

  const endingItems: Record<string, string[]> = {
    kobol: ["kobol.objective"],
    newcaprica: ["newcaprica.objective", "newcaprica.titles", "newcaprica.board"],
    ioniannebula: [
      "ioniannebula.objective",
      "ioniannebula.basestarTokens",
      "ioniannebula.trauma",
      "ioniannebula.brigSickbay",
      "ioniannebula.draw",
      "ioniannebula.allies",
    ],
    searchforhome: ["searchforhome.objective", "searchforhome.demetrius"],
  };
  push(
    c("ending.title", { name: endingLabel(config.ending) }),
    endingItems[config.ending].map((k) => c(`ending.${k}`)),
  );

  if (f.allySeasons)
    push(c("allySeasons.title"), [c("allySeasons.trauma"), c("allySeasons.allies"), c("allySeasons.draw")]);

  if (f.cylonLeader) push(c("cylonLeader.title"), [c("cylonLeader.sheet")]);

  const charNotes = characterIds.flatMap((id) => {
    const ch = characterById[id];
    return (ch?.notes ?? []).map((n) => `${ch.short}: ${n}`);
  });
  push(c("characters.title"), [
    c("characters.titles"),
    c("characters.skills"),
    ...charNotes,
    f.daybreak && characterIds.includes("tom-alt") && c("characters.tomNecessarySteps"),
  ]);

  return out;
}
