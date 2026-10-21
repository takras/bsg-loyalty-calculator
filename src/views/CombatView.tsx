import { useState } from "react";
import { ShipArt } from "../components/ShipArt";
import { TokenImg } from "../components/TokenImg";
import { basestarTokens, galacticaTokens, pegasusTokens, targets, type Band, type Target, type Token } from "../data/combat";
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

const EFFECT_WORD = { damage: "Damaged", destroy: "Destroyed", special: "", miss: "Miss" } as const;

const range = (b: Band) => (b.min === b.max ? `${b.min}` : `${b.min}–${b.max}`);

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

function ShipRow({ t, open, onToggle }: { t: Target; open: boolean; onToggle: () => void }) {
  const { flags } = useStore();
  const rows = t.rows.filter((r) => !r.when || r.when(flags));
  const id = `ship-${t.id}`;
  return (
    <li className={`ship-item side-${t.side} ${open ? "open" : ""}`}>
      <button className="ship-row" aria-expanded={open} aria-controls={id} onClick={onToggle}>
        <span className="ship-left">
          <ShipArt ship={t.ship} title={t.name} />
          <span className="ship-name">{t.name}</span>
        </span>
        <span className="ship-results">
          {rows.map((r, i) => (
            <span key={i} className="res-group">
              {r.by && rows.length > 1 && <span className="res-by">w/ {r.by}:</span>}
              {r.noRoll ? (
                <span className="res-line destroy">{r.noRoll}</span>
              ) : (
                r.bands.map((b, j) => (
                  <span key={j} className={`res-line ${b.effect}`}>
                    <span className="res-range">{range(b)}</span> = {b.label ?? EFFECT_WORD[b.effect]}
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
              {r.by && <div className="attacker">{rows.length > 1 || t.id === "nuke" ? r.by : `Attacked by ${r.by}`}</div>}
              {r.noRoll ? <div className="no-roll">{r.noRoll}</div> : <DieStrip bands={r.bands} />}
            </div>
          ))}
          {t.notes && (
            <ul className="target-notes">
              {t.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
          {t.id === "basestar" && (
            <>
              <TokenGrid tokens={basestarTokens(flags.ending === "ioniannebula")} />
              <p className="small muted">
                “Destroy a basestar” effects skip tokens.{" "}
                {flags.ending === "ioniannebula"
                  ? "A basestar with 2 damage that is damaged again still draws a token before it is destroyed."
                  : "No token is drawn when a basestar with 2 damage is damaged again."}
              </p>
            </>
          )}
          {t.id === "galactica" && (
            <>
              <TokenGrid tokens={galacticaTokens} compact />
              <p className="small muted">
                Draw a Galactica damage token: a location token damages that location (characters there go to Sickbay);
                a resource token means lose 1 of it. 6 damaged locations destroy Galactica – the humans lose.
              </p>
            </>
          )}
          {t.id === "pegasus" && (
            <>
              <TokenGrid tokens={pegasusTokens} compact />
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
  const list = targets
    .filter((t) => !t.when || t.when(flags))
    .sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
  const groups = [
    { id: "cylon", title: "Cylon ships" },
    { id: "colonial", title: "Colonial ships" },
    { id: "newcaprica", title: "New Caprica" },
  ];

  return (
    <div className="view combat">
      <p className="small muted combat-hint">
        Tap a unit for die strips and details. Rolls can’t be modified above 8 or below 1.
      </p>
      {groups.map((g) => {
        const items = list.filter((t) => t.side === g.id);
        if (!items.length) return null;
        return (
          <section key={g.id} className="card ship-panel">
            <h2>{g.title}</h2>
            <ul className="ship-list">
              {items.map((t) => (
                <ShipRow key={t.id} t={t} open={open === t.id} onToggle={() => setOpen(open === t.id ? null : t.id)} />
              ))}
            </ul>
          </section>
        );
      })}

      <section className="card activate-viper">
        <h3>Activate a viper</h3>
        <div className="viper-head">
          <TokenImg id="activate-viper" alt="Activate viper icon" />
          <span className="small muted">One viper activation = choose one:</span>
        </div>
        <ul className="checks">
          <li><strong>Launch</strong> a viper from the Reserves into an area with a viper launch icon.</li>
          <li><strong>Move</strong> to an adjacent area{flags.cylonFleet ? " (Mark VII vipers move two areas)" : ""}.</li>
          <li><strong>Attack</strong> a Cylon ship in the same area (roll on the table above).</li>
          {flags.cylonFleet && <li><strong>Escort</strong> a civilian ship in its area to safety – shuffle it back into the unused civilian ships.</li>}
        </ul>
        <p className="small muted">
          A piloted viper is only activated by its pilot (as their action). Unmanned vipers are activated by e.g. Command or cards.
          {flags.daybreak && " Assault raptors activate like vipers."}
        </p>
      </section>

      <section className="card">
        <h3>After combat</h3>
        <ul className="checks">
          <li>Destroyed human ships are removed from the game; a pilot goes to Sickbay.</li>
          <li>Destroyed Cylon ships just return to the supply.</li>
          <li>Evasive Maneuvers only works when a viper is <em>attacked</em>, not other damage.</li>
          {flags.daybreak && <li>Assault raptors attack like vipers and may stay in space when the fleet jumps.</li>}
        </ul>
      </section>
    </div>
  );
}
