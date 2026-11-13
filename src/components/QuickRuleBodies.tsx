// Longer Quick rules card bodies. Sources: the unified rulebook and the Complete BSG Quick Reference /
// Combined Rules 2.0. Content adapts to the configured expansions.
import { T, t } from "../i18n";
import { useStore } from "../state/store";
import { TokenImg } from "./TokenImg";

// quick.cylonTurn.* / quick.trauma.*; optional clauses are separate keys filled into {placeholders}
const c = (key: string, vars?: Record<string, string | number>) => t(`quick.cylonTurn.${key}`, vars);
const opt = (on: boolean, key: string) => (on ? c(key) : "");

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
          <T
            k={flags.expansion ? "quick.cylonTurn.receiveDifferent" : "quick.cylonTurn.receiveAny"}
            vars={{ count: draws, noSympathizer: opt(draws === 3, "receiveNoSympathizer") }}
          />
          {config.daybreak && ` ${c(newCaprica ? "receiveResurrectionMedical" : "receiveResurrection")}`}
          {flags.cylonLeader && ` ${c("receiveLeader")}`}
        </li>
        <li>
          <T k="quick.cylonTurn.movement" vars={{ ability: opt(flags.pegasus, "movementAbility") }} />
        </li>
        <li>
          <T k="quick.cylonTurn.action" />
        </li>
        <li className="muted">
          <T k="quick.cylonTurn.noCrisis" />
        </li>
        <li>
          <T k="quick.cylonTurn.jump" /> {c(jumpIconCounts ? "jumpCounts" : "jumpIgnored")}
        </li>
        <li>
          <T k="quick.cylonTurn.discard" />
        </li>
      </ol>

      <h4 className="sub-head">{c("cannot.title")}</h4>
      <ul>
        <li>
          {c("cannot.titles", {
            detention: opt(newCaprica, "cannot.detention"),
            airlock: opt(flags.pegasus, "cannot.airlock"),
          })}
        </li>
        <li>
          {c("cannot.use", {
            treachery: opt(flags.treachery, "cannot.treachery"),
            mutiny: opt(config.daybreak, "cannot.mutiny"),
            leaders: opt(flags.cylonLeader, "cannot.leaders"),
          })}
        </li>
        <li>{c("cannot.cards")}</li>
      </ul>
      <p className="small">{c("ignoreCrisis")}</p>

      {config.daybreak ? (
        <>
          <h4 className="sub-head">{c("locations.title")}</h4>
          <ul className="loc-list">
            <li>
              <T k="quick.cylonTurn.locations.caprica" />
            </li>
            <li>
              <T k="quick.cylonTurn.locations.fleet" />
            </li>
            <li>
              <T k="quick.cylonTurn.locations.humanFleet" />
              {flags.infiltrator && ` ${c("locations.infiltrate")}`}
            </li>
            <li>
              <T k="quick.cylonTurn.locations.resurrection" />
            </li>
            {flags.cylonFleet && (
              <li>
                <T k="quick.cylonTurn.locations.bridge" />
              </li>
            )}
            {newCaprica && (
              <>
                <li><T k="quick.cylonTurn.locations.authority" /></li>
                <li><T k="quick.cylonTurn.locations.canyon" /></li>
                <li><T k="quick.cylonTurn.locations.shipyard" /></li>
                <li><T k="quick.cylonTurn.locations.detain" /></li>
              </>
            )}
          </ul>
        </>
      ) : (
        <p className="small muted">{c("locations.board")}</p>
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
          <figcaption>{t("quick.trauma.benevolent")}</figcaption>
        </figure>
        <figure>
          <TokenImg id="trauma-antagonistic" alt="" />
          <figcaption>{t("quick.trauma.antagonistic")}</figcaption>
        </figure>
        {ionian && (
          <figure>
            <TokenImg id="trauma-disaster" alt="" />
            <figcaption>{t("quick.trauma.disaster")}</figcaption>
          </figure>
        )}
      </div>
      <p className="small">{t("quick.trauma.want")}</p>
      {ionian ? (
        <>
          <h4 className="sub-head">{t("quick.trauma.drawing")}</h4>
          <ol>
            <li>{t("quick.trauma.keep")}</li>
            <li>
              <T k="quick.trauma.revealDisaster" />
            </li>
            <li>{t("quick.trauma.return")}</li>
          </ol>
          <p className="small muted">{t("quick.trauma.startOfTurn")}</p>
        </>
      ) : (
        <ul>
          <li>{t("quick.trauma.noDisasters")}</li>
          <li>{t("quick.trauma.brigSickbay")}</li>
          <li>{t("quick.trauma.allies")}</li>
          <li>{t("quick.trauma.distance8")}</li>
        </ul>
      )}
    </>
  );
}
