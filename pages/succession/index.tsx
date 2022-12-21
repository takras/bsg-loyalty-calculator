import styles from "../../styles/succession.module.css";
import characters from "../../data/characters.json";
import succession from "../../data/succession.json";
import useToggleBoxes from "../../hooks/use-toggle-boxes";

interface Props {
  id: string;
  name: string;
  order: string[];
}

export default function Succession({ id, name, order }: Props) {
  const { Buttons, enabledBoxes } = useToggleBoxes();
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
      <Buttons />
      <h2>{name}</h2>
      <ul>
        {order.map((id) => (
          <Character id={id} />
        ))}
      </ul>
    </>
  );
}
