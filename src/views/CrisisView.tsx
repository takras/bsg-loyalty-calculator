import type { ReactNode } from "react";
import { Collapsible } from "../components/Collapsible";
import { GameIcon, type GameIconId } from "../components/GameIcon";
import { TokenImg } from "../components/TokenImg";
import { RecklessSequence, RecklessSummary } from "../components/RecklessRule";
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
      icon: <Icon id="act-raiders" name="Activate Raiders" />,
      name: "Activate Raiders",
      does: (
        <>
          Each raider on the <strong>main board</strong> activates once (one space area at a time, current player picks
          the order). Each raider does the first possible:
          <ol>
            <li>Attack an unmanned viper in its area</li>
            <li>Attack a manned viper in its area</li>
            <li>Destroy a civilian ship in its area</li>
            <li>Move 1 area toward the nearest civilian ship (ties: clockwise)</li>
            <li>No civilians anywhere: attack Galactica (8 = damage)</li>
          </ol>
          No raiders on the board → <strong>each basestar launches 2 raiders</strong>.
        </>
      ),
      none: "No raiders and no basestars",
      fleetShip: "1 raider",
    },
    {
      key: "launch",
      icon: <Icon id="act-launch" name="Launch Raiders" />,
      name: "Launch Raiders",
      does: (
        <>
          Each basestar on the <strong>main board</strong> launches <strong>3 raiders</strong> into its own space area.
        </>
      ),
      none: "No basestars",
      fleetShip: "1 basestar",
      exception: "If the only basestar on the main board has a Disabled Hangar token, no basestar is placed and the Pursuit track does not advance.",
    },
    {
      key: "heavy",
      icon: <Icon id="act-heavy" name="Activate Heavy Raiders" />,
      name: "Activate Heavy Raiders (and Centurions)",
      does: (
        <>
          Do all, in order:
          <ol>
            <li>Every Centurion moves 1 step on the Boarding Party track</li>
            <li>Heavy raiders already in an area with a viper launch icon → replaced by a Centurion at the track start</li>
            <li>Other heavy raiders move 1 area toward the nearest launch icon</li>
            <li>No heavy raiders on the board at the start → each basestar launches 1 heavy raider</li>
          </ol>
        </>
      ),
      none: "No basestars, heavy raiders or Centurions",
      fleetShip: "1 heavy raider",
    },
    {
      key: "basestars",
      icon: <Icon id="act-basestars" name="Activate Basestars" />,
      name: "Activate Basestars",
      does: (
        <>
          Each basestar on the <strong>main board</strong> attacks Galactica (4–8 = damage)
          {flags.pegasus ? "; the current player may let Pegasus take the damage instead" : ""}. Disabled Weapons tokens
          stop a basestar firing.
        </>
      ),
      none: "No basestars",
      fleetShip: "1 basestar",
      exception: "If the only basestar on the main board has a Disabled Weapons token, no basestar is placed and the Pursuit track does not advance.",
    },
  ];

  return (
    <div className="view crisis">
      <section className="card">
        <h2>Crisis card resolution</h2>
        <ol className="steps">
          <li>Draw and read the Crisis.</li>
          <li>
            Resolve it: {cf ? "" : "Cylon Attack, "}Skill Check{flags.pegasus ? " (possibly Reckless – see below)" : ""}, or
            “[Someone] Chooses” event.
          </li>
          <li>
            <strong>Activate Cylon ships</strong> shown bottom-left (left to right if several).
          </li>
          <li>
            <strong>Prepare for Jump</strong> icon bottom-right → advance the jump track 1 space (may trigger a jump).
          </li>
          <li>Discard the Crisis unless told to keep it.</li>
        </ol>
        <p className={`mode-pill ${cf ? "on" : ""}`}>
          {cf ? (
            <>
              <strong>Cylon Fleet board in use:</strong> ships always activate on the main board, but when there is
              nothing to activate a ship is <em>placed on the Cylon Fleet board</em> instead.
            </>
          ) : (
            <>
              <strong>No Cylon Fleet board:</strong> new ships only come in via Cylon Attack cards, launches, and
              location/card effects – all on the main board. With nothing to activate, nothing happens.
            </>
          )}
        </p>
      </section>

      {flags.pegasus && (
        <section className="card reckless-card" id="reckless">
          <Collapsible title="Reckless Skill Checks">
            <RecklessSummary />
            <h3 className="sub">Where it happens in the Skill Check</h3>
            <RecklessSequence />
          </Collapsible>
        </section>
      )}

      <h2 className="section-title">Activation icons</h2>
      <div className="icon-grid">
        {entries.map((e) => (
          <article key={e.key} className="card icon-card">
            <header>
              {e.icon}
              <h3>{e.name}</h3>
            </header>
            <div className="icon-body">{e.does}</div>
            <div className={`fallback ${cf ? "fleet" : ""}`}>
              <strong>{e.none}?</strong>{" "}
              {cf ? (
                <>
                  Place <strong>{e.fleetShip}</strong> on the <strong>Cylon Fleet board</strong> (see below).
                </>
              ) : (
                "Nothing happens."
              )}
              {cf && e.exception && <div className="small exception">{e.exception}</div>}
            </div>
          </article>
        ))}
        <article className="card icon-card">
          <header>
            <JumpIcon />
            <h3>Prepare for Jump</h3>
          </header>
          <div className="icon-body">
            Advance the fleet token 1 space on the jump track. At Auto-Jump the fleet jumps.
            {flags.ending === "newcaprica" && (
              <p>
                <strong>New Caprica phase:</strong> before Galactica returns this still advances the track (Auto-Jump
                brings Galactica back). Afterwards ignore it and resolve the <em>Evacuation</em> icon instead: move the
                top Prepared civilian ship to a viper launch area.
              </p>
            )}
            {flags.daybreak && <p>The Mutineer must draw a Mutiny card when resolving this icon on their Crisis.</p>}
            {flags.expansion && <p>Cylon using the Caprica location: the jump icon is <em>not</em> ignored.</p>}
          </div>
        </article>
      </div>

      {cf && (
        <section className="card fleet-board">
          <h2>Placing on the Cylon Fleet board</h2>
          <ol className="steps">
            <li>
              Ship by icon:
              <span className="icon-map">
                <span><GameIcon id="act-raiders" alt="Activate Raiders" /> → raider</span>
                <span><GameIcon id="act-heavy" alt="Activate Heavy Raiders" /> → heavy raider</span>
                <span><GameIcon id="act-launch" alt="Launch Raiders" /> / <GameIcon id="act-basestars" alt="Activate Basestars" /> → basestar</span>
              </span>
            </li>
            <li>
              <strong>In supply?</strong> Roll a die (may be modified) and place it in the Cylon space area with that
              number.
            </li>
            <li>
              <strong>Supply empty?</strong> Take the highest-numbered Cylon space area holding that ship and move{" "}
              <em>all</em> ships there to the matching main-board area. Not on the fleet board at all → nothing moves.
            </li>
            <li>
              Advance the <strong>Pursuit marker</strong> 1 space:
              <ul>
                <li>Civilian ship icons → the CAG places that many civilian ships on the main board (empty areas first).</li>
                <li>
                  <strong>Auto Attack</strong> → move <em>all</em> fleet-board ships to the matching main areas and
                  reset the marker.
                </li>
              </ul>
            </li>
          </ol>
          <ul className="checks">
            <li>Ships on the Cylon Fleet board never activate or launch.</li>
            <li>
              When an effect places Cylon ships on the main board and the supply is out: take them from the
              lowest-numbered fleet area (no Pursuit advance).
            </li>
            <li>On a jump, all Cylon ships move to the matching fleet areas (basestar damage discarded); civilian ships stay.</li>
            <li>Cylon Fleet location “launch 2 raiders + 1 heavy raider” does not touch the fleet board.</li>
          </ul>
        </section>
      )}

      {!cf && (
        <section className="card">
          <h2>Cylon Attack cards</h2>
          <ol className="steps">
            <li><strong>Activate</strong> the shown ships first.</li>
            <li><strong>Setup</strong>: place the new ships shown (existing ships stay).</li>
            <li><strong>Special rule</strong> applies; discard the card unless it says to keep it in play.</li>
          </ol>
          <p className="small muted">Out of tokens? The current player chooses which to place.</p>
        </section>
      )}

      {flags.ending === "newcaprica" && (
        <section className="card">
          <h2>New Caprica activations</h2>
          <div className="occupation-head">
            <TokenImg id="occupation-forces" alt="Activate Occupation Forces icon" />
            <span className="small muted">Activate Occupation Forces</span>
          </div>
          <ul className="checks">
            <li>Before Galactica returns: ignore every activation except <strong>Occupation Forces</strong>, and anything that places, moves or damages ships.</li>
            <li>
              Occupation Forces: one at the Shipyard leaves and destroys a Locked (else Prepared) civilian ship; the rest
              move 1 right; none on the track → place one under Occupation Authority.
            </li>
            <li>Occupation Forces and Centurions are separate and never move each other.</li>
          </ul>
        </section>
      )}

      <section className="card">
        <h2>Ship placement reminders</h2>
        <ul className="checks">
          <li>
            A civilian ship to place with no area given:{" "}
            {cf ? "the CAG places it in an area without a civilian ship if possible." : "the Admiral chooses any area."}
          </li>
          <li>A heavy raider that can’t become a Centurion (no tokens) stays in space.</li>
          <li>Cylon players may ignore Crisis effects unless they say they apply to Cylons.</li>
          <li>Super Crisis cards ignore character abilities and anything that affects “Crisis cards”.</li>
        </ul>
      </section>
    </div>
  );
}
