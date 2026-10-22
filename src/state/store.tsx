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
  /** Players in the order their characters were picked. `seat` is just a stable id; the app doesn't track seating. */
  players: Player[];
  phase: "setup" | "playing";
  titles: Partial<Record<TitleId, number>>; // seat of the holder
  /** Characters removed from the game (executed). Cannot be chosen again. */
  removed: string[];
  /** Seat of the player holding the Mutineer card (Daybreak). */
  mutineer?: number;
  log: string[];
}

const initialState: State = {
  version: 1,
  config: defaultConfig,
  players: [],
  phase: "setup",
  titles: {},
  removed: [],
  log: [],
};

export type Action =
  | { type: "config"; patch: Partial<Config> }
  | { type: "addCharacter"; id: string }
  | { type: "removeSeat"; seat: number }
  | { type: "startGame" }
  | { type: "backToSetup" }
  | { type: "setStatus"; seat: number; status: PlayerStatus }
  | { type: "giveTitle"; title: TitleId; seat: number }
  | { type: "setMutineer"; seat: number | null }
  | { type: "replaceCharacter"; seat: number; newId: string }
  | { type: "reset" };

export const STORAGE_KEY = "bsg-helper-state-v1";

function parse(raw: string | null): State {
  if (!raw) return initialState;
  try {
    const parsed = JSON.parse(raw) as State;
    if (parsed.version !== 1) return initialState;
    // Drop players whose character no longer exists (e.g. a renamed id), rather than crashing on them.
    const players = (parsed.players ?? []).filter((p) => characterById[p.characterId]);
    return { ...initialState, ...parsed, players, config: { ...defaultConfig, ...parsed.config } };
  } catch {
    return initialState;
  }
}

export const hasCylonLeader = (players: Player[]) =>
  players.some((p) => characterById[p.characterId]?.type === "cylonleader");

const nameOf = (s: State, seat: number) =>
  characterById[s.players.find((p) => p.seat === seat)?.characterId ?? ""]?.short ?? "?";

/** Hand all of a player's titles to the highest in line *not including* them (receiving the Mutineer). */
function stripTitles(s: State, seat: number, reason: string): State {
  const titles = { ...s.titles };
  const log = [...s.log];
  for (const t of Object.keys(titles) as TitleId[]) {
    if (titles[t] !== seat) continue;
    const next = computeHolder(t, s.players.filter((p) => p.seat !== seat), undefined);
    if (next !== undefined) {
      titles[t] = next;
      log.push(`${TITLE_LABEL[t]}: ${nameOf(s, seat)} → ${nameOf(s, next)} (${reason})`);
    }
  }
  return { ...s, titles, log };
}

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
    case "startGame": {
      const titles = initialTitles(s.players, s.config.cylonFleet);
      const log = (Object.keys(titles) as TitleId[]).map(
        (t) => `${TITLE_LABEL[t]}: ${nameOf(s, titles[t]!)} (start of game)`,
      );
      return { ...s, phase: "playing", titles, log, removed: [], mutineer: undefined };
    }
    case "backToSetup":
      return {
        ...s,
        phase: "setup",
        titles: {},
        log: [],
        mutineer: undefined,
        players: s.players.map((p) => ({ ...p, status: "human" as const })),
      };
    case "setStatus": {
      const players = s.players.map((p) => (p.seat === a.seat ? { ...p, status: a.status } : p));
      const label = { human: "left the Brig / human", brig: "sent to the Brig", cylon: "revealed as Cylon" }[a.status];
      const log = [...s.log, `${nameOf(s, a.seat)} ${label}`];
      // A Mutineer who reveals hands the card to a human player of their choice.
      const handOff = a.status === "cylon" && s.mutineer === a.seat;
      if (handOff) log.push(`${nameOf(s, a.seat)} must hand the Mutineer card to a human player`);
      return settleTitles(
        { ...s, players, log, mutineer: handOff ? undefined : s.mutineer },
        `${nameOf(s, a.seat)} ${label}`,
      );
    }
    case "giveTitle":
      return {
        ...s,
        titles: { ...s.titles, [a.title]: a.seat },
        log: [...s.log, `${TITLE_LABEL[a.title]} given to ${nameOf(s, a.seat)}`],
      };
    case "setMutineer": {
      if (a.seat === null) return { ...s, mutineer: undefined, log: [...s.log, "Mutineer cleared"] };
      const received = { ...s, mutineer: a.seat, log: [...s.log, `${nameOf(s, a.seat)} received the Mutineer`] };
      return stripTitles(received, a.seat, "received the Mutineer");
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
      const updated = { ...s, players, titles, removed: [...s.removed, old.characterId], log };
      // An executed Mutineer's new character receives the card again, as if just received.
      return s.mutineer === a.seat ? stripTitles(updated, a.seat, "received the Mutineer") : updated;
    }
    case "reset":
      // Start a new game but keep the game settings (expansions, modules, ending, variants).
      return { ...initialState, config: normalize(s.config, false) };
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
