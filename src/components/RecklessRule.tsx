import { T, t } from "../i18n";
import { useStore } from "../state/store";

/** How a Reckless Skill Check works (Pegasus; resolved differently when Daybreak is also in play). */
export function RecklessSummary() {
  const { state } = useStore();
  return state.config.daybreak ? (
    <>
      <p>
        <T k="reckless.daybreak.intro" />
      </p>
      <ol>
        <li>{t("reckless.daybreak.step1")}</li>
        <li>
          <T k="reckless.daybreak.step2" />
        </li>
        <li>{t("reckless.daybreak.step3")}</li>
      </ol>
    </>
  ) : (
    <p>
      <T k="reckless.summary" />
    </p>
  );
}

/** Where Reckless fits in the Skill Check sequence. */
export function RecklessSequence() {
  const { state } = useStore();
  const daybreak = state.config.daybreak;
  return (
    <ol className="steps reckless-steps">
      <li>{t("reckless.seq.begins")}</li>
      <li className="hl">
        <T k="reckless.seq.play" />
      </li>
      <li>{t("reckless.seq.add")}</li>
      <li>{t("reckless.seq.reveal")}</li>
      <li className={daybreak ? "" : "hl"}>
        {daybreak ? t("reckless.seq.abilities") : <T k="reckless.seq.abilitiesTreachery" />}
      </li>
      {daybreak && (
        <li className="hl">
          <T k="reckless.seq.daybreakDraw" />
        </li>
      )}
      <li>{t("reckless.seq.consequence")}</li>
    </ol>
  );
}
