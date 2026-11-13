import { characterById, type CharacterType } from "../data/characters";
import { t } from "../i18n";
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
      issues.push({ level: "error", text: t("validate.countWithLeader", { count: n }) });
  } else if (n < 3 || n > 6) {
    issues.push({ level: "error", text: t("validate.count", { count: n }) });
  }

  // Cylon Leaders
  if (leaders.length > 1)
    issues.push({ level: "error", text: t("validate.oneLeader"), ids: leaders.map((c) => c.id) });

  // Original + alternate of the same person
  for (const c of chars) {
    if (c.version === "original" && c.versionOf && ids.includes(c.versionOf)) {
      issues.push({
        level: "error",
        text: t("validate.bothVersions", { name: c.name }),
        ids: [c.id, c.versionOf],
      });
    }
  }

  // Political / Military / Pilot must be chosen evenly (Support and Cylon Leaders are free).
  // Picked in order, the final counts can differ by at most 1.
  const types: CharacterType[] = ["political", "military", "pilot"];
  const count = (type: CharacterType) => chars.filter((c) => c.type === type).length;
  const counts = types.map(count);
  const max = Math.max(...counts);
  const min = Math.min(...counts);
  if (!config.ignoreTypeBalance && max - min > 1) {
    const over = types.filter((type) => count(type) === max);
    issues.push({
      level: "warning",
      text: t("validate.unevenTypes", { political: counts[0], military: counts[1], pilot: counts[2] }),
      ids: chars.filter((c) => over.includes(c.type)).map((c) => c.id),
    });
  }

  // No Sympathizer variant forbids Boomer at 4/6 players
  if (config.noSympathizer && (n === 4 || n === 6) && ids.includes("boomer")) {
    issues.push({
      level: "warning",
      text: t("validate.noSympathizerBoomer"),
      ids: ["boomer"],
    });
  }

  return issues;
}
