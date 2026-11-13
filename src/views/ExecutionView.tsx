import { useState } from "react";
import { CharacterTile, Portrait } from "../components/CharacterTile";
import { RowPortrait, useRowPortraitSize } from "../components/RowPortrait";
import { characterById, characters } from "../data/characters";
import { characterBoxes } from "../logic/config";
import { TITLE_LABEL, type TitleId } from "../data/succession";
import { T, t } from "../i18n";
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
  const heldTitles = player ? (Object.keys(titles) as TitleId[]).filter((title) => titles[title] === player.seat) : [];
  // The Sleeper Agent phase only matters if the executed character was Boomer or the new one is Boomer/Baltar,
  // so the switch is only shown then, next to the instructions it changes.
  const executedBoomer = player?.characterId === "boomer";
  // Asked fresh for every execution and required before confirming, so it can't be skipped or carried over stale.
  const [sleeper, setSleeper] = useState<boolean | null>(null);
  const sleeperQuestion = <SleeperQuestion value={sleeper} onChange={setSleeper} />;
  const sleeperNeeded = executedBoomer || (newId !== null && SLEEPER_SENSITIVE.includes(newId));
  const resurrection = t(config.ending === "newcaprica" ? "exec.resurrectionNewCaprica" : "exec.resurrection");

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
          <T
            k="exec.needsExpansion"
            slots={{
              setup: (
                <button className="link" onClick={() => go("setup")}>
                  {t("app.nav.setup")}
                </button>
              ),
            }}
          />
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="view">
        <section className="card">
          <h2>{t("exec.done.title")}</h2>
          <p>{done}</p>
          <div className="btn-row">
            <button className="primary" onClick={() => go("titles")}>{t("exec.done.backToTitles")}</button>
            <button onClick={() => restart()}>{t("exec.done.another")}</button>
          </div>
        </section>
      </div>
    );
  }

  if (!player || !char) {
    return (
      <div className="view execution">
        <section className="card">
          <h2>{t("exec.pick.title")}</h2>
          {players.length === 0 ? (
            <p className="muted">
              <T
                k="exec.pick.noPlayers"
                slots={{
                  setup: <button className="link" onClick={() => go("setup")}>{t("exec.pick.chooseCharacters")}</button>,
                  rulebook: <button className="link" onClick={() => go("rulebook")}>{t("exec.pick.rulebook")}</button>,
                }}
              />
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
                      {p.status !== "human" && <span className="badge warn">{t(`titles.status.${p.status}`)}</span>}
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
          <h2>{t("exec.executing", { name: char.short })}</h2>
          {heldTitles.length > 0 && (
            <div>
              {t("exec.holds")} {heldTitles.map((title) => <span key={title} className={`badge title-${title}`}>{TITLE_LABEL[title]}</span>)}
            </div>
          )}
        </div>
        <button className="link small" onClick={() => restart()}>{t("exec.change")}</button>
      </section>

      <section className="card">
        <h3>{t("exec.step1.title")}</h3>
        <ol className="steps">
          <li>{t("exec.step1.discardHand")}</li>
          <li>
            <T k={config.daybreak ? "exec.step1.quorumDaybreak" : "exec.step1.quorum"} />
          </li>
          {flags.exodusLoyalty && <li>{t("exec.step1.currentPlayer")}</li>}
          {flags.allies && <li>{t("exec.step1.ally")}</li>}
        </ol>
      </section>

      <section className="card">
        <h3>{t("exec.step2.title")}</h3>
        {isLeader || player.status === "cylon" ? (
          <p className="muted">{t(isLeader ? "exec.step2.leader" : "exec.step2.revealed")}</p>
        ) : (
          <>
            <p className="muted small">{t("exec.step2.check")}</p>
            <div className="choice-row">
              <button className={`choice human ${who === "human" ? "active" : ""}`} onClick={() => setWho("human")}>
                <strong>{t("exec.step2.human")}</strong>
                <span>{t("exec.step2.humanHint")}</span>
              </button>
              <button className={`choice cylon ${who === "hidden" ? "active" : ""}`} onClick={() => setWho("hidden")}>
                <strong>{t("exec.step2.cylon")}</strong>
                <span>{t("exec.step2.cylonHint")}</span>
              </button>
            </div>
          </>
        )}
      </section>

      {autoWho === "hidden" && (
        <section className="card cylon-card">
          <h3>{t("exec.hidden.title")}</h3>
          <ol className="steps">
            <li><T k="exec.hidden.reveal" /></li>
            {flags.allySeasons && <li>{t("exec.trauma")}</li>}
            <li>{t("exec.hidden.discard")}</li>
            <li>{t("exec.hidden.titles")}</li>
            <li>{t("exec.moveTo", { place: resurrection })}</li>
            <li><T k="exec.hidden.noSuperCrisis" /></li>
            {config.daybreak && <li>{t("exec.hidden.mutineer")}</li>}
            <li>{t(flags.overlay ? "exec.hidden.loyaltyOverlay" : "exec.hidden.loyalty")}</li>
            <li>{t("exec.hidden.fromNow")}</li>
          </ol>
          <button
            className="primary"
            onClick={() => {
              dispatch({ type: "setStatus", seat: player.seat, status: "cylon" });
              setDone(
                `${t("exec.hidden.done", { name: char.short })}${heldTitles.length ? ` ${t("exec.hidden.doneTitles")}` : ""}`,
              );
            }}
          >
            {t("exec.hidden.mark", { name: char.short })}
          </button>
        </section>
      )}

      {autoWho === "revealed" && (
        <section className="card cylon-card">
          <h3>{t(isLeader ? "exec.revealed.titleLeader" : "exec.revealed.title")}</h3>
          <ol className="steps">
            <li>{t("exec.moveTo", { place: resurrection })}</li>
            {flags.allySeasons && <li>{t("exec.trauma")}</li>}
            {isLeader && <li><T k={flags.motive ? "exec.revealed.motives" : "exec.revealed.agenda"} /></li>}
            <li>{t("exec.revealed.thatsIt")}</li>
          </ol>
          <button className="primary" onClick={() => setDone(t("exec.revealed.done", { name: char.short }))}>{t("exec.revealed.button")}</button>
        </section>
      )}

      {autoWho === "human" && (
        <section className="card human-card">
          <h3>{t("exec.human.title")}</h3>
          {executedBoomer && sleeperQuestion}
          <ol className="steps">
            <li>
              <T k="exec.human.reveal" />
              {flags.finalFive && ` ${t("exec.human.finalFive")}`}
            </li>
            <li>{t("exec.human.morale")}</li>
            <li>{t(flags.allies ? "exec.human.returnTrauma" : "exec.human.return", { name: char.short })}</li>
            {flags.exodusLoyalty && <li>{t("exec.human.discardLoyalty")}</li>}
            {!flags.exodusLoyalty && executedBoomer && sleeper !== true && (
              <li>{t(sleeper === null ? "exec.human.boomerIfBefore" : "exec.human.boomerBefore")}</li>
            )}
            <li>{t("exec.human.choose")}</li>
            <li>{t(config.ending === "newcaprica" ? "exec.human.startNewCaprica" : "exec.human.start")}</li>
            {flags.exodusLoyalty && (
              <li>
                {t("exec.human.exodusDraw")}
                {executedBoomer && sleeper === false && ` ${t("exec.human.exodusBoomerBefore")}`}
                {executedBoomer && sleeper === null && ` ${t("exec.human.exodusBoomerIf")}`}
              </li>
            )}
            <li>{t("exec.human.titles")}</li>
            {config.daybreak && <li>{t("exec.human.mutineer")}</li>}
            {flags.allies && <li>{t(config.ending === "ioniannebula" ? "exec.human.traumaIonian" : "exec.human.trauma")}</li>}
          </ol>

          <h3>{t("exec.human.chooseTitle")}</h3>
          {choices.length === 0 ? (
            <p className="errors">{t("exec.human.none")}</p>
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
                    `${t("exec.human.done", { old: char.short, now: characterById[newId].short })}${
                      heldTitles.length ? ` ${t("exec.human.doneTitles")}` : ""
                    }`,
                  );
                }}
              >
                {t("exec.human.confirm", { old: char.short, now: characterById[newId].short })}
              </button>
            </div>
          )}
        </section>
      )}

      <p className="small muted">{t("exec.footnote")}</p>
    </div>
  );
}

function NewCharacterNotes({ id, sleeperDone }: { id: string; sleeperDone: boolean }) {
  const { flags, state } = useStore();
  const notes: string[] = [];
  switch (id) {
    case "boomer":
      if (flags.exodusLoyalty || !sleeperDone) notes.push(t("exec.note.boomerShuffle"));
      if (sleeperDone)
        notes.push(
          t("exec.note.boomerBrig", {
            detention: state.config.ending === "newcaprica" ? t("exec.note.boomerDetention") : "",
            draw: flags.exodusLoyalty ? t("exec.note.boomerDraw") : "",
          }),
        );
      break;
    case "helo":
      notes.push(t("exec.note.helo"));
      break;
    case "apollo":
      notes.push(t("exec.note.apollo"));
      break;
    case "gaius":
      if (!sleeperDone) notes.push(t("exec.note.gaiusBefore"));
      else if (!flags.exodusLoyalty) notes.push(t("exec.note.gaiusAfter"));
      break;
    case "samuel":
      notes.push(t("exec.note.samuel"));
      break;
    case "tom-alt":
      notes.push(t("exec.note.tomAlt"));
      break;
  }
  if (!notes.length) return null;
  return (
    <div className="callout">
      <strong>{characterById[id].short}:</strong>
      <ul>
        {notes.map((n) => (
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
        {t("exec.sleeper.question")}
        {value === null && <span className="sleeper-hint">{t("exec.sleeper.hint")}</span>}
      </span>
      <div className="segmented" role="group" aria-label={t("exec.sleeper.aria")}>
        {[true, false].map((v) => (
          <button key={String(v)} className={value === v ? "active" : ""} aria-pressed={value === v} onClick={() => onChange(v)}>
            {t(v ? "exec.sleeper.yes" : "exec.sleeper.no")}
          </button>
        ))}
      </div>
    </div>
  );
}
