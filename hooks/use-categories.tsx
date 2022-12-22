import { useContext, useState } from "react";
import successions from "../data/succession.json";
import SettingsContext from "../settings/settings-provider";

import styles from "../styles/Button.module.css";

export default function useCategoryButtons() {
  const settings = useContext(SettingsContext);
  const [selectedCategory, setSelectedCategory] = useState(
    settings.selectedCategory
  );

  const Buttons = () => {
    return (
      <div>
        {successions.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={selectedCategory === category.id ? styles.active : null}
          >
            {category.name}
          </button>
        ))}
      </div>
    );
  };
  return { CategoryButtons: Buttons, selectedCategory, setSelectedCategory };
}
