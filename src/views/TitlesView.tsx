import { useState } from "react";
import { Toggle } from "../components/Toggle";
import { RowPortrait, useRowPortraitSize } from "../components/RowPortrait";
import { characterById, characters, displayName, TYPE_SHORT } from "../data/characters";
import { characterBoxes } from "../logic/config";
import { succession, TITLE_LABEL, type TitleId } from "../data/succession";
import { labels, T, t } from "../i18n";
import { canHoldTitle, initialTitles } from "../logic/succession";
import { useStore, type Player, type PlayerStatus } from "../state/store";

const STATUSES = ["human", "brig", "cylon"] as const;
const STATUS_LABEL = labels(STATUSES, "titles.status");
const STATUS_SHORT = labels(STATUSES, "titles.statusShort");

export function TitlesView({ go }: { go: (tab: string) => void }) {
  const { state, dispatch, flags } = useStore();
  const { players, titles, phase, config } = state;
  const [showAll, setShowAll] = useState(phase !== "playing" || players.length === 0);
  const portrait = useRowPortraitSize();
  const titleIds: TitleId[] = config.cylonFleet ? ["admiral", "president", "cag"] : ["admiral", "president"];
  const boxes = characterBoxes(config);
  const inBoxes = new Set(characters.filter((c) => boxes.includes(c.box)).map((c) => c.id));
  const playerByChar = Object.fromEntries(players.map((p) => [p.characterId, p])) as Record<string, Player>;

  const titlesOf = (seat: number) => titleIds.filter((title) => titles[title] === seat);
  // Before the game starts, show who *would* receive each title.
  const shownTitles = phase === "playing" ? titles : initialTitles(players, config.cylonFleet);

  return (
    <div className="view titles">
      {phase === "playing" && players.length > 0 ? (
        <section className="card players-card">
          <h2>{t("titles.players")}</h2>
          <div className="holder-strip">
            {titleIds.map((title) => {
              const p = players.find((x) => x.seat === titles[title]);
              return (
                <div key={title} className={`hs-item title-${title}`}>
                  <span className="hs-title">{TITLE_LABEL[title]}</span>
                  <span className="hs-name">{p ? characterById[p.characterId].short : "-"}</span>
                </div>
              );
            })}
          </div>
          <ul className="player-list">
            {players.map((p) => {
              const c = characterById[p.characterId];
              const leader = c.type === "cylonleader";
              const isMutineer = state.mutineer === p.seat;
              return (
                <li key={p.seat} className={`player status-${p.status}`}>
                  <RowPortrait c={c} size={portrait.size} onHeight={portrait.onHeight(p.seat)} />
                  <div className="player-main">
                    <div className="player-name">
                      {c.name}
                      {c.version && <span className="ver"> ({TYPE_SHORT[c.type]})</span>}
                      {titlesOf(p.seat).map((title) => (
                        <span key={title} className={`badge title-${title}`}>{TITLE_LABEL[title]}</span>
                      ))}
                      {isMutineer && <span className="badge ghost">{t("titles.mutineer")}</span>}
                    </div>
                    {leader ? (
                      <span className="muted small">{t("titles.leaderNoTitles")}</span>
                    ) : (
                      <div className="player-controls">
                        <div className="segmented xs" role="group" aria-label={t("titles.statusAria", { name: c.short })}>
                          {STATUSES.map((st) => (
                            <button
                              key={st}
                              className={`${p.status === st ? "active" : ""} st-${st}`}
                              aria-pressed={p.status === st}
                              title={STATUS_LABEL[st]}
                              onClick={() => p.status !== st && dispatch({ type: "setStatus", seat: p.seat, status: st as PlayerStatus })}
                            >
                              {STATUS_SHORT[st]}
                            </button>
                          ))}
                        </div>
                        {config.daybreak && (isMutineer || p.status !== "cylon") && (
                          <button
                            className={`xs mutineer-btn ${isMutineer ? "active" : ""}`}
                            aria-pressed={isMutineer}
                            title={isMutineer ? t("titles.mutineer.clear") : t("titles.mutineer.give", { name: c.short })}
                            onClick={() => dispatch({ type: "setMutineer", seat: isMutineer ? null : p.seat })}
                          >
                            {t("titles.mutineer")}
                          </button>
                        )}
                        {flags.execution && (
                          <button className="danger xs" onClick={() => go(`execution/${p.seat}`)} aria-label={t("titles.executeAria", { name: c.short })}>
                            {t("titles.execute")}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <div className="callout">
          {t(players.length === 0 ? "titles.callout.noCharacters" : "titles.callout.notStarted")}{" "}
          <button className="link" onClick={() => go("setup")}>{t("titles.callout.goToSetup")}</button>
        </div>
      )}

      <div className="row-between">
        <h2 className="section-title">{t("titles.lines")}</h2>
        {players.length > 0 && (
          <Toggle label={t("titles.showAll")} checked={showAll} onChange={setShowAll} on={t("toggle.shown")} off={t("toggle.hidden")} />
        )}
      </div>

      <div className="succession-grid">
        {titleIds.map((title) => {
          const line = succession[title].filter((id) => inBoxes.has(id) && (showAll || players.length === 0 || playerByChar[id]));
          const holderSeat = shownTitles[title];
          // Next in line if the holder were to lose the title.
          const nextUp = succession[title].find((id) => {
            const p = playerByChar[id];
            return p && p.seat !== holderSeat && canHoldTitle(p) && (title === "president" || p.status !== "brig");
          });
          return (
            <section key={title} className={`card succession title-${title}`}>
              <h3 className="succession-head">{TITLE_LABEL[title]}</h3>
              <ol>
                {line.map((id) => {
                  const p = playerByChar[id];
                  const c = characterById[id];
                  const isHolder = p && p.seat === holderSeat;
                  const ineligible = p && (!canHoldTitle(p) || (title !== "president" && p.status === "brig"));
                  const rank = succession[title].indexOf(id) + 1;
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
                      {isHolder && <span className="badge">{t("titles.holder")}</span>}
                      {id === nextUp && phase === "playing" && <span className="badge ghost">{t("titles.next")}</span>}
                      {p && p.status !== "human" && <span className="badge warn" title={STATUS_LABEL[p.status]}>{STATUS_SHORT[p.status]}</span>}
                      {phase === "playing" && p && !isHolder && canHoldTitle(p) && (
                        <button
                          className="link small give"
                          title={t("titles.give.title", { title: TITLE_LABEL[title], name: c.short })}
                          onClick={() => dispatch({ type: "giveTitle", title, seat: p.seat })}
                        >
                          {t("titles.give")}
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
        <h3>{t("titles.rules.title")}</h3>
        <ul className="checks">
          <li>{t(config.cylonFleet ? "titles.rules.passDownCag" : "titles.rules.passDown")}</li>
          <li>
            {t("titles.rules.humansOnly")}
            {flags.cylonLeader && ` ${t("titles.rules.leadersNever")}`}
          </li>
          <li>
            <T k={config.cylonFleet ? "titles.rules.brigCag" : "titles.rules.brig"} />
          </li>
          <li>{t("titles.rules.presidentBrig")}</li>
          {config.ending === "newcaprica" && <li>{t(config.cylonFleet ? "titles.rules.detentionCag" : "titles.rules.detention")}</li>}
          {flags.execution && <li>{t("titles.rules.executed")}</li>}
          {config.daybreak && <li>{t("titles.rules.mutineer")}</li>}
          <li>{t("titles.rules.travel")}</li>
        </ul>
      </section>

      {phase === "playing" && state.log.length > 0 && (
        <section className="card">
          <h3>{t("titles.log")}</h3>
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
