import { characterById } from "../data/characters";
import { succession, type TitleId } from "../data/succession";
import type { Player } from "../state/store";

/** Players who can hold titles at all: human players (Cylon Leaders and revealed Cylons cannot). */
export function canHoldTitle(p: Player): boolean {
  return p.status !== "cylon" && characterById[p.characterId]?.type !== "cylonleader";
}

/** Players ranked by the line of succession for a title. */
export function ranked(title: TitleId, players: Player[]): Player[] {
  const order = succession[title];
  return players
    .filter((p) => order.includes(p.characterId))
    .sort((a, b) => order.indexOf(a.characterId) - order.indexOf(b.characterId));
}

/**
 * Who should hold the title given the current holder.
 * - Holder still eligible → keeps it (titles never move just because someone higher appears).
 * - Otherwise → highest eligible in the line. For Admiral/CAG players in the Brig are skipped,
 *   unless everyone eligible is in the Brig.
 */
export function computeHolder(title: TitleId, players: Player[], holder: Player | undefined): number | undefined {
  const brigMatters = title !== "president";
  if (holder && canHoldTitle(holder) && !(brigMatters && holder.status === "brig")) return holder.seat;

  const line = ranked(title, players).filter(canHoldTitle);
  if (line.length === 0) return undefined;
  if (brigMatters) {
    const free = line.find((p) => p.status !== "brig");
    if (free) return free.seat;
    // Everyone eligible is in the Brig: highest in line holds it until someone leaves the Brig.
  }
  return line[0].seat;
}

export function initialTitles(players: Player[], cylonFleet: boolean): Partial<Record<TitleId, number>> {
  const result: Partial<Record<TitleId, number>> = {};
  const titles: TitleId[] = cylonFleet ? ["president", "admiral", "cag"] : ["president", "admiral"];
  for (const t of titles) {
    const seat = computeHolder(t, players, undefined);
    if (seat !== undefined) result[t] = seat;
  }
  return result;
}
