import { useContext, useState } from "react";
import versions from "../pages/api/versions.json";
import SettingsContext from "../settings/settings-provider";

import styles from "../styles/Button.module.css";

export default function useExpansions() {
  const settings = useContext(SettingsContext);
  const [enabledBoxes, setEnabledBoxes] = useState(settings.enabledBoxes);

  const toggleExpansion = (version) => {
    if (enabledBoxes.includes(version)) {
      setEnabledBoxes([...enabledBoxes.filter((box) => box !== version)]);
      return;
    }
    setEnabledBoxes([...enabledBoxes, version]);
  };

  const Buttons = () => {
    return (
      <div>
        {versions
          .filter((version) => version.canToggle)
          .map((version) => (
            <button
              key={version.id}
              onClick={() => toggleExpansion(version.id)}
              className={
                enabledBoxes.includes(version.id) ? styles.active : null
              }
            >
              {version.name}
            </button>
          ))}
      </div>
    );
  };
  return { ExpansionButtons: Buttons, enabledBoxes };
}
