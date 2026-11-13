import { useEffect, useState } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { t } from "../i18n";

declare const __APP_VERSION__: string;

/**
 * The version the user is running. On the web it is the package.json version baked in at build time. In the
 * native apps it is read from the installed app itself (Android versionName/versionCode, iOS
 * CFBundleShortVersionString/CFBundleVersion), so it is exactly what the store delivered.
 */
export function AppVersion() {
  const [info, setInfo] = useState<{ version: string; build?: string }>({ version: __APP_VERSION__ });
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    App.getInfo()
      .then(({ version, build }) => setInfo({ version, build }))
      .catch(() => {});
  }, []);
  return (
    <p className="small app-version">
      {info.build ? t("about.versionBuild", { version: info.version, build: info.build }) : t("about.version", { version: info.version })}
    </p>
  );
}
