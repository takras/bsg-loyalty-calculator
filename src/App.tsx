import { Fragment, lazy, Suspense, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { NavIcon } from "./components/NavIcon";
import { ANDROID_TESTER_MAILTO, APP_STORE_URL } from "./data/attributions";
import { getLanguage, LANGUAGE_NAME, LANGUAGES, setLanguage, t } from "./i18n";
import { endingLabel } from "./logic/config";
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

const DOCK = ["setup", "titles", "combat", "crisis", "execution", "rules"] as const;

const ROUTES = ["setup", "titles", "combat", "crisis", "execution", "rules", "rulebook"];

const readHash = () => window.location.hash.replace(/^#\/?/, "") || "setup";

export function App() {
  const { state, dispatch } = useStore();
  const [theme, toggleTheme] = useTheme();
  const [route, setRoute] = useState(readHash);
  const [lang, setLang] = useState(getLanguage);
  const nextLang = LANGUAGES[(LANGUAGES.indexOf(lang) + 1) % LANGUAGES.length];

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
    // Keyed by language so every view re-renders (and re-reads its text) when the language changes.
    <Fragment key={lang}>
    <div className="app">
      <header className="hud-top">
        <div className="hud-bar">
          <div className="hud-title">
            <h1>
              <span className="app-title" role="img" aria-label={t("app.name")} />
            </h1>
            <div className="hud-status">
              {["BASE", ...boxes].join("+")} · {endingLabel(config.ending).toUpperCase()}
              {players.length > 0 && ` · P:${players.length}`} ·{" "}
              <span className={state.phase === "playing" ? "ok" : ""}>{state.phase === "playing" ? t("app.status.playing") : t("app.status.setup")}</span>
            </div>
          </div>
          <button
            className="hud-btn"
            onClick={toggleTheme}
            aria-label={t("app.theme.aria", { theme: THEME_LABEL[theme].name, next: THEME_LABEL[nextTheme(theme)].name })}
            title={t("app.theme.title")}
          >
            {THEME_LABEL[theme].short}
          </button>
          {LANGUAGES.length > 1 && (
            <button
              className="hud-btn"
              onClick={() => {
                setLanguage(nextLang);
                setLang(nextLang);
              }}
              aria-label={t("app.language.aria", { language: LANGUAGE_NAME[lang] ?? lang, next: LANGUAGE_NAME[nextLang] ?? nextLang })}
              title={t("app.language.title")}
            >
              {lang.toUpperCase()}
            </button>
          )}
          <button
            className="hud-btn danger"
            onClick={() => {
              if (confirm(t("app.reset.confirm"))) {
                dispatch({ type: "reset" });
                go("setup");
              }
            }}
          >
            {t("app.reset")}
          </button>
        </div>
        {/* the website points to the apps; inside the apps this is pointless */}
        {!Capacitor.isNativePlatform() && (
          <div className="store-links">
            <a className="framed store-btn" href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
              {t("app.store.appStore")}
            </a>
            <a className="framed store-btn" href={ANDROID_TESTER_MAILTO}>
              {t("app.store.androidTest")}
            </a>
          </div>
        )}
        <div className="hud-rail" />
        <nav className="dock" aria-label={t("app.nav.aria")}>
          {DOCK.map((id) => (
            <a
              key={id}
              href={`#/${id}`}
              className={dockActive === id ? "active" : ""}
              aria-current={dockActive === id ? "page" : undefined}
            >
              <NavIcon name={id} />
              <span>{t(`app.nav.${id}`)}</span>
            </a>
          ))}
        </nav>
      </header>

      <main>
        {(current === "rules" || current === "rulebook") && (
          <div className="subtabs">
            <a href="#/rules" className={current === "rules" ? "active" : ""}>{t("app.subtab.quickRules")}</a>
            <a href="#/rulebook" className={current === "rulebook" ? "active" : ""}>{t("app.subtab.rulebook")}</a>
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
          <Suspense fallback={<div className="view muted">{t("app.loadingRulebook")}</div>}>
            <RulebookView />
          </Suspense>
        )}
      </main>

      <footer className="footer small muted">
        {t("app.footer")}
      </footer>
    </div>
    </Fragment>
  );
}
