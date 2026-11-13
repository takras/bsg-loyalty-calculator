import type { ReactNode } from "react";
import { Attributions } from "../components/Attributions";
import { Collapsible } from "../components/Collapsible";
import { GameIcon } from "../components/GameIcon";
import { CylonTurn, TraumaTokens } from "../components/QuickRuleBodies";
import { RecklessSummary } from "../components/RecklessRule";
import { BOX_LABEL } from "../data/characters";
import { t } from "../i18n";
import { endingLabel } from "../logic/config";
import { useStore } from "../state/store";

interface Rule {
  id: string;
  title: string;
  tag?: string;
  icon?: ReactNode;
  show: boolean;
  body: ReactNode;
}

// quick.<rule>.<item>
const q = (key: string) => t(`quick.${key}`);

export function QuickRulesView() {
  const { flags, state } = useStore();
  const { config } = state;

  const rules: Rule[] = [
    {
      id: "reckless",
      title: q("reckless.title"),
      tag: config.daybreak ? `${BOX_LABEL.pegasus} + ${BOX_LABEL.daybreak}` : BOX_LABEL.pegasus,
      show: config.pegasus,
      body: (
        <>
          <RecklessSummary />
          <p className="small">{q("reckless.onePerCheck")}</p>
        </>
      ),
    },
    {
      id: "sca",
      title: q("sca.title"),
      icon: <GameIcon id="skill-check-ability" alt="" className="rule-icon" />,
      show: flags.expansion,
      body: (
        <ul>
          <li>{q("sca.trigger")}</li>
          <li>{q("sca.order")}</li>
          {flags.treachery && <li>{q("sca.treachery")}</li>}
        </ul>
      ),
    },
    {
      id: "reveal",
      title: q("reveal.title"),
      show: true,
      body: (
        <ol>
          <li>{q(flags.execution ? "reveal.actionExecution" : "reveal.action")}</li>
          <li>{q(config.daybreak ? "reveal.discardDaybreak" : "reveal.discard")}</li>
          <li>{q("reveal.titles")}</li>
          <li>{q("reveal.resurrection")}</li>
          <li>{q(flags.overlay ? "reveal.loyaltyOverlay" : "reveal.loyalty")}</li>
          {config.daybreak && <li>{q("reveal.mutineer")}</li>}
          <li>{q("reveal.ownTurn")}</li>
          <li>{q("reveal.fromNow")}</li>
        </ol>
      ),
    },
    {
      id: "cylon-turn",
      title: q("cylonTurn.title"),
      show: true,
      body: <CylonTurn />,
    },
    {
      id: "sleeper",
      title: q("sleeper.title"),
      show: true,
      body: (
        <ul>
          <li>{q(flags.cylonLeader ? "sleeper.dealLeader" : "sleeper.deal")}</li>
          <li>{q(flags.overlay ? "sleeper.revealedOverlay" : "sleeper.revealed")}</li>
          {flags.motive && flags.cylonLeader && <li>{q("sleeper.motives")}</li>}
          {config.daybreak && <li>{q("sleeper.mutineer")}</li>}
        </ul>
      ),
    },
    {
      id: "brig",
      title: q("brig.title"),
      show: true,
      body: (
        <ul>
          <li>{q("brig.noMoving")}</li>
          <li>{q("brig.choose")}</li>
          <li>{q(config.cylonFleet ? "brig.adminCag" : "brig.admiral")}</li>
          {flags.pegasus && <li>{q("brig.movement")}</li>}
        </ul>
      ),
    },
    {
      id: "trauma",
      title: q("trauma.title"),
      tag: config.ending === "ioniannebula" ? endingLabel("ioniannebula") : t("setup.variant.allySeasons"),
      show: flags.allies,
      body: <TraumaTokens />,
    },
    {
      id: "miracle",
      title: q("miracle.title"),
      tag: BOX_LABEL.daybreak,
      show: config.daybreak,
      body: (
        <ul>
          <li>{q("miracle.cost")}</li>
          <li>{q("miracle.limit")}</li>
        </ul>
      ),
    },
    {
      id: "mutiny",
      title: q("mutiny.title"),
      tag: BOX_LABEL.daybreak,
      show: config.daybreak,
      body: (
        <ul>
          <li>{q("mutiny.limit")}</li>
          <li>{q("mutiny.cylons")}</li>
          <li>{q("mutiny.perTurn")}</li>
        </ul>
      ),
    },
    {
      id: "infiltrate",
      title: q("infiltrate.title"),
      show: flags.infiltrator,
      body: (
        <ul>
          <li>{q("infiltrate.become")}</li>
          <li>{q("infiltrate.limits")}</li>
          <li>{q("infiltrate.end")}</li>
        </ul>
      ),
    },
    {
      id: "nukes",
      title: q("nukes.title"),
      show: true,
      body: (
        <ul>
          <li>{q(flags.exodus ? "nukes.startExodus" : "nukes.start")}</li>
          <li>{q(flags.cylonFleet ? "nukes.rollFleet" : "nukes.roll")}</li>
        </ul>
      ),
    },
    {
      id: "jump",
      title: q("jump.title"),
      show: true,
      body: (
        <ol>
          <li>{q("jump.ftl")}</li>
          {flags.demetrius && <li>{q("jump.mission")}</li>}
          <li>{q(flags.cylonFleet ? "jump.shipsFleet" : "jump.ships")}</li>
          {config.daybreak && <li>{q("jump.assault")}</li>}
          <li>{q("jump.destinations")}</li>
          <li>{q("jump.resolve")}</li>
        </ol>
      ),
    },
    {
      id: "limits",
      title: q("limits.title"),
      show: true,
      body: (
        <ul>
          <li>{q(flags.expansion ? "limits.handQuorum" : "limits.hand")}</li>
          <li>{q("limits.talk")}</li>
          <li>{q("limits.zero")}</li>
        </ul>
      ),
    },
  ];

  return (
    <div className="view quick">
      <div className="rule-grid">
        {rules
          .filter((r) => r.show)
          .map((r) => (
            <article key={r.id} className="card rule" id={`rule-${r.id}`}>
              <Collapsible
                level={3}
                title={
                  <>
                    {r.icon} {r.title} {r.tag && <span className="badge ghost">{r.tag}</span>}
                  </>
                }
              >
                {r.body}
              </Collapsible>
            </article>
          ))}
      </div>
      <Attributions />
    </div>
  );
}
