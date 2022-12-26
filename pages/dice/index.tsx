import React from "react";
import dicehits from "../api/dicehits.json";

import styles from "../../styles/DiceHits.module.css";

interface Ship {
  id: string;
  name: string;
  source: Attacker[];
}
interface Attacker {
  id: string;
  min: number;
  max: number;
  effect: string;
}

export default function DiceHitsPage() {
  const Target = ({ ship: target }: { ship: Ship }) => {
    return (
      <li className={styles.target}>
        <div className={styles.targetName}>{shipName(target.id)}</div>
        <div>
          {target.source.map((attacker) => (
            <Attacker source={attacker} key={attacker.id + attacker.effect} />
          ))}
        </div>
      </li>
    );
  };

  const shipName = (id: string) => {
    return dicehits.ships.find((ship) => ship.id === id)?.name || null;
  };

  const displayAttackerName = (id: string) => {
    if (id === "any" || !shipName(id)) {
      return <span></span>;
    }
    return <span className={styles.sourceName}>(w/{shipName(id)})</span>;
  };

  const Attacker = ({ source }: { source: Attacker }) => (
    <div className={styles.attacker}>
      {displayAttackerName(source.id)}
      <span className={styles.range}>
        {source.min === source.max ? source.min : `${source.min}-${source.max}`}
      </span>
      <span className={styles.effect}>
        {dicehits.effects.find((effect) => effect.id === source.effect).name}
      </span>
    </div>
  );

  return (
    <div className={styles.diceHits}>
      <ul className={styles.diceHitsList}>
        {dicehits.ships.map((ship) => (
          <Target ship={ship} key={ship.id} />
        ))}
      </ul>
    </div>
  );
}
