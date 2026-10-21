import type { ReactNode } from "react";
import { Attributions } from "../components/Attributions";
import { Collapsible } from "../components/Collapsible";
import { GameIcon } from "../components/GameIcon";
import { CylonTurn, TraumaTokens } from "../components/QuickRuleBodies";
import { RecklessSummary } from "../components/RecklessRule";
import { useStore } from "../state/store";

interface Rule {
  id: string;
  title: string;
  tag?: string;
  icon?: ReactNode;
  show: boolean;
  body: ReactNode;
}

export function QuickRulesView() {
  const { flags, state } = useStore();
  const { config } = state;

  const rules: Rule[] = [
    {
      id: "reckless",
      title: "Reckless",
      tag: config.daybreak ? "Pegasus + Daybreak" : "Pegasus",
      show: config.pegasus,
      body: (
        <>
          <RecklessSummary />
          <p className="small">Only one Reckless card per check. Not combinable with “Restore Order” either way.</p>
        </>
      ),
    },
    {
      id: "sca",
      title: "Skill Check Abilities",
      icon: <GameIcon id="skill-check-ability" alt="" className="rule-icon" />,
      show: flags.expansion,
      body: (
        <ul>
          <li>Cards with the Skill Check Ability icon only trigger when revealed in a check. Duplicates by name resolve once.</li>
          <li>Current player picks the order. A Crisis “consequence” (icon outcome) triggers if at least one such card was played.</li>
          {flags.treachery && <li>Human players can’t use Treachery text otherwise; anyone may put them in checks. Treachery always counts negative.</li>}
        </ul>
      ),
    },
    {
      id: "reveal",
      title: "Revealing as a Cylon",
      show: true,
      body: (
        <ol>
          <li>Reveal as your action and do the card’s action (not if in the Brig{flags.execution ? " or executed" : ""}).</li>
          <li>Discard Skill cards down to 3; discard attached Quorum cards{config.daybreak ? ", Mutiny cards, Miracle token" : ""}.</li>
          <li>Lose titles down the lines of succession.</li>
          <li>Move to the Resurrection Ship. Draw a Super Crisis card.</li>
          {flags.overlay ? (
            <li>Distance 6 or less: pass your other Loyalty cards face down to one human player.</li>
          ) : (
            <li>Keep other Loyalty cards hidden; pass them on from the Resurrection Ship.</li>
          )}
          {config.daybreak && <li>If you were the Mutineer, give the Mutineer card to a human player.</li>}
          <li>If you revealed on your own turn, your turn ends – no Crisis.</li>
          <li>From now on, play Cylon turns (see “Cylon player’s turn”).</li>
        </ol>
      ),
    },
    {
      id: "cylon-turn",
      title: "Cylon player’s turn",
      show: true,
      body: <CylonTurn />,
    },
    {
      id: "sleeper",
      title: "Sleeper Agent phase",
      show: true,
      body: (
        <ul>
          <li>At the objective card’s distance: deal 1 Loyalty card to every player{flags.cylonLeader ? " except the Cylon Leader" : ""}, revealed Cylons included. Boomer gets 2.</li>
          {flags.overlay ? (
            <li>Revealed Cylons look at theirs and pass them face down to one human.</li>
          ) : (
            <li>Revealed Cylons keep theirs secret (can pass them via the Resurrection Ship).</li>
          )}
          {flags.motive && flags.cylonLeader && <li>The Cylon Leader gets 2 more Motive cards.</li>}
          {config.daybreak && <li>Mutineer still in the deck afterwards → current player picks a human to draw 1 more.</li>}
        </ul>
      ),
    },
    {
      id: "brig",
      title: "Brig & Sickbay",
      show: true,
      body: (
        <ul>
          <li>Brig: no moving out unless the Brig check is passed or an effect names the Brig. Max 1 card into checks.</li>
          <li>When choosing who goes to the Brig/Sickbay you must pick someone who can actually move there, if possible.</li>
          <li>Admiral{config.cylonFleet ? "/CAG" : ""} sent to the Brig loses the title.</li>
          {flags.pegasus && <li>Movement actions may still be used in the Brig.</li>}
        </ul>
      ),
    },
    {
      id: "trauma",
      title: "Trauma tokens",
      tag: config.ending === "ioniannebula" ? "Ionian Nebula" : "Allies for All Seasons",
      show: flags.allies,
      body: <TraumaTokens />,
    },
    {
      id: "miracle",
      title: "Miracle tokens",
      tag: "Daybreak",
      show: config.daybreak,
      body: (
        <ul>
          <li>Once-per-game abilities now cost 1 Miracle token and can be used again later.</li>
          <li>Max 1 token per player (support Baltar: 3). Tokens can’t be traded.</li>
        </ul>
      ),
    },
    {
      id: "mutiny",
      title: "Mutiny cards",
      tag: "Daybreak",
      show: config.daybreak,
      body: (
        <ul>
          <li>Limit 1 (the Mutineer: 2). Going over: go to the Brig, then discard down to the limit.</li>
          <li>Revealed Cylons can’t hold, play or be targeted to draw Mutiny cards.</li>
          <li>Max one Mutiny card per turn from choosing to discard Treachery.</li>
        </ul>
      ),
    },
    {
      id: "infiltrate",
      title: "Infiltrating",
      show: flags.infiltrator,
      body: (
        <ul>
          <li>Action at “Human Fleet”: become an Infiltrator, treated as a human player.</li>
          <li>Draw 1 extra Skill card; max 2 cards into checks; cannot hold titles.</li>
          <li>Action: end Infiltration and move to the Resurrection Ship (discard to 3 if leaving the Brig).</li>
        </ul>
      ),
    },
    {
      id: "nukes",
      title: "Nukes",
      show: true,
      body: (
        <ul>
          <li>Admiral starts with 2. {flags.exodus ? "Used nukes are discarded and can be regained (3rd token in the box)." : "Used nukes are removed from the game."}</li>
          <li>{flags.cylonFleet ? "Targets a whole space area: 1–2 basestar damaged twice · 3–6 basestar destroyed · 7 + 3 raiders · 8 everything." : "1–2 damaged twice · 3–6 destroyed · 7–8 destroyed + 3 raiders."}</li>
        </ul>
      ),
    },
    {
      id: "jump",
      title: "Jumping",
      show: true,
      body: (
        <ol>
          <li>FTL Control: roll first; 6 or less → lose the population on the current jump space.</li>
          {flags.demetrius && <li>Follow the Active Mission space instructions.</li>}
          {flags.cylonFleet ? (
            <li>Cylon ships to the matching fleet-board areas; vipers to the Reserves; civilians stay.</li>
          ) : (
            <li>Remove all ships from the board (Centurions stay); pilots to the Hangar Deck.</li>
          )}
          {config.daybreak && <li>Assault raptors may stay in space.</li>}
          <li>Admiral draws 2 Destinations, picks 1 secretly, the other goes to the bottom.</li>
          <li>Resolve it, add the distance, check the objective card, reset the jump track.</li>
        </ol>
      ),
    },
    {
      id: "limits",
      title: "Hand limits & secrecy",
      show: true,
      body: (
        <ul>
          <li>End of every turn: discard down to 10 Skill cards{flags.expansion ? " (and 10 Quorum cards for the President)" : ""}.</li>
          <li>No exact card strengths or types in talk; “a lot/a little”, “good/bad” are fine.</li>
          <li>Resource at 0: humans have until the end of the turn to fix it.</li>
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
