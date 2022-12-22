import React from "react";

export const settings = {
  selectedCategory: "admiral",
  enabledBoxes: ["core"],
};

const SettingsContext = React.createContext(settings);

export const SettingsProvider = SettingsContext.Provider;
export default SettingsContext;
