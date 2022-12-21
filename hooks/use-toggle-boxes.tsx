import { useState } from "react";
import versions from "../data/versions.json";

export default function useToggleBoxes() {
  const [enabledBoxes, setEnabledBoxes] = useState(["core"]);

  const toggleBox = (version) => {
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
            <button onClick={() => toggleBox(version.id)}>
              {version.name}
            </button>
          ))}
      </div>
    );
  };
  return { Buttons, enabledBoxes };
}
