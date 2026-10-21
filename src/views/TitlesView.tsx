import { useState } from "react";
import { Toggle } from "../components/Toggle";
import { Portrait } from "../components/CharacterTile";
import { characterById, characters, displayName, TYPE_LABEL, type Box } from "../data/characters";
import { succession, TITLE_LABEL, type TitleId } from "../data/succession";
import { canHoldTitle, initialTitles } from "../logic/succession";
import { useStore, type Player, type PlayerStatus } from "../state/store";

const STATUS_LABEL: Record<PlayerStatus, string> = { human: "Human", brig: "In Brig", cylon: "Revealed Cylon" };
const STATUS_SHORT: Record<PlayerStatus, string> = { human: "Human", brig: "Brig", cylon: "Cylon" };
const TITLE_SHORT: Record<TitleId, string> = { admiral: "ADM", president: "PRES", cag: "CAG" };

export function TitlesView({ go }: { go: (tab: string) => void }) {
  const { state, dispatch, flags } = useStore();
  const { players, titles, phase, config } = state;
  const [showAll, setShowAll] = useState(phase !== "playing" || players.length === 0);
  const titleIds: TitleId[] = config.cylonFleet ? ["admiral", "president", "cag"] : ["admiral", "president"];
  const boxes: Box[] = ["core", ...(["pegasus", "exodus", "daybreak"] as Box[]).filter((b) => config[b as "pegasus"])];
  const inBoxes = new Set(characters.filter((c) => boxes.includes(c.box)).map((c) => c.id));
  const playerByChar = Object.fromEntries(players.map((p) => [p.characterId, p])) as Record<string, Player>;

  const titlesOf = (seat: number) => titleIds.filter((t) => titles[t] === seat);
  // Before the game starts, show who *would* receive each title.
  const shownTitles = phase === "playing" ? titles : initialTitles(players, config.cylonFleet);

  return (
    <div className="view titles">
      {phase === "playing" && players.length > 0 ? (
        <section className="card players-card">
          <h2>Players</h2>
          <div className="holder-strip">
            {titleIds.map((t) => {
              const p = players.find((x) => x.seat === titles[t]);
              return (
                <div key={t} className={`hs-item title-${t}`}>
                  <span className="hs-title">{TITLE_LABEL[t]}</span>
                  <span className="hs-name">{p ? characterById[p.characterId].short : "—"}</span>
                </div>
              );
            })}
          </div>
          <ul className="player-list">
            {players.map((p, i) => {
              const c = characterById[p.characterId];
              const leader = c.type === "cylonleader";
              return (
                <li key={p.seat} className={`player status-${p.status}`}>
                  <Portrait c={c} size={40} />
                  <div className="player-main">
                    <div className="player-name">
                      <span className="seat-no">{i + 1}</span> {c.name}
                      {c.version && <span className="ver"> ({TYPE_LABEL[c.type].split(" ")[0]})</span>}
                      {titlesOf(p.seat).map((t) => (
                        <span key={t} className={`badge title-${t}`} title={TITLE_LABEL[t]}>{TITLE_SHORT[t]}</span>
                      ))}
                    </div>
                    {leader ? (
                      <span className="muted small">Cylon Leader · no titles</span>
                    ) : (
                      <div className="player-controls">
                        <div className="segmented xs" role="group" aria-label={`${c.short} status`}>
                          {(Object.keys(STATUS_SHORT) as PlayerStatus[]).map((st) => (
                            <button
                              key={st}
                              className={`${p.status === st ? "active" : ""} st-${st}`}
                              aria-pressed={p.status === st}
                              title={STATUS_LABEL[st]}
                              onClick={() => p.status !== st && dispatch({ type: "setStatus", seat: p.seat, status: st })}
                            >
                              {STATUS_SHORT[st]}
                            </button>
                          ))}
                        </div>
                        {flags.execution && (
                          <button className="danger xs" onClick={() => go(`execution/${p.seat}`)} aria-label={`Execute ${c.short}`}>
                            Exec
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {config.daybreak && (
            <MutineerStrip players={players} titlesOf={titlesOf} onStrip={(seat) => dispatch({ type: "stripTitles", seat, reason: "received the Mutineer" })} />
          )}
        </section>
      ) : (
        <div className="callout">
          {players.length === 0 ? "No characters chosen yet – showing the full lines of succession. " : "Game not started – showing who would get each title. "}
          <button className="link" onClick={() => go("setup")}>Go to Setup</button>
        </div>
      )}

      <div className="row-between">
        <h2 className="section-title">Lines of succession</h2>
        {players.length > 0 && (
          <Toggle label="Show characters not in play" checked={showAll} onChange={setShowAll} on="Shown" off="Hidden" />
        )}
      </div>

      <div className="succession-grid">
        {titleIds.map((t) => {
          const line = succession[t].filter((id) => inBoxes.has(id) && (showAll || players.length === 0 || playerByChar[id]));
          const holderSeat = shownTitles[t];
          // Next in line if the holder were to lose the title.
          const nextUp = succession[t].find((id) => {
            const p = playerByChar[id];
            return p && p.seat !== holderSeat && canHoldTitle(p) && (t === "president" || p.status !== "brig");
          });
          return (
            <section key={t} className={`card succession title-${t}`}>
              <h3 className="succession-head">{TITLE_LABEL[t]}</h3>
              <ol>
                {line.map((id) => {
                  const p = playerByChar[id];
                  const c = characterById[id];
                  const isHolder = p && p.seat === holderSeat;
                  const ineligible = p && (!canHoldTitle(p) || (t !== "president" && p.status === "brig"));
                  const rank = succession[t].indexOf(id) + 1;
                  return (
                    <li
                      key={id}
                      className={[
                        p ? "in-play" : "not-in-play",
                        isHolder ? "holder" : "",
                        ineligible ? "ineligible" : "",
                        id === nextUp && phase === "playing" ? "next-up" : "",
                      ].join(" ")}
                    >
                      <span className="rank">{rank}</span>
                      <span className="succ-name">{displayName(c)}</span>
                      {isHolder && <span className="badge">Holder</span>}
                      {id === nextUp && phase === "playing" && <span className="badge ghost">Next</span>}
                      {p && p.status !== "human" && <span className="badge warn" title={STATUS_LABEL[p.status]}>{STATUS_SHORT[p.status]}</span>}
                      {phase === "playing" && p && !isHolder && canHoldTitle(p) && (
                        <button
                          className="link small give"
                          title={`Give ${TITLE_LABEL[t]} to ${c.short} (e.g. via a card effect)`}
                          onClick={() => dispatch({ type: "giveTitle", title: t, seat: p.seat })}
                        >
                          give
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>

      <section className="card">
        <h3>Title rules</h3>
        <ul className="checks">
          <li>Titles pass down the line automatically when a holder reveals as a Cylon (or, for Admiral{config.cylonFleet ? "/CAG" : ""}, goes to the Brig). They never move just because someone higher in line becomes available – use “give” for card effects.</li>
          <li>Only human players hold titles. A revealed Cylon loses all titles to the highest in each line.{flags.cylonLeader && " Cylon Leaders never hold titles, even while Infiltrating."}</li>
          <li>Admiral{config.cylonFleet ? " and CAG" : ""} in the Brig lose the title to the highest in line <em>not</em> in the Brig. They don’t get it back on release. If everyone is in the Brig, the highest in line holds it until someone leaves.</li>
          <li>The President keeps the title in the Brig.</li>
          {config.ending === "newcaprica" && <li>Detention on New Caprica does not strip the Admiral{config.cylonFleet ? " or CAG" : ""}.</li>}
          {flags.execution && <li>Executed human: titles go to the first in line, including the new character. Other holders keep theirs.</li>}
          {config.daybreak && <li>Receiving the Mutineer card strips all titles (to the highest in line, excluding the Mutineer).</li>}
          <li>Quorum hand, nukes and destination cards travel with the title.</li>
        </ul>
      </section>

      {phase === "playing" && state.log.length > 0 && (
        <section className="card">
          <h3>Log</h3>
          <ol className="log">
            {state.log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function MutineerStrip({
  players,
  titlesOf,
  onStrip,
}: {
  players: Player[];
  titlesOf: (seat: number) => TitleId[];
  onStrip: (seat: number) => void;
}) {
  const holders = players.filter((p) => titlesOf(p.seat).length > 0);
  if (!holders.length) return null;
  return (
    <div className="mutineer-row small">
      <span className="muted">Mutineer card to a title holder:</span>
      {holders.map((p) => (
        <button key={p.seat} className="xs" onClick={() => onStrip(p.seat)} title="Strip this player's titles">
          {characterById[p.characterId].short}
        </button>
      ))}
    </div>
  );
}
