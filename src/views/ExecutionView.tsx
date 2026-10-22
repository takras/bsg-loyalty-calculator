import { useState } from "react";
import { CharacterTile, Portrait } from "../components/CharacterTile";
import { RowPortrait, useRowPortraitSize } from "../components/RowPortrait";
import { characterById, characters } from "../data/characters";
import { characterBoxes } from "../logic/config";
import { TITLE_LABEL, type TitleId } from "../data/succession";
import { useStore } from "../state/store";

type Who = "human" | "hidden" | "revealed";

// New characters whose setup depends on whether the Sleeper Agent phase has happened.
const SLEEPER_SENSITIVE = ["boomer", "gaius"];

export function ExecutionView({ seat, go }: { seat?: number; go: (tab: string) => void }) {
  const { state, dispatch, flags } = useStore();
  const { players, config, titles, removed } = state;
  const [who, setWho] = useState<Who | null>(null);
  const [newId, setNewId] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const pickPortrait = useRowPortraitSize();

  const player = players.find((p) => p.seat === seat);
  const char = player ? characterById[player.characterId] : undefined;
  const isLeader = char?.type === "cylonleader";
  const heldTitles = player ? (Object.keys(titles) as TitleId[]).filter((t) => titles[t] === player.seat) : [];
  // The Sleeper Agent phase only matters if the executed character was Boomer or the new one is Boomer/Baltar,
  // so the switch is only shown then, next to the instructions it changes.
  const executedBoomer = player?.characterId === "boomer";
  // Asked fresh for every execution and required before confirming, so it can't be skipped or carried over stale.
  const [sleeper, setSleeper] = useState<boolean | null>(null);
  const sleeperQuestion = <SleeperQuestion value={sleeper} onChange={setSleeper} />;
  const sleeperNeeded = executedBoomer || (newId !== null && SLEEPER_SENSITIVE.includes(newId));
  const resurrection =
    config.ending === "newcaprica"
      ? "the Resurrection Ship (or the Medical Center during the New Caprica phase before Galactica returns)"
      : "the Resurrection Ship";

  const restart = (s?: number) => {
    setWho(null);
    setNewId(null);
    setDone(null);
    go(s === undefined ? "execution" : `execution/${s}`);
  };

  if (!flags.execution) {
    return (
      <div className="view">
        <div className="callout">
          Execution comes with <strong>Pegasus</strong> or <strong>Exodus</strong>. Enable one in{" "}
          <button className="link" onClick={() => go("setup")}>Setup</button> to see the procedure.
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="view">
        <section className="card">
          <h2>Execution resolved</h2>
          <p>{done}</p>
          <div className="btn-row">
            <button className="primary" onClick={() => go("titles")}>Back to Titles</button>
            <button onClick={() => restart()}>Another execution</button>
          </div>
        </section>
      </div>
    );
  }

  if (!player || !char) {
    return (
      <div className="view execution">
        <section className="card">
          <h2>Who is being executed?</h2>
          {players.length === 0 ? (
            <p className="muted">
              No players set up. <button className="link" onClick={() => go("setup")}>Choose characters</button> or read the
              general procedure in the <button className="link" onClick={() => go("rulebook")}>rulebook</button>.
            </p>
          ) : (
            <div className="pick-list">
              {players.map((p) => {
                const c = characterById[p.characterId];
                return (
                  <button key={p.seat} className="pick" onClick={() => restart(p.seat)}>
                    <RowPortrait c={c} size={pickPortrait.size} onHeight={pickPortrait.onHeight(p.seat)} />
                    {/* name with the status badge under it, so the badge never runs off a narrow button */}
                    <span className="pick-text">
                      <span className="pick-name">{c.short}</span>
                      {p.status !== "human" && <span className="badge warn">{p.status === "cylon" ? "Revealed Cylon" : "In Brig"}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  }

  const autoWho: Who | null = isLeader || player.status === "cylon" ? "revealed" : who;

  // Characters a human may pick after execution.
  const boxes = characterBoxes(config);
  const inPlay = players.map((p) => p.characterId);
  const available = characters.filter(
    (c) =>
      boxes.includes(c.box) &&
      c.type !== "cylonleader" &&
      !inPlay.includes(c.id) &&
      !removed.includes(c.id) &&
      !(c.versionOf && inPlay.filter((id) => id !== player.characterId).includes(c.versionOf)),
  );
  // The executed character itself is removed too.
  const choices = available.filter((c) => c.id !== player.characterId && c.versionOf !== player.characterId);

  return (
    <div className="view execution">
      <section className="card exec-head">
        <Portrait c={char} size={56} />
        <div>
          <h2>Executing {char.short}</h2>
          {heldTitles.length > 0 && (
            <div>
              Holds: {heldTitles.map((t) => <span key={t} className={`badge title-${t}`}>{TITLE_LABEL[t]}</span>)}
            </div>
          )}
        </div>
        <button className="link small" onClick={() => restart()}>change</button>
      </section>

      <section className="card">
        <h3>Step 1 · Everyone</h3>
        <ol className="steps">
          <li>Discard your entire hand of Skill cards.</li>
          <li>
            Discard Quorum cards <em>attached to your character</em> (e.g. Assign Vice President – not the President’s hand)
            {config.daybreak && ", all Mutiny cards and your Miracle token"}.
          </li>
          {flags.exodusLoyalty && (
            <li>If you were the current player: finish the execution, then skip your remaining move, action and Crisis steps.</li>
          )}
          {flags.allies && <li>If an Ally executed you, replace that Ally afterwards as if its location was damaged.</li>}
        </ol>
      </section>

      <section className="card">
        <h3>Step 2 · Is the player human or Cylon?</h3>
        {isLeader || player.status === "cylon" ? (
          <p className="muted">{isLeader ? "Cylon Leader" : "Already a revealed Cylon"} – Cylon procedure below.</p>
        ) : (
          <>
            <p className="muted small">The executed player checks their Loyalty cards.</p>
            <div className="choice-row">
              <button className={`choice human ${who === "human" ? "active" : ""}`} onClick={() => setWho("human")}>
                <strong>Human</strong>
                <span>No “You Are a Cylon” card</span>
              </button>
              <button className={`choice cylon ${who === "hidden" ? "active" : ""}`} onClick={() => setWho("hidden")}>
                <strong>Cylon</strong>
                <span>Has a “You Are a Cylon” card</span>
              </button>
            </div>
          </>
        )}
      </section>

      {autoWho === "hidden" && (
        <section className="card cylon-card">
          <h3>Step 3 · Hidden Cylon revealed</h3>
          <ol className="steps">
            <li>Reveal <em>one</em> “You Are a Cylon” card; keep the others face down. Do <strong>not</strong> take its action.</li>
            {flags.allySeasons && <li>Take 1 Trauma token from the pile (not the Mood Pool).</li>}
            <li>Discard Skill cards down to 3 (already 0 after Step 1).</li>
            <li>Lose all titles to the highest in each line of succession – Quorum hand, nukes etc. go with them.</li>
            <li>Move to {resurrection}. A piloted ship returns to the Reserves.</li>
            <li><strong>No</strong> Super Crisis card.</li>
            {config.daybreak && <li>If you were the Mutineer, hand the Mutineer card face up to a human player of your choice.</li>}
            {flags.overlay ? (
              <li>If the distance is 6 or less: look at your other Loyalty cards and pass them all face down to one human player.</li>
            ) : (
              <li>Keep other Loyalty cards hidden; they can be passed on later from the Resurrection Ship.</li>
            )}
            <li>From now on follow the rules for revealed Cylons (no Crisis card on your turn).</li>
          </ol>
          <button
            className="primary"
            onClick={() => {
              dispatch({ type: "setStatus", seat: player.seat, status: "cylon" });
              setDone(`${char.short} is now a revealed Cylon.${heldTitles.length ? " Titles were passed down the lines of succession." : ""}`);
            }}
          >
            Mark {char.short} as revealed Cylon
          </button>
        </section>
      )}

      {autoWho === "revealed" && (
        <section className="card cylon-card">
          <h3>Step 3 · {isLeader ? "Cylon Leader" : "Revealed Cylon"}</h3>
          <ol className="steps">
            <li>Move to {resurrection}. A piloted ship returns to the Reserves.</li>
            {flags.allySeasons && <li>Take 1 Trauma token from the pile (not the Mood Pool).</li>}
            {isLeader && <li>Do <strong>not</strong> reveal your {flags.motive ? "Motives" : "Agenda"}.</li>}
            <li>That’s it – no new character.</li>
          </ol>
          <button className="primary" onClick={() => setDone(`${char.short} moves to the Resurrection Ship.`)}>Done</button>
        </section>
      )}

      {autoWho === "human" && (
        <section className="card human-card">
          <h3>Step 3 · Human executed</h3>
          {executedBoomer && sleeperQuestion}
          <ol className="steps">
            <li>
              Reveal <em>all</em> your Loyalty cards.
              {flags.finalFive && " Resolve any Final Five card’s execution text, then remove it from the game."}
            </li>
            <li>The fleet loses 1 morale.</li>
            <li>Return {char.short} to the box{flags.allies ? " and discard your Trauma tokens" : ""}.</li>
            {flags.exodusLoyalty && <li>Discard all your Loyalty cards.</li>}
            {!flags.exodusLoyalty && executedBoomer && sleeper !== true && (
              <li>
                {sleeper === null
                  ? "If the Sleeper Agent phase hasn’t happened yet (you were Boomer): draw 1 new Loyalty card."
                  : "You were Boomer before the Sleeper Agent phase: draw 1 new Loyalty card."}
              </li>
            )}
            <li>Choose a new character below (any type; no alternates of characters in play, no Cylon Leaders).</li>
            <li>Start at the character’s setup location (Hangar Deck if unavailable){config.ending === "newcaprica" ? "; on New Caprica before Galactica returns, Resistance HQ" : ""}.</li>
            {flags.exodusLoyalty && (
              <li>
                Shuffle 1 card from the “Not a Cylon” pile into the Loyalty deck and draw 1 Loyalty card.
                {executedBoomer && sleeper === false && " (Executed Boomer before the Sleeper Agent phase: draw 1 more.)"}
                {executedBoomer && sleeper === null && " (Executed Boomer: draw 1 more if the Sleeper Agent phase hasn’t happened yet.)"}
              </li>
            )}
            <li>Titles you held go to the first in line – including your new character. Other titles stay put.</li>
            {config.daybreak && <li>If you were the Mutineer, your new character receives the Mutineer card again (face up).</li>}
            {flags.allies && <li>Draw 3 new Trauma tokens{config.ending === "ioniannebula" ? " (replace any Disaster drawn)" : ""}.</li>}
          </ol>

          <h3>Choose the new character</h3>
          {choices.length === 0 ? (
            <p className="errors">No characters left – the humans lose!</p>
          ) : (
            <div className="char-grid">
              {choices.map((c) => (
                <CharacterTile key={c.id} c={c} selected={newId === c.id} onClick={() => setNewId(newId === c.id ? null : c.id)} />
              ))}
            </div>
          )}

          {newId && (
            <div className="new-char-notes">
              {!executedBoomer && SLEEPER_SENSITIVE.includes(newId) && sleeperQuestion}
              {/* the new character's setup depends on the answer, so wait for it */}
              {!(sleeperNeeded && sleeper === null) && <NewCharacterNotes id={newId} sleeperDone={sleeper === true} />}
              <button
                className="primary"
                disabled={sleeperNeeded && sleeper === null}
                onClick={() => {
                  dispatch({ type: "replaceCharacter", seat: player.seat, newId });
                  setDone(
                    `${char.short} was executed and is now playing ${characterById[newId].short}.${
                      heldTitles.length ? " Titles were redistributed – check the Titles tab." : ""
                    }`,
                  );
                }}
              >
                Confirm: {char.short} → {characterById[newId].short}
              </button>
            </div>
          )}
        </section>
      )}

      <p className="small muted">
        A new character can’t use an ability on the effect that executed the previous one, but can on what happens right
        after.
      </p>
    </div>
  );
}

function NewCharacterNotes({ id, sleeperDone }: { id: string; sleeperDone: boolean }) {
  const { flags, state } = useStore();
  const notes: string[] = [];
  switch (id) {
    case "boomer":
      notes.push(
        flags.exodusLoyalty || !sleeperDone
          ? "Shuffle 1 “Not a Cylon” card into the Loyalty deck."
          : "",
      );
      if (sleeperDone)
        notes.push(
          `Start in the Brig${state.config.ending === "newcaprica" ? " (Detention if the executed character was on New Caprica)" : ""}${flags.exodusLoyalty ? " and draw 1 additional Loyalty card" : ""}.`,
        );
      break;
    case "helo":
      notes.push("Starts “Stranded” even though it is not the start of the game.");
      break;
    case "apollo":
      notes.push("Starts in a viper from the Reserves (Hangar Deck if none).");
      break;
    case "gaius":
      if (!sleeperDone) notes.push("Before the Sleeper Agent phase: shuffle 1 “Not a Cylon” card into the Loyalty deck and draw 1 Loyalty card.");
      else if (!flags.exodusLoyalty) notes.push("After the Sleeper Agent phase: may not use Cylon Detector.");
      break;
    case "samuel":
      notes.push("Skip Receive Skills on the first turn (“Starts on the Bench”).");
      break;
    case "tom-alt":
      notes.push("Draws a Mutiny card (“Disruptive”).");
      break;
  }
  const list = notes.filter(Boolean);
  if (!list.length) return null;
  return (
    <div className="callout">
      <strong>{characterById[id].short}:</strong>
      <ul>
        {list.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}

/** Yes/No with nothing selected until answered; highlighted while unanswered. */
function SleeperQuestion({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className={`callout sleeper-q ${value === null ? "unanswered" : ""}`}>
      <span>
        Has the Sleeper Agent phase happened?
        {value === null && <span className="sleeper-hint">Answer to continue</span>}
      </span>
      <div className="segmented" role="group" aria-label="Sleeper Agent phase has happened">
        {[true, false].map((v) => (
          <button key={String(v)} className={value === v ? "active" : ""} aria-pressed={value === v} onClick={() => onChange(v)}>
            {v ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}
