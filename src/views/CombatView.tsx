import { useState } from "react";
import { ShipArt } from "../components/ShipArt";
import { TokenImg } from "../components/TokenImg";
import { basestarTokens, galacticaTokens, pegasusTokens, targets, type Band, type Target, type Token } from "../data/combat";
import { T, t } from "../i18n";
import { useStore } from "../state/store";

function TokenGrid({ tokens, compact = false }: { tokens: Token[]; compact?: boolean }) {
  return (
    <div className={`token-grid ${compact ? "compact" : ""}`}>
      {tokens.map((tk) => (
        <div key={tk.id} className="token">
          <TokenImg id={tk.id} />
          <div>
            <strong>{tk.name}</strong>
            {tk.text && <div className="small">{tk.text}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// Same order as the combat table printed on the board.
const ORDER = [
  "raider", "scar", "heavy", "centurion", "basestar", "nuke",
  "viper", "viper7", "assault", "galactica", "pegasus", "civilian",
  "occupation", "detain",
];

const effectWord = (e: Band["effect"]) => (e === "special" ? "" : t(`combat.effect.${e}`));

const range = (b: Band) => (b.min === b.max ? `${b.min}` : `${b.min}-${b.max}`);

function DieStrip({ bands }: { bands: Band[] }) {
  return (
    <div className="die-strip" aria-hidden>
      {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => {
        const band = bands.find((b) => n >= b.min && n <= b.max);
        return (
          <span key={n} className={`die-cell ${band ? band.effect : "miss"}`}>
            {n}
          </span>
        );
      })}
    </div>
  );
}

function ShipRow({ target, open, onToggle }: { target: Target; open: boolean; onToggle: () => void }) {
  const { flags } = useStore();
  const rows = target.rows.filter((r) => !r.when || r.when(flags));
  const id = `ship-${target.id}`;
  return (
    <li className={`ship-item side-${target.side} ${open ? "open" : ""}`}>
      <button className="ship-row" aria-expanded={open} aria-controls={id} onClick={onToggle}>
        <span className="ship-left">
          <ShipArt ship={target.ship} title={target.name} />
          <span className="ship-name">{target.name}</span>
        </span>
        <span className="ship-results">
          {rows.map((r, i) => (
            <span key={i} className="res-group">
              {r.by && rows.length > 1 && <span className="res-by">{t("combat.with", { ship: r.by })}</span>}
              {r.noRoll ? (
                <span className="res-line destroy">{r.noRoll}</span>
              ) : (
                r.bands.map((b, j) => (
                  <span key={j} className={`res-line ${b.effect}`}>
                    <span className="res-range">{range(b)}</span> = {b.label ?? effectWord(b.effect)}
                  </span>
                ))
              )}
            </span>
          ))}
        </span>
        <span className="chev" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="ship-detail" id={id}>
          {rows.map((r, i) => (
            <div key={i} className="attack-row">
              {r.by && <div className="attacker">{rows.length > 1 || target.id === "nuke" ? r.by : t("combat.attackedBy", { ship: r.by })}</div>}
              {r.noRoll ? <div className="no-roll">{r.noRoll}</div> : <DieStrip bands={r.bands} />}
            </div>
          ))}
          {target.notes && (
            <ul className="target-notes">
              {target.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
          {target.id === "basestar" && (
            <>
              <TokenGrid tokens={basestarTokens(flags.ending === "ioniannebula")} />
              <p className="small muted">
                {t("combat.basestar.skipTokens")}{" "}
                {t(flags.ending === "ioniannebula" ? "combat.basestar.ionianToken" : "combat.basestar.noToken")}
              </p>
            </>
          )}
          {target.id === "galactica" && (
            <>
              <TokenGrid tokens={galacticaTokens()} compact />
              <p className="small muted">
                {t("combat.galactica.damage")}
              </p>
            </>
          )}
          {target.id === "pegasus" && (
            <>
              <TokenGrid tokens={pegasusTokens()} compact />
            </>
          )}
        </div>
      )}
    </li>
  );
}

export function CombatView() {
  const { flags } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const list = targets()
    .filter((x) => !x.when || x.when(flags))
    .sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
  const groups = ["cylon", "colonial", "newcaprica"] as const;

  return (
    <div className="view combat">
      <p className="small muted combat-hint">
        {t("combat.hint")}
      </p>
      {groups.map((g) => {
        const items = list.filter((x) => x.side === g);
        if (!items.length) return null;
        return (
          <section key={g} className="card ship-panel">
            <h2>{t(`combat.group.${g}`)}</h2>
            <ul className="ship-list">
              {items.map((x) => (
                <ShipRow key={x.id} target={x} open={open === x.id} onToggle={() => setOpen(open === x.id ? null : x.id)} />
              ))}
            </ul>
          </section>
        );
      })}

      <section className="card activate-viper">
        <h3>{t("combat.activate.title")}</h3>
        <div className="viper-head">
          <TokenImg id="activate-viper" alt={t("combat.activate.iconAlt")} />
          <span className="small muted">{t("combat.activate.choose")}</span>
        </div>
        <ul className="checks">
          <li><T k="combat.activate.launch" /></li>
          <li><T k={flags.cylonFleet ? "combat.activate.moveMk7" : "combat.activate.move"} /></li>
          <li><T k="combat.activate.attack" /></li>
          {flags.cylonFleet && <li><T k="combat.activate.escort" /></li>}
        </ul>
        <p className="small muted">
          {t("combat.activate.pilot")}
          {flags.daybreak && ` ${t("combat.activate.assault")}`}
        </p>
      </section>

      <section className="card">
        <h3>{t("combat.after.title")}</h3>
        <ul className="checks">
          <li>{t("combat.after.human")}</li>
          <li>{t("combat.after.cylon")}</li>
          <li><T k="combat.after.evasive" /></li>
          {flags.daybreak && <li>{t("combat.after.assault")}</li>}
        </ul>
      </section>
    </div>
  );
}
