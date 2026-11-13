import type { ReactNode } from "react";
import { Collapsible } from "../components/Collapsible";
import { GameIcon, type GameIconId } from "../components/GameIcon";
import { TokenImg } from "../components/TokenImg";
import { RecklessSequence, RecklessSummary } from "../components/RecklessRule";
import { T, t } from "../i18n";
import { useStore } from "../state/store";

function Icon({ id, name }: { id: GameIconId; name: string }) {
  return (
    <span className="activation-badge">
      <GameIcon id={id} alt={name} />
    </span>
  );
}

function JumpIcon() {
  return (
    <span className="crisis-icon jump">
      <svg viewBox="0 0 100 100" width={44} height={44} fill="currentColor" aria-hidden>
        <path d="M20 20 L50 50 L20 80 L32 80 L62 50 L32 20 Z" />
        <path d="M46 20 L76 50 L46 80 L58 80 L88 50 L58 20 Z" />
      </svg>
    </span>
  );
}

/** Numbered list from crisis.<key>.step1…stepN */
const Steps = ({ k, count }: { k: string; count: number }) => (
  <ol>
    {Array.from({ length: count }, (_, i) => (
      <li key={i}>{t(`${k}.step${i + 1}`)}</li>
    ))}
  </ol>
);

interface Entry {
  key: string;
  icon: ReactNode;
  name: string;
  does: ReactNode;
  none: string;
  fleetShip?: string;
  /** Cylon Fleet board exception (from the Combined Rules 2.0 quick reference) */
  exception?: string;
}

export function CrisisView() {
  const { flags } = useStore();
  const cf = flags.cylonFleet;

  const entries: Entry[] = [
    {
      key: "raiders",
      icon: <Icon id="act-raiders" name={t("crisis.raiders.name")} />,
      name: t("crisis.raiders.name"),
      does: (
        <>
          <T k="crisis.raiders.intro" />
          <Steps k="crisis.raiders" count={5} />
          <T k="crisis.raiders.outro" />
        </>
      ),
      none: t("crisis.raiders.none"),
      fleetShip: t("crisis.fleetShip.raider"),
    },
    {
      key: "launch",
      icon: <Icon id="act-launch" name={t("crisis.launch.name")} />,
      name: t("crisis.launch.name"),
      does: <T k="crisis.launch.does" />,
      none: t("crisis.none.basestars"),
      fleetShip: t("crisis.fleetShip.basestar"),
      exception: t("crisis.launch.exception"),
    },
    {
      key: "heavy",
      icon: <Icon id="act-heavy" name={t("crisis.heavy.icon")} />,
      name: t("crisis.heavy.name"),
      does: (
        <>
          {t("crisis.heavy.intro")}
          <Steps k="crisis.heavy" count={4} />
        </>
      ),
      none: t("crisis.heavy.none"),
      fleetShip: t("crisis.fleetShip.heavy"),
    },
    {
      key: "basestars",
      icon: <Icon id="act-basestars" name={t("crisis.basestars.name")} />,
      name: t("crisis.basestars.name"),
      does: <T k={flags.pegasus ? "crisis.basestars.doesPegasus" : "crisis.basestars.does"} />,
      none: t("crisis.none.basestars"),
      fleetShip: t("crisis.fleetShip.basestar"),
      exception: t("crisis.basestars.exception"),
    },
  ];

  return (
    <div className="view crisis">
      <section className="card">
        <h2>{t("crisis.resolution.title")}</h2>
        <ol className="steps">
          <li>{t("crisis.resolution.draw")}</li>
          <li>
            {t(cf ? "crisis.resolution.resolve" : "crisis.resolution.resolveAttack", {
              reckless: flags.pegasus ? t("crisis.resolution.reckless") : "",
            })}
          </li>
          <li>
            <T k="crisis.resolution.activate" />
          </li>
          <li>
            <T k="crisis.resolution.jump" />
          </li>
          <li>{t("crisis.resolution.discard")}</li>
        </ol>
        <p className={`mode-pill ${cf ? "on" : ""}`}>
          <T k={cf ? "crisis.mode.fleet" : "crisis.mode.noFleet"} />
        </p>
      </section>

      {flags.pegasus && (
        <section className="card reckless-card" id="reckless">
          <Collapsible title={t("crisis.reckless.title")}>
            <RecklessSummary />
            <h3 className="sub">{t("crisis.reckless.where")}</h3>
            <RecklessSequence />
          </Collapsible>
        </section>
      )}

      <h2 className="section-title">{t("crisis.icons.title")}</h2>
      <div className="icon-grid">
        {entries.map((e) => (
          <article key={e.key} className="card icon-card">
            <header>
              {e.icon}
              <h3>{e.name}</h3>
            </header>
            <div className="icon-body">{e.does}</div>
            <div className={`fallback ${cf ? "fleet" : ""}`}>
              <strong>{t("crisis.fallback.question", { none: e.none })}</strong>{" "}
              {cf ? <T k="crisis.fallback.place" vars={{ ship: e.fleetShip ?? "" }} /> : t("crisis.fallback.nothing")}
              {cf && e.exception && <div className="small exception">{e.exception}</div>}
            </div>
          </article>
        ))}
        <article className="card icon-card">
          <header>
            <JumpIcon />
            <h3>{t("crisis.jump.name")}</h3>
          </header>
          <div className="icon-body">
            {t("crisis.jump.does")}
            {flags.ending === "newcaprica" && (
              <p>
                <T k="crisis.jump.newCaprica" />
              </p>
            )}
            {flags.daybreak && <p>{t("crisis.jump.mutineer")}</p>}
            {flags.expansion && (
              <p>
                <T k="crisis.jump.caprica" />
              </p>
            )}
          </div>
        </article>
      </div>

      {cf && (
        <section className="card fleet-board">
          <h2>{t("crisis.fleet.title")}</h2>
          <ol className="steps">
            <li>
              {t("crisis.fleet.byIcon")}
              <span className="icon-map">
                <span><GameIcon id="act-raiders" alt={t("crisis.raiders.name")} /> → {t("crisis.fleet.raider")}</span>
                <span><GameIcon id="act-heavy" alt={t("crisis.heavy.icon")} /> → {t("crisis.fleet.heavy")}</span>
                <span><GameIcon id="act-launch" alt={t("crisis.launch.name")} /> / <GameIcon id="act-basestars" alt={t("crisis.basestars.name")} /> → {t("crisis.fleet.basestar")}</span>
              </span>
            </li>
            <li>
              <T k="crisis.fleet.inSupply" />
            </li>
            <li>
              <T k="crisis.fleet.supplyEmpty" />
            </li>
            <li>
              <T k="crisis.fleet.pursuit" />
              <ul>
                <li>{t("crisis.fleet.civilians")}</li>
                <li>
                  <T k="crisis.fleet.autoAttack" />
                </li>
              </ul>
            </li>
          </ol>
          <ul className="checks">
            <li>{t("crisis.fleet.never")}</li>
            <li>{t("crisis.fleet.outOfSupply")}</li>
            <li>{t("crisis.fleet.onJump")}</li>
            <li>{t("crisis.fleet.location")}</li>
          </ul>
        </section>
      )}

      {!cf && (
        <section className="card">
          <h2>{t("crisis.attack.title")}</h2>
          <ol className="steps">
            <li><T k="crisis.attack.activate" /></li>
            <li><T k="crisis.attack.setup" /></li>
            <li><T k="crisis.attack.special" /></li>
          </ol>
          <p className="small muted">{t("crisis.attack.outOfTokens")}</p>
        </section>
      )}

      {flags.ending === "newcaprica" && (
        <section className="card">
          <h2>{t("crisis.newCaprica.title")}</h2>
          <div className="occupation-head">
            <TokenImg id="occupation-forces" alt={t("crisis.newCaprica.iconAlt")} />
            <span className="small muted">{t("crisis.newCaprica.icon")}</span>
          </div>
          <ul className="checks">
            <li><T k="crisis.newCaprica.before" /></li>
            <li>{t("crisis.newCaprica.forces")}</li>
            <li>{t("crisis.newCaprica.separate")}</li>
          </ul>
        </section>
      )}

      <section className="card">
        <h2>{t("crisis.placement.title")}</h2>
        <ul className="checks">
          <li>{t(cf ? "crisis.placement.civilianFleet" : "crisis.placement.civilian")}</li>
          <li>{t("crisis.placement.heavy")}</li>
          <li>{t("crisis.placement.cylonPlayers")}</li>
          <li>{t("crisis.placement.superCrisis")}</li>
        </ul>
      </section>
    </div>
  );
}
