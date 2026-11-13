import { useMemo } from "react";
import { CharacterTile } from "../components/CharacterTile";
import { Toggle } from "../components/Toggle";
import { BOX_LABEL, characters, characterById, TYPE_LABEL, type CharacterType } from "../data/characters";
import { TITLE_LABEL, type TitleId } from "../data/succession";
import { T, t, tp } from "../i18n";
import { setupChecklist } from "../logic/checklist";
import { allowed, characterBoxes, endingLabel, isOutsideExpansion, type Config, type Ending } from "../logic/config";
import { computeLoyalty } from "../logic/loyalty";
import { initialTitles } from "../logic/succession";
import { validateLineup } from "../logic/validate";
import { useStore } from "../state/store";

const TYPES: CharacterType[] = ["political", "military", "pilot", "support", "cylonleader"];

export function SetupView({ go }: { go: (tab: string) => void }) {
  const { state, dispatch, flags, cylonLeader } = useStore();
  const { config, players, phase } = state;
  const set = (patch: Partial<Config>) => dispatch({ type: "config", patch });
  const a = allowed(config, cylonLeader);
  const locked = phase === "playing";

  const enabledBoxes = characterBoxes(config);
  const chosenIds = players.map((p) => p.characterId);
  const loyalty = useMemo(() => computeLoyalty(config, flags, chosenIds), [config, flags, chosenIds.join()]);
  const checklist = useMemo(() => setupChecklist(config, flags, chosenIds), [config, flags, chosenIds.join()]);
  const titles = initialTitles(players, config.cylonFleet);

  const issues = useMemo(() => validateLineup(chosenIds, config), [chosenIds.join(), config]);
  const errors = issues.filter((i) => i.level === "error");
  const flagged = new Map<string, string>();
  for (const i of issues)
    for (const id of i.ids ?? []) if (!flagged.has(id)) flagged.set(id, t(i.level === "error" ? "setup.flag.rule" : "setup.flag.check"));
  const canStart = players.length > 0 && errors.length === 0 && loyalty.valid;

  const toggleChar = (id: string) => {
    const p = players.find((x) => x.characterId === id);
    if (p) dispatch({ type: "removeSeat", seat: p.seat });
    else dispatch({ type: "addCharacter", id });
  };

  const endings: Ending[] = ["kobol", "newcaprica", "ioniannebula", "searchforhome"];
  const endingAllowed = (e: Ending) => e === "kobol" || a[e];
  const endingNeeds: Record<Ending, string> = { kobol: "", newcaprica: "pegasus", ioniannebula: "exodus", searchforhome: "daybreak" };

  return (
    <div className="view setup">
      {locked && (
        <div className="callout">
          <T
            k="setup.locked"
            slots={{
              titles: (
                <button className="link" onClick={() => go("titles")}>
                  {t("setup.locked.goToTitles")}
                </button>
              ),
              unlock: (
                <button
                  className="link"
                  onClick={() => {
                    if (confirm(t("setup.locked.confirm"))) dispatch({ type: "backToSetup" });
                  }}
                >
                  {t("setup.locked.unlock")}
                </button>
              ),
            }}
          />
        </div>
      )}

      <section className="card">
        <h2>{t("setup.game.title")}</h2>
        <fieldset disabled={locked} className="options">
          <div className="opt-group">
            <h3>{t("setup.game.expansions")}</h3>
            <Toggle on={t("toggle.active")} label={BOX_LABEL.pegasus} checked={config.pegasus} onChange={(v) => set({ pegasus: v })} />
            <Toggle on={t("toggle.active")} label={BOX_LABEL.exodus} checked={config.exodus} onChange={(v) => set({ exodus: v })} />
            <Toggle on={t("toggle.active")} label={BOX_LABEL.daybreak} checked={config.daybreak} onChange={(v) => set({ daybreak: v })} />
          </div>
          {config.exodus && (
            <div className="opt-group">
              <h3>{t("setup.game.modules")}</h3>
              <Toggle on={t("toggle.active")} label={t("setup.module.cylonFleet")} checked={config.cylonFleet} onChange={(v) => set({ cylonFleet: v })} />
              <Toggle on={t("toggle.active")} label={t("setup.module.personalGoal")} checked={config.personalGoal} onChange={(v) => set({ personalGoal: v })} />
              <Toggle on={t("toggle.active")} label={t("setup.module.finalFive")} checked={config.finalFive} onChange={(v) => set({ finalFive: v })} />
            </div>
          )}
          <div className="opt-group">
            <h3>{t("setup.game.ending")}</h3>
            <div className="segmented">
              {endings.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={config.ending === e ? "active" : ""}
                  disabled={!endingAllowed(e)}
                  title={!endingAllowed(e) ? t("setup.ending.needs", { box: t(`box.${endingNeeds[e]}`) }) : undefined}
                  onClick={() => set({ ending: e })}
                >
                  {endingLabel(e)}
                </button>
              ))}
            </div>
          </div>
          <details className="opt-group variants">
            <summary>{t("setup.variants")}</summary>
            <Toggle label={t("setup.variant.noSympathizer")} checked={config.noSympathizer} disabled={!a.noSympathizer} onChange={(v) => set({ noSympathizer: v })} hint={t("setup.variant.noLeaderHint")} />
            <Toggle label={t("setup.variant.sympatheticCylon")} checked={config.sympatheticCylon} disabled={!a.sympatheticCylon} onChange={(v) => set({ sympatheticCylon: v })} hint={t("setup.variant.noLeaderHint")} />
            <Toggle label={t("setup.variant.forcePegasusLoyalty")} checked={config.forcePegasusLoyalty} disabled={!a.forcePegasusLoyalty} onChange={(v) => set({ forcePegasusLoyalty: v })} />
            <Toggle label={t("setup.variant.forceExodusLoyalty")} checked={config.forceExodusLoyalty} disabled={!a.forceExodusLoyalty} onChange={(v) => set({ forceExodusLoyalty: v })} />
            <Toggle label={t("setup.variant.forceMotive")} checked={config.forceMotive} disabled={!a.forceMotive} onChange={(v) => set({ forceMotive: v })} />
            <Toggle label={t("setup.variant.forceOverlay")} checked={config.forceOverlay} disabled={!a.forceOverlay} onChange={(v) => set({ forceOverlay: v })} />
            <Toggle label={t("setup.variant.allySeasons")} checked={config.allySeasons} disabled={!a.allySeasons} onChange={(v) => set({ allySeasons: v })} />
            <Toggle
              label={t("setup.variant.allowAllCharacters")}
              checked={config.allowAllCharacters}
              onChange={(v) => set({ allowAllCharacters: v })}
              hint={t("setup.variant.allowAllCharactersHint")}
            />
            <Toggle
              label={t("setup.variant.ignoreTypeBalance")}
              checked={config.ignoreTypeBalance}
              onChange={(v) => set({ ignoreTypeBalance: v })}
              hint={t("setup.variant.ignoreTypeBalanceHint")}
            />
            <Toggle label={t("setup.variant.forceDemetrius")} checked={config.forceDemetrius} disabled={!a.forceDemetrius} onChange={(v) => set({ forceDemetrius: v })} />
          </details>
        </fieldset>
      </section>

      <section className="card">
        <h2>{t("setup.characters.title")}</h2>
        <p className="muted">
          {t("setup.characters.intro")}
          {!a.cylonLeader && ` ${t("setup.characters.leaderNeedsExpansion")}`}
        </p>
        {players.length > 0 && (
          <ul className="seats">
            {players.map((p) => {
              const c = characterById[p.characterId];
              return (
                <li key={p.seat} className={flagged.has(c.id) ? "flagged" : ""}>
                  <span className={`dot type-${c.type}`} />
                  <span className="seat-name">{c.short}</span>
                  {!locked && (
                    <span className="seat-actions">
                      <button aria-label={t("setup.characters.remove", { name: c.short })} onClick={() => dispatch({ type: "removeSeat", seat: p.seat })}>✕</button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {issues.length > 0 ? (
          <ul className="issues" aria-live="polite">
            {issues.map((i) => (
              <li key={i.text} className={i.level}>
                <span className="issue-tag">{t(i.level === "error" ? "setup.issue.rule" : "setup.issue.check")}</span> {i.text}
              </li>
            ))}
          </ul>
        ) : (
          players.length > 0 && <p className="issues-ok">✓ {t("setup.characters.ok")}</p>
        )}
        {TYPES.filter((type) => type !== "cylonleader" || a.cylonLeader).map((type) => {
          const list = characters.filter((c) => c.type === type && enabledBoxes.includes(c.box));
          if (!list.length) return null;
          return (
            <div key={type} className="char-group">
              <h3>
                <span className={`dot type-${type}`} /> {TYPE_LABEL[type]}
              </h3>
              <div className="char-grid">
                {list.map((c) => {
                  const chosen = chosenIds.includes(c.id);
                  return (
                    <CharacterTile
                      key={c.id}
                      c={c}
                      selected={chosen}
                      disabled={locked}
                      warn={chosen ? flagged.get(c.id) : undefined}
                      // only one version of a character may be chosen
                      faded={!chosen && !!c.versionOf && chosenIds.includes(c.versionOf)}
                      note={isOutsideExpansion(config, c.box) ? t("setup.characters.fromBox", { box: BOX_LABEL[c.box] }) : undefined}
                      onClick={() => toggleChar(c.id)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      <section className="card">
        <h2>{t("setup.loyalty.title")}</h2>
        {players.length === 0 ? (
          <p className="muted">{t("setup.loyalty.empty")}</p>
        ) : !loyalty.valid ? (
          <ul className="errors">
            {loyalty.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        ) : (
          <div className="loyalty">
            <div className="loyalty-total">
              <T
                k="setup.loyalty.total"
                slots={{ cards: <span className="big">{loyalty.deckSize}</span>, players: <strong>{loyalty.players}</strong> }}
              />
            </div>
            <table className="deck-table">
              <tbody>
                {loyalty.deck.map((l, i) => (
                  <tr key={i} className={l.kind === "cylon" ? "cylon-row" : ""}>
                    <td className="num">{l.count}×</td>
                    <td>{l.card}</td>
                    <td className="muted">{l.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ol className="steps">
              <li>{t("setup.loyalty.step.split")}</li>
              {loyalty.notACylonPool.length > 0 && (
                <li>{t("setup.loyalty.step.pool", { cards: loyalty.notACylonPool.join(t("setup.loyalty.and")) })}</li>
              )}
              <li>{t("setup.loyalty.step.build")}</li>
              <li>{t(flags.execution ? "setup.loyalty.step.keepPileExecution" : "setup.loyalty.step.keepPile")}</li>
              <li>{t("setup.loyalty.step.deal", { list: loyalty.firstDeal.join(", ") })}</li>
              {loyalty.laterAdd.map((l, i) => (
                <li key={i}>
                  <T k="setup.loyalty.step.later" vars={{ count: l.count, card: l.card, note: l.note ?? "" }} />
                </li>
              ))}
              {loyalty.extras.map((e) => (
                <li key={e}>{e}</li>
              ))}
              <li>
                {t(flags.cylonLeader ? "setup.loyalty.step.sleeperLeader" : "setup.loyalty.step.sleeper", {
                  list: loyalty.sleeperDeal.join(", "),
                })}
              </li>
            </ol>
          </div>
        )}
      </section>

      {players.length > 0 && (
        <section className="card">
          <h2>{t("setup.titles.title")}</h2>
          <div className="title-chips">
            {(Object.keys(titles) as TitleId[]).map((title) => {
              const p = players.find((x) => x.seat === titles[title]);
              return (
                <div key={title} className={`title-chip title-${title}`}>
                  <span className="title-name">{TITLE_LABEL[title]}</span>
                  <span>{p ? characterById[p.characterId].short : "-"}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="card">
        <h2>{t("setup.board.title")}</h2>
        {checklist.map((s) => (
          <div key={s.title} className="check-section">
            <h3>{s.title}</h3>
            <ul className="checks">
              {s.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {!locked && (
        <div className="start-bar">
          <div className="start-status">
            {players.length === 0 ? (
              <span className="muted">{t("setup.start.empty")}</span>
            ) : errors.length > 0 ? (
              <span className="warn">{errors.length === 1 ? errors[0].text : tp("setup.start.conflicts", errors.length)}</span>
            ) : !loyalty.valid ? (
              <span className="warn">{loyalty.errors[0]}</span>
            ) : (
              <span className="ok">
                {t("setup.start.ready", { players: players.length, cards: loyalty.deckSize })}
                {issues.length > 0 && ` · ${t("setup.start.checkWarnings")}`}
              </span>
            )}
          </div>
          <button
            className="primary"
            disabled={!canStart}
            onClick={() => {
              dispatch({ type: "startGame" });
              go("titles");
            }}
          >
            {t("setup.start.button")}
          </button>
        </div>
      )}
    </div>
  );
}
