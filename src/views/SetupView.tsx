import { useMemo } from "react";
import { CharacterTile } from "../components/CharacterTile";
import { Toggle } from "../components/Toggle";
import { characters, characterById, TYPE_LABEL, type Box, type CharacterType } from "../data/characters";
import { TITLE_LABEL, type TitleId } from "../data/succession";
import { setupChecklist } from "../logic/checklist";
import { allowed, ENDING_LABEL, type Config, type Ending } from "../logic/config";
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

  const enabledBoxes: Box[] = ["core", ...(["pegasus", "exodus", "daybreak"] as Box[]).filter((b) => config[b as "pegasus"])];
  const chosenIds = players.map((p) => p.characterId);
  const loyalty = useMemo(() => computeLoyalty(config, flags, chosenIds), [config, flags, chosenIds.join()]);
  const checklist = useMemo(() => setupChecklist(config, flags, chosenIds), [config, flags, chosenIds.join()]);
  const titles = initialTitles(players, config.cylonFleet);

  const issues = useMemo(() => validateLineup(chosenIds, config), [chosenIds.join(), config]);
  const errors = issues.filter((i) => i.level === "error");
  const flagged = new Map<string, string>();
  for (const i of issues) for (const id of i.ids ?? []) if (!flagged.has(id)) flagged.set(id, i.level === "error" ? "Rule conflict" : "Check rules");
  const canStart = players.length > 0 && errors.length === 0 && loyalty.valid;

  const toggleChar = (id: string) => {
    const p = players.find((x) => x.characterId === id);
    if (p) dispatch({ type: "removeSeat", seat: p.seat });
    else dispatch({ type: "addCharacter", id });
  };

  const endings: Ending[] = ["kobol", "newcaprica", "ioniannebula", "searchforhome"];
  const endingAllowed = (e: Ending) => e === "kobol" || a[e];

  return (
    <div className="view setup">
      {locked && (
        <div className="callout">
          The game has started, so the setup is locked.{" "}
          <button className="link" onClick={() => go("titles")}>
            Go to Titles
          </button>{" "}
          or{" "}
          <button
            className="link"
            onClick={() => {
              if (confirm("Return to setup? Title holders and the game log will be cleared.")) dispatch({ type: "backToSetup" });
            }}
          >
            unlock setup
          </button>
          .
        </div>
      )}

      <section className="card">
        <h2>1 · Game</h2>
        <fieldset disabled={locked} className="options">
          <div className="opt-group">
            <h3>Expansions</h3>
            <Toggle on="Active" off="—" label="Pegasus" checked={config.pegasus} onChange={(v) => set({ pegasus: v })} />
            <Toggle on="Active" off="—" label="Exodus" checked={config.exodus} onChange={(v) => set({ exodus: v })} />
            <Toggle on="Active" off="—" label="Daybreak" checked={config.daybreak} onChange={(v) => set({ daybreak: v })} />
          </div>
          {config.exodus && (
            <div className="opt-group">
              <h3>Exodus modules</h3>
              <Toggle label="Cylon Fleet board (CAG)" checked={config.cylonFleet} onChange={(v) => set({ cylonFleet: v })} />
              <Toggle label="Personal Goal cards" checked={config.personalGoal} onChange={(v) => set({ personalGoal: v })} />
              <Toggle label="Final Five cards" checked={config.finalFive} onChange={(v) => set({ finalFive: v })} />
            </div>
          )}
          <div className="opt-group">
            <h3>Ending</h3>
            <div className="segmented">
              {endings.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={config.ending === e ? "active" : ""}
                  disabled={!endingAllowed(e)}
                  title={!endingAllowed(e) ? `Needs ${e === "newcaprica" ? "Pegasus" : e === "ioniannebula" ? "Exodus" : "Daybreak"}` : undefined}
                  onClick={() => set({ ending: e })}
                >
                  {ENDING_LABEL[e]}
                </button>
              ))}
            </div>
          </div>
          <details className="opt-group variants">
            <summary>Variants</summary>
            <Toggle label="No Sympathizer (official)" checked={config.noSympathizer} disabled={!a.noSympathizer} onChange={(v) => set({ noSympathizer: v })} hint="Only without Cylon Leader / Daybreak" />
            <Toggle label="Sympathetic Cylon" checked={config.sympatheticCylon} disabled={!a.sympatheticCylon} onChange={(v) => set({ sympatheticCylon: v })} hint="Only without Cylon Leader / Daybreak" />
            <Toggle label="Exodus: use regular Loyalty deck (no extra card)" checked={config.forcePegasusLoyalty} disabled={!a.forcePegasusLoyalty} onChange={(v) => set({ forcePegasusLoyalty: v })} />
            <Toggle label="Pegasus: use Exodus “extra card” Loyalty deck" checked={config.forceExodusLoyalty} disabled={!a.forceExodusLoyalty} onChange={(v) => set({ forceExodusLoyalty: v })} />
            <Toggle label="Replace Agenda cards with Daybreak Motives" checked={config.forceMotive} disabled={!a.forceMotive} onChange={(v) => set({ forceMotive: v })} />
            <Toggle label="Use a Cylon Locations overlay" checked={config.forceOverlay} disabled={!a.forceOverlay} onChange={(v) => set({ forceOverlay: v })} />
            <Toggle label="Allies for All Seasons" checked={config.allySeasons} disabled={!a.allySeasons} onChange={(v) => set({ allySeasons: v })} />
            <Toggle label="Demetrius & Missions regardless of ending" checked={config.forceDemetrius} disabled={!a.forceDemetrius} onChange={(v) => set({ forceDemetrius: v })} />
          </details>
        </fieldset>
      </section>

      <section className="card">
        <h2>2 · Characters</h2>
        <p className="muted">
          Choose characters at the table as usual, then tap them here in seat order, starting with the first player.
          Fix the order with the arrows. The app checks the line-up against the rules.
          {!a.cylonLeader && " Cylon Leaders need Pegasus or Daybreak."}
        </p>
        {players.length > 0 && (
          <ol className="seats">
            {players.map((p, i) => {
              const c = characterById[p.characterId];
              return (
                <li key={p.seat} className={flagged.has(c.id) ? "flagged" : ""}>
                  <span className="seat-no">{i + 1}</span>
                  <span className={`dot type-${c.type}`} />
                  <span className="seat-name">{c.short}</span>
                  {!locked && (
                    <span className="seat-actions">
                      <button aria-label={`Move ${c.short} up`} disabled={i === 0} onClick={() => dispatch({ type: "moveSeat", seat: p.seat, dir: -1 })}>↑</button>
                      <button aria-label={`Move ${c.short} down`} disabled={i === players.length - 1} onClick={() => dispatch({ type: "moveSeat", seat: p.seat, dir: 1 })}>↓</button>
                      <button aria-label={`Remove ${c.short}`} onClick={() => dispatch({ type: "removeSeat", seat: p.seat })}>✕</button>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        {issues.length > 0 ? (
          <ul className="issues" aria-live="polite">
            {issues.map((i) => (
              <li key={i.text} className={i.level}>
                <span className="issue-tag">{i.level === "error" ? "Rule" : "Check"}</span> {i.text}
              </li>
            ))}
          </ul>
        ) : (
          players.length > 0 && <p className="issues-ok">✓ Line-up follows the selection rules.</p>
        )}
        {TYPES.filter((t) => t !== "cylonleader" || a.cylonLeader).map((t) => {
          const list = characters.filter((c) => c.type === t && enabledBoxes.includes(c.box));
          if (!list.length) return null;
          return (
            <div key={t} className="char-group">
              <h3>
                <span className={`dot type-${t}`} /> {TYPE_LABEL[t]}
              </h3>
              <div className="char-grid">
                {list.map((c) => {
                  const idx = chosenIds.indexOf(c.id);
                  return (
                    <CharacterTile
                      key={c.id}
                      c={c}
                      selected={idx >= 0}
                      order={idx >= 0 ? idx + 1 : undefined}
                      disabled={locked}
                      warn={idx >= 0 ? flagged.get(c.id) : undefined}
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
        <h2>3 · Loyalty deck</h2>
        {players.length === 0 ? (
          <p className="muted">Choose characters to see the Loyalty deck.</p>
        ) : !loyalty.valid ? (
          <ul className="errors">
            {loyalty.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        ) : (
          <div className="loyalty">
            <div className="loyalty-total">
              <span className="big">{loyalty.deckSize}</span> cards in the Loyalty deck for{" "}
              <strong>{loyalty.players}</strong> players
            </div>
            <table className="deck-table">
              <tbody>
                {loyalty.deck.map((l, i) => (
                  <tr key={i} className={l.card.includes("a Cylon") && !l.card.includes("Not") ? "cylon-row" : ""}>
                    <td className="num">{l.count}×</td>
                    <td>{l.card}</td>
                    <td className="muted">{l.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ol className="steps">
              <li>Split the Loyalty cards into “You Are a Cylon” and “You Are Not a Cylon” piles; set other cards aside.</li>
              {loyalty.notACylonPool.length > 0 && (
                <li>Shuffle the {loyalty.notACylonPool.join(" and ")} into the “Not a Cylon” pile first.</li>
              )}
              <li>Shuffle each pile and build the deck above. Unused Cylon cards leave the game unseen.</li>
              <li>
                Keep the remaining “Not a Cylon” pile separate{flags.execution ? " – executions and Personal Goals draw from it" : ""}.
              </li>
              <li>
                Deal: {loyalty.firstDeal.join(", ")}.
              </li>
              {loyalty.laterAdd.map((l, i) => (
                <li key={i}>
                  <strong>After the first deal</strong>, add {l.count}× “{l.card}” to the Loyalty deck ({l.note}).
                </li>
              ))}
              {loyalty.extras.map((e) => (
                <li key={e}>{e}</li>
              ))}
              <li>
                Sleeper Agent phase: {loyalty.sleeperDeal.join(", ")}
                {flags.cylonLeader ? " (Cylon Leader gets none)" : ""}.
              </li>
            </ol>
          </div>
        )}
      </section>

      {players.length > 0 && (
        <section className="card">
          <h2>4 · Titles at start</h2>
          <div className="title-chips">
            {(Object.keys(titles) as TitleId[]).map((t) => {
              const p = players.find((x) => x.seat === titles[t]);
              return (
                <div key={t} className={`title-chip title-${t}`}>
                  <span className="title-name">{TITLE_LABEL[t]}</span>
                  <span>{p ? characterById[p.characterId].short : "—"}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="card">
        <h2>5 · Board &amp; components</h2>
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
              <span className="muted">Enter the chosen characters</span>
            ) : errors.length > 0 ? (
              <span className="warn">{errors.length === 1 ? errors[0].text : `${errors.length} rule conflicts – see Characters`}</span>
            ) : !loyalty.valid ? (
              <span className="warn">{loyalty.errors[0]}</span>
            ) : (
              <span className="ok">
                {players.length} players · {loyalty.deckSize} Loyalty cards
                {issues.length > 0 && " · check warnings"}
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
            Start game →
          </button>
        </div>
      )}
    </div>
  );
}
