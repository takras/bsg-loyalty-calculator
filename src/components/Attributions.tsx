import { useState } from "react";
import { t } from "../i18n";
import {
  disclaimer,
  PRIVACY_URL,
  fontCredits,
  gameCredits,
  originalCredits,
  ruleCredits,
  softwareCredits,
  type Credit,
} from "../data/attributions";
import { Collapsible } from "./Collapsible";
import { AppVersion } from "./AppVersion";

function CreditList({ title, items }: { title: string; items: Credit[] }) {
  return (
    <>
      <h4 className="credit-head">{title}</h4>
      <ul className="credits">
        {items.map((c) => (
          <li key={c.name}>
            <span className="credit-name">
              {c.url ? (
                <a href={c.url} target="_blank" rel="noopener noreferrer">
                  {c.name}
                </a>
              ) : (
                c.name
              )}
            </span>
            {c.license && <span className="badge ghost">{c.license}</span>}
            {c.detail && <span className="credit-detail">{c.detail}</span>}
          </li>
        ))}
      </ul>
    </>
  );
}

/** Full licence texts from third-party-licenses.txt (generated at build time, served live in dev; see licenses-plugin.ts). */
function LicenceTexts() {
  const [text, setText] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const load = async () => {
    setState("loading");
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}third-party-licenses.txt`);
      // A missing file can come back as the app's index.html from an SPA fallback, so check the type too.
      if (!res.ok || !res.headers.get("content-type")?.startsWith("text/plain")) throw new Error(String(res.status));
      setText(await res.text());
      setState("idle");
    } catch {
      setState("error");
    }
  };
  if (text) return <pre className="licence-texts">{text}</pre>;
  return (
    <p className="small">
      <button className="xs" onClick={load} disabled={state === "loading"}>
        {t(state === "loading" ? "about.licences.loading" : "about.licences.show")}
      </button>
      {state === "error" && <span className="muted"> {t("about.licences.error")}</span>}
    </p>
  );
}

/** Legal notes: kept at the end of Quick rules and visually de-emphasised. */
export function Attributions() {
  return (
    <article className="card rule attributions" id="about">
      <Collapsible level={3} title={t("about.title")}>
        <AppVersion />
        <p className="disclaimer">{disclaimer()}</p>
        <p className="small">
          <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
            {t("about.privacy")}
          </a>{" "}
          {t("about.privacyNote")}
        </p>
        <CreditList title={t("about.game")} items={gameCredits()} />
        <CreditList title={t("about.rules")} items={ruleCredits()} />
        <CreditList title={t("about.software")} items={softwareCredits()} />
        <CreditList title={t("about.fonts")} items={fontCredits()} />
        <CreditList title={t("about.project")} items={originalCredits()} />
        <h4 className="credit-head">{t("about.licences")}</h4>
        <p className="credit-detail">{t("about.licencesNote")}</p>
        <LicenceTexts />
      </Collapsible>
    </article>
  );
}
