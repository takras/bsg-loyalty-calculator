// Longer Quick rules card bodies. Sources: the unified rulebook and the Complete BSG Quick Reference /
// Combined Rules 2.0. Content adapts to the configured expansions.
import { useStore } from "../state/store";
import { TokenImg } from "./TokenImg";

export function CylonTurn() {
  const { flags, state } = useStore();
  const { config, players } = state;
  const n = players.length;
  const draws = flags.noSympathizer && (n === 4 || n === 6) ? 3 : 2;
  const newCaprica = config.ending === "newcaprica";
  const jumpIconCounts = flags.expansion || flags.overlay;

  return (
    <>
      <ol>
        <li>
          <strong>Receive Skills:</strong> draw {draws} Skill cards {flags.expansion ? "of different types" : "of any type"}
          {draws === 3 && " (No Sympathizer, 4/6 players)"}.
          {config.daybreak && <> On the Resurrection Ship{newCaprica ? " or in the Medical Center" : ""}: draw only 1.</>}
          {flags.cylonLeader && " A Cylon Leader draws from their own skill set."}
        </li>
        <li>
          <strong>Movement:</strong> move to another Cylon location (discard 1 Skill card to change ship){flags.pegasus && ", or use a Movement ability"}.
        </li>
        <li>
          <strong>Action:</strong> take one action – usually your location’s.
        </li>
        <li className="muted">
          <strong>No Crisis step and no Activate Cylon Ships step.</strong>
        </li>
        <li>
          <strong>Prepare for Jump:</strong> only if you resolved a Crisis this turn (e.g. at Caprica).{" "}
          {jumpIconCounts ? "Its jump icon advances the fleet token." : "In the base game its jump icon is ignored."}
        </li>
        <li>
          <strong>Discard</strong> down to 10 Skill cards.
        </li>
      </ol>

      <h4 className="sub-head">Cylon players cannot</h4>
      <ul>
        <li>hold titles, or be sent to the Brig{newCaprica ? ", Detention" : ""} or Sickbay{flags.pegasus ? " (or chosen for the Airlock)" : ""};</li>
        <li>
          use Skill card text{flags.treachery ? " (except Treachery cards)" : ""}, Quorum cards{config.daybreak ? ", Mutiny cards" : ""} or
          their old character’s abilities{flags.cylonLeader ? " – Cylon Leaders keep their own" : ""};
        </li>
        <li>add more than 1 card to a Skill check.</li>
      </ul>
      <p className="small">They may ignore Crisis effects unless the card says it affects Cylon players.</p>

      {config.daybreak ? (
        <>
          <h4 className="sub-head">Cylon locations</h4>
          <ul className="loc-list">
            <li>
              <strong>Caprica:</strong> play 1 of your Super Crisis cards, or draw 2 Crisis cards, resolve 1 and put the
              other on the bottom (no Activate Cylon Ships step).
            </li>
            <li>
              <strong>Cylon Fleet:</strong> activate all Cylon ships of one type, or launch 2 raiders and 1 heavy raider
              from each basestar on the main board.
            </li>
            <li>
              <strong>Human Fleet:</strong> look at the top Crisis or Destination card, put it on top or bottom, then draw
              2 Skill cards.{flags.infiltrator && " Or: Infiltrate Galactica."}
            </li>
            <li>
              <strong>Resurrection Ship:</strong> draw only 1 Skill card in Receive Skills. Action: draw 1 Super Crisis
              card.
            </li>
            {flags.cylonFleet && (
              <li>
                <strong>Basestar Bridge:</strong> choose 2 different: the CAG places a civilian ship · roll 1–3 jump track
                −1, 4–8 Pursuit +1 · place a basestar or 3 raiders in one Cylon Fleet area · roll, and if lower than the
                raiders on the main board, draw 2 Galactica damage tokens and resolve 1.
              </li>
            )}
            {newCaprica && (
              <>
                <li><strong>Occupation Authority:</strong> activate 1 Occupation Force, then place 1 here.</li>
                <li><strong>Breeder’s Canyon:</strong> draw and resolve the top Crisis; skip this turn’s Prepare for Jump step.</li>
                <li><strong>Shipyard:</strong> look at the top Locked civilian ship and put it on top or bottom of the stack.</li>
                <li>
                  <strong>Detain a Human:</strong> in a location with a human and an Occupation Force, roll: 1–3 Detention,
                  4–7 Medical Center, 8 no effect.
                </li>
              </>
            )}
          </ul>
        </>
      ) : (
        <p className="small muted">Use the actions printed on your board’s Cylon locations.</p>
      )}
    </>
  );
}

export function TraumaTokens() {
  const { state } = useStore();
  const ionian = state.config.ending === "ioniannebula";
  return (
    <>
      <div className="trauma-row">
        <figure>
          <TokenImg id="trauma-benevolent" alt="" />
          <figcaption>Benevolent</figcaption>
        </figure>
        <figure>
          <TokenImg id="trauma-antagonistic" alt="" />
          <figcaption>Antagonistic</figcaption>
        </figure>
        {ionian && (
          <figure>
            <TokenImg id="trauma-disaster" alt="" />
            <figcaption>Disaster</figcaption>
          </figure>
        )}
      </div>
      <p className="small">Humans want benevolent tokens, Cylons antagonistic ones. Keep your tokens face down.</p>
      {ionian ? (
        <>
          <h4 className="sub-head">Drawing a token</h4>
          <ol>
            <li>Keep any benevolent or antagonistic token.</li>
            <li>
              Reveal a disaster token: a <strong>human player is executed</strong>; a Cylon player draws 2 more (repeat
              for further disasters) and keeps the rest.
            </li>
            <li>Return disaster tokens to the pool and mix it.</li>
          </ol>
          <p className="small muted">
            Start of your turn on a location with a token (e.g. Brig, Sickbay): take it and replace it from the pool.
          </p>
        </>
      ) : (
        <ul>
          <li>No disaster tokens in this variant.</li>
          <li>Draw 1 when sent to the Brig or Sickbay; a hidden Cylon who is executed draws 1.</li>
          <li>Allies are resolved with a token drawn from the Mood Pool.</li>
          <li>At distance 8 everyone reveals tokens and scores them (Trauma phase).</li>
        </ul>
      )}
    </>
  );
}
