import { lazy, Suspense, useEffect, useState } from "react";
import { NavIcon } from "./components/NavIcon";
import { ENDING_LABEL } from "./logic/config";
import { nextTheme, THEME_LABEL, useTheme } from "./state/theme";
import { useStore } from "./state/store";
import { CombatView } from "./views/CombatView";
import { CrisisView } from "./views/CrisisView";
import { ExecutionView } from "./views/ExecutionView";
import { QuickRulesView } from "./views/QuickRulesView";
import { SetupView } from "./views/SetupView";
import { TitlesView } from "./views/TitlesView";

// The rulebook pulls in marked + ~150 KB of text; load it only when opened.
const RulebookView = lazy(() => import("./views/RulebookView").then((m) => ({ default: m.RulebookView })));

const DOCK = [
  { id: "setup", label: "Setup" },
  { id: "titles", label: "Titles" },
  { id: "combat", label: "Combat" },
  { id: "crisis", label: "Crisis" },
  { id: "execution", label: "Execute" },
  { id: "rules", label: "Rules" },
] as const;

const ROUTES = ["setup", "titles", "combat", "crisis", "execution", "rules", "rulebook"];

const readHash = () => window.location.hash.replace(/^#\/?/, "") || "setup";

export function App() {
  const { state, dispatch } = useStore();
  const [theme, toggleTheme] = useTheme();
  const [route, setRoute] = useState(readHash);

  useEffect(() => {
    const onHash = () => {
      setRoute(readHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (r: string) => {
    window.location.hash = `/${r}`;
  };

  const [tab, param] = route.split("/");
  const current = ROUTES.includes(tab) ? tab : "setup";
  const dockActive = current === "rulebook" ? "rules" : current;

  const { config, players } = state;
  const boxes = [config.pegasus && "PEG", config.exodus && "EXO", config.daybreak && "DAY"].filter(Boolean);

  return (
    <div className="app">
      <header className="hud-top">
        <div className="hud-bar">
          <div className="hud-title">
            <h1>
              <span className="app-title" role="img" aria-label="BSG Companion" />
            </h1>
            <div className="hud-status">
              {["BASE", ...boxes].join("+")} · {ENDING_LABEL[config.ending].toUpperCase()}
              {players.length > 0 && ` · P:${players.length}`} ·{" "}
              <span className={state.phase === "playing" ? "ok" : ""}>{state.phase === "playing" ? "IN GAME" : "SETUP"}</span>
            </div>
          </div>
          <button
            className="hud-btn"
            onClick={toggleTheme}
            aria-label={`${THEME_LABEL[theme].name} theme – switch to ${THEME_LABEL[nextTheme(theme)].name}`}
            title="Switch console theme"
          >
            {THEME_LABEL[theme].short}
          </button>
          <button
            className="hud-btn danger"
            onClick={() => {
              if (confirm("Start over? This clears characters, titles and the game log. Game settings (expansions, modules, ending, variants) are kept.")) {
                dispatch({ type: "reset" });
                go("setup");
              }
            }}
          >
            Reset
          </button>
        </div>
        <div className="hud-rail" />
        <nav className="dock" aria-label="Sections">
          {DOCK.map((t) => (
            <a
              key={t.id}
              href={`#/${t.id}`}
              className={dockActive === t.id ? "active" : ""}
              aria-current={dockActive === t.id ? "page" : undefined}
            >
              <NavIcon name={t.id} />
              <span>{t.label}</span>
            </a>
          ))}
        </nav>
      </header>

      <main>
        {(current === "rules" || current === "rulebook") && (
          <div className="subtabs">
            <a href="#/rules" className={current === "rules" ? "active" : ""}>Quick rules</a>
            <a href="#/rulebook" className={current === "rulebook" ? "active" : ""}>Rulebook</a>
          </div>
        )}
        {current === "setup" && <SetupView go={go} />}
        {current === "titles" && <TitlesView go={go} />}
        {current === "combat" && <CombatView />}
        {current === "crisis" && <CrisisView />}
        {current === "execution" && (
          <ExecutionView key={param ?? "none"} seat={param !== undefined ? Number(param) : undefined} go={go} />
        )}
        {current === "rules" && <QuickRulesView />}
        {current === "rulebook" && (
          <Suspense fallback={<div className="view muted">Loading rulebook…</div>}>
            <RulebookView />
          </Suspense>
        )}
      </main>

      <footer className="footer small muted">
        Unofficial fan-made companion for Battlestar Galactica: The Board Game – not affiliated with Fantasy Flight Games. All data stays on this device.
      </footer>
    </div>
  );
}
