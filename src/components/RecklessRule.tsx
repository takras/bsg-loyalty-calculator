import { useStore } from "../state/store";

/** How a Reckless Skill Check works (Pegasus; resolved differently when Daybreak is also in play). */
export function RecklessSummary() {
  const { state } = useStore();
  return state.config.daybreak ? (
    <>
      <p>
        A Skill card marked <strong>Reckless</strong> is played before cards are added and makes the check Reckless.
        After the Skill Check Abilities are resolved:
      </p>
      <ol>
        <li>Draw and show 1 Treachery card.</li>
        <li>
          <strong>Strength 0?</strong> Draw 1 more Treachery card, resolve <em>both</em> cards’ Skill Check Abilities
          (duplicates allowed), then discard both – they don’t count toward the total.
        </li>
        <li>Otherwise discard it – nothing happens.</li>
      </ol>
    </>
  ) : (
    <p>
      A Skill card marked <strong>Reckless</strong> is played before cards are added and makes the check Reckless.
      Treachery cards with a <em>“Reckless Skill Check”</em> ability only trigger when revealed in a Reckless check.
    </p>
  );
}

/** Where Reckless fits in the Skill Check sequence. */
export function RecklessSequence() {
  const { state } = useStore();
  const daybreak = state.config.daybreak;
  return (
    <ol className="steps reckless-steps">
      <li>Check begins – auto pass/fail effects resolve.</li>
      <li className="hl">
        <strong>Play the Reckless card</strong> (a “before cards are added” ability). Max one per check; not after
        “Restore Order”, and “Restore Order” can’t follow it.
      </li>
      <li>Add 2 Destiny cards, then players add cards (current player last).</li>
      <li>Shuffle and reveal.</li>
      <li className={daybreak ? "" : "hl"}>
        Resolve Skill Check Abilities.
        {!daybreak && (
          <>
            {" "}
            <strong>“Reckless Skill Check” Treachery abilities trigger now</strong> – only because the check is Reckless.
          </>
        )}
      </li>
      {daybreak && (
        <li className="hl">
          <strong>Reckless draw:</strong> show 1 Treachery card. Strength 0 → draw a second, resolve both abilities, discard
          both. Otherwise discard it, no effect.
        </li>
      )}
      <li>Consequence (Skill Check Ability outcome), total the strength, resolve pass / partial / fail.</li>
    </ol>
  );
}
