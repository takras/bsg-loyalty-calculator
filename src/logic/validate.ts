import { characterById, type CharacterType } from "../data/characters";
import type { Config } from "./config";

export interface Issue {
  level: "error" | "warning";
  text: string;
  /** Character ids involved, so the picker can mark them */
  ids?: string[];
}

/**
 * Checks a finished character line-up against the selection rules. Players choose their characters
 * at the table; the app only verifies the result.
 */
export function validateLineup(ids: string[], config: Config): Issue[] {
  const issues: Issue[] = [];
  const chars = ids.map((id) => characterById[id]).filter(Boolean);
  const leaders = chars.filter((c) => c.type === "cylonleader");
  const n = chars.length;

  if (n === 0) return issues;

  // Player count
  if (leaders.length > 0) {
    if (n < 4 || n > 7)
      issues.push({ level: "error", text: `With a Cylon Leader the game needs 4–7 players (you have ${n}).` });
  } else if (n < 3 || n > 6) {
    issues.push({ level: "error", text: `The game needs 3–6 players, or 7 with a Cylon Leader (you have ${n}).` });
  }

  // Cylon Leaders
  if (leaders.length > 1)
    issues.push({ level: "error", text: "Only one player may be a Cylon Leader.", ids: leaders.map((c) => c.id) });

  // Original + alternate of the same person
  for (const c of chars) {
    if (c.version === "original" && c.versionOf && ids.includes(c.versionOf)) {
      issues.push({
        level: "error",
        text: `${c.name}: both the original and alternate version are chosen – only one is allowed.`,
        ids: [c.id, c.versionOf],
      });
    }
  }

  // Political / Military / Pilot must be chosen evenly (Support and Cylon Leaders are free).
  // Picked in order, the final counts can differ by at most 1.
  const types: CharacterType[] = ["political", "military", "pilot"];
  const count = (t: CharacterType) => chars.filter((c) => c.type === t).length;
  const counts = types.map(count);
  const max = Math.max(...counts);
  const min = Math.min(...counts);
  if (!config.ignoreTypeBalance && max - min > 1) {
    const over = types.filter((t) => count(t) === max);
    issues.push({
      level: "warning",
      text: `Uneven types: ${counts[0]} Political, ${counts[1]} Military, ${counts[2]} Pilot. The rules require these to be chosen evenly (Support is free).`,
      ids: chars.filter((c) => over.includes(c.type)).map((c) => c.id),
    });
  }

  // No Sympathizer variant forbids Boomer at 4/6 players
  if (config.noSympathizer && (n === 4 || n === 6) && ids.includes("boomer")) {
    issues.push({
      level: "warning",
      text: "No Sympathizer variant (4/6 players) normally excludes Boomer. You may ignore this; use the Sympathizer card as an extra “Not a Cylon”.",
      ids: ["boomer"],
    });
  }

  return issues;
}
