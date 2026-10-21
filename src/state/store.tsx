import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { characterById } from "../data/characters";
import { TITLE_LABEL, type TitleId } from "../data/succession";
import { defaultConfig, deriveFlags, normalize, type Config, type Flags } from "../logic/config";
import { computeHolder, initialTitles } from "../logic/succession";
import { saveRaw } from "./persist";

export type PlayerStatus = "human" | "brig" | "cylon";

export interface Player {
  seat: number;
  characterId: string;
  status: PlayerStatus;
}

export interface State {
  version: 1;
  config: Config;
  /** Seat order = character choice order. First entry is the first player. */
  players: Player[];
  phase: "setup" | "playing";
  titles: Partial<Record<TitleId, number>>; // seat of the holder
  /** Characters removed from the game (executed). Cannot be chosen again. */
  removed: string[];
  sleeperDone: boolean;
  log: string[];
}

const initialState: State = {
  version: 1,
  config: defaultConfig,
  players: [],
  phase: "setup",
  titles: {},
  removed: [],
  sleeperDone: false,
  log: [],
};

export type Action =
  | { type: "config"; patch: Partial<Config> }
  | { type: "addCharacter"; id: string }
  | { type: "removeSeat"; seat: number }
  | { type: "moveSeat"; seat: number; dir: -1 | 1 }
  | { type: "startGame" }
  | { type: "backToSetup" }
  | { type: "setStatus"; seat: number; status: PlayerStatus }
  | { type: "giveTitle"; title: TitleId; seat: number }
  | { type: "stripTitles"; seat: number; reason: string }
  | { type: "replaceCharacter"; seat: number; newId: string }
  | { type: "sleeper"; done: boolean }
  | { type: "reset" };

export const STORAGE_KEY = "bsg-helper-state-v1";

function parse(raw: string | null): State {
  if (!raw) return initialState;
  try {
    const parsed = JSON.parse(raw) as State;
    if (parsed.version !== 1) return initialState;
    return { ...initialState, ...parsed, config: { ...defaultConfig, ...parsed.config } };
  } catch {
    return initialState;
  }
}

export const hasCylonLeader = (players: Player[]) =>
  players.some((p) => characterById[p.characterId]?.type === "cylonleader");

const nameOf = (s: State, seat: number) =>
  characterById[s.players.find((p) => p.seat === seat)?.characterId ?? ""]?.short ?? "?";

/** Re-check every title after a status change; pass titles on when the holder is no longer eligible. */
function settleTitles(s: State, reason: string): State {
  if (s.phase !== "playing") return s;
  const titles = { ...s.titles };
  const log = [...s.log];
  for (const t of Object.keys(titles) as TitleId[]) {
    const holder = s.players.find((p) => p.seat === titles[t]);
    const next = computeHolder(t, s.players, holder);
    if (next !== undefined && next !== titles[t]) {
      log.push(`${TITLE_LABEL[t]}: ${holder ? nameOf(s, holder.seat) : "—"} → ${nameOf(s, next)} (${reason})`);
      titles[t] = next;
    }
  }
  return { ...s, titles, log };
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "config":
      return { ...s, config: normalize({ ...s.config, ...a.patch }, hasCylonLeader(s.players)) };
    case "addCharacter": {
      const seat = s.players.reduce((m, p) => Math.max(m, p.seat), -1) + 1;
      const players = [...s.players, { seat, characterId: a.id, status: "human" as const }];
      return { ...s, players, config: normalize(s.config, hasCylonLeader(players)) };
    }
    case "removeSeat": {
      const players = s.players.filter((p) => p.seat !== a.seat);
      return { ...s, players, config: normalize(s.config, hasCylonLeader(players)) };
    }
    case "moveSeat": {
      const i = s.players.findIndex((p) => p.seat === a.seat);
      const j = i + a.dir;
      if (i < 0 || j < 0 || j >= s.players.length) return s;
      const players = [...s.players];
      [players[i], players[j]] = [players[j], players[i]];
      return { ...s, players };
    }
    case "startGame": {
      const titles = initialTitles(s.players, s.config.cylonFleet);
      const log = (Object.keys(titles) as TitleId[]).map(
        (t) => `${TITLE_LABEL[t]}: ${nameOf(s, titles[t]!)} (start of game)`,
      );
      return { ...s, phase: "playing", titles, log, removed: [], sleeperDone: false };
    }
    case "backToSetup":
      return {
        ...s,
        phase: "setup",
        titles: {},
        log: [],
        players: s.players.map((p) => ({ ...p, status: "human" as const })),
      };
    case "setStatus": {
      const players = s.players.map((p) => (p.seat === a.seat ? { ...p, status: a.status } : p));
      const label = { human: "left the Brig / human", brig: "sent to the Brig", cylon: "revealed as Cylon" }[a.status];
      return settleTitles(
        { ...s, players, log: [...s.log, `${nameOf(s, a.seat)} ${label}`] },
        `${nameOf(s, a.seat)} ${label}`,
      );
    }
    case "giveTitle":
      return {
        ...s,
        titles: { ...s.titles, [a.title]: a.seat },
        log: [...s.log, `${TITLE_LABEL[a.title]} given to ${nameOf(s, a.seat)}`],
      };
    case "stripTitles": {
      // Mutineer: titles go to the highest in line *not including* this player.
      const titles = { ...s.titles };
      const log = [...s.log];
      for (const t of Object.keys(titles) as TitleId[]) {
        if (titles[t] !== a.seat) continue;
        const next = computeHolder(t, s.players.filter((p) => p.seat !== a.seat), undefined);
        if (next !== undefined) {
          titles[t] = next;
          log.push(`${TITLE_LABEL[t]}: ${nameOf(s, a.seat)} → ${nameOf(s, next)} (${a.reason})`);
        }
      }
      return { ...s, titles, log };
    }
    case "replaceCharacter": {
      const old = s.players.find((p) => p.seat === a.seat);
      if (!old) return s;
      const oldChar = characterById[old.characterId];
      const players = s.players.map((p) =>
        p.seat === a.seat ? { ...p, characterId: a.newId, status: "human" as const } : p,
      );
      // Titles the executed player held go to the first in line, *including* the new character.
      // Titles held by others do not change.
      const titles = { ...s.titles };
      const log = [...s.log, `${oldChar.short} executed (human) → now playing ${characterById[a.newId].short}`];
      for (const t of Object.keys(titles) as TitleId[]) {
        if (titles[t] !== a.seat) continue;
        const next = computeHolder(t, players, undefined);
        if (next !== undefined) {
          titles[t] = next;
          log.push(`${TITLE_LABEL[t]}: → ${characterById[players.find((p) => p.seat === next)!.characterId].short} (execution)`);
        }
      }
      return { ...s, players, titles, removed: [...s.removed, old.characterId], log };
    }
    case "sleeper":
      return { ...s, sleeperDone: a.done, log: [...s.log, a.done ? "Sleeper Agent phase done" : "Sleeper Agent phase undone"] };
    case "reset":
      return initialState;
  }
}

interface Ctx {
  state: State;
  dispatch: (a: Action) => void;
  flags: Flags;
  cylonLeader: boolean;
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children, initialRaw }: { children: ReactNode; initialRaw: string | null }) {
  const [state, dispatch] = useReducer(reducer, initialRaw, parse);
  useEffect(() => saveRaw(STORAGE_KEY, JSON.stringify(state)), [state]);
  const cylonLeader = hasCylonLeader(state.players);
  const flags = useMemo(() => deriveFlags(state.config, cylonLeader), [state.config, cylonLeader]);
  const value = useMemo(() => ({ state, dispatch, flags, cylonLeader }), [state, flags, cylonLeader]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore outside StoreProvider");
  return ctx;
}
