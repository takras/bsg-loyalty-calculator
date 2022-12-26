import successions from "../api/succession.json";
import characters from "../api/characters.json";
import { useContext } from "react";
import SettingsContext from "../../settings/settings-provider";

import styles from "../../styles/succession.module.css";

export default function SuccessionPage() {
  const { enabledBoxes, selectedCategory } = useContext(SettingsContext);
  const { name, order } = successions.find(
    (succession) => succession.id === selectedCategory
  );

  const activeCharacters = characters.filter((character) =>
    enabledBoxes.some((box) => box === character.version)
  );

  const Character = ({ id }) => {
    const character = activeCharacters.find((character) => character.id === id);
    if (!character) {
      return null;
    }

    const isAlternate = activeCharacters.some(
      (alternate) => alternate.alternate === character.id
    );

    const hasAlternate = activeCharacters.some(
      (original) => original.original === character.id
    );

    const isOriginal = character.alternate && hasAlternate;

    const supplement = isOriginal
      ? " (Original)"
      : isAlternate
      ? " (Alternate)"
      : "";

    return (
      <li>
        {character.firstName}
        {supplement}
      </li>
    );
  };

  return (
    <>
      <h2>{name}</h2>
      <ul>
        {order.map((id) => (
          <Character id={id} key={id} />
        ))}
      </ul>
    </>
  );
}
