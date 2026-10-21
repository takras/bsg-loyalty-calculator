import { useState } from "react";
import {
  DISCLAIMER,
  PRIVACY_URL,
  fontCredits,
  gameCredits,
  originalCredits,
  ruleCredits,
  softwareCredits,
  type Credit,
} from "../data/attributions";
import { Collapsible } from "./Collapsible";

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
        {state === "loading" ? "Loading…" : "Show full licence texts"}
      </button>
      {state === "error" && <span className="muted"> Couldn't load the licence texts.</span>}
    </p>
  );
}

/** Legal notes: kept at the end of Quick rules and visually de-emphasised. */
export function Attributions() {
  return (
    <article className="card rule attributions" id="about">
      <Collapsible level={3} title="About & attributions">
        <p className="disclaimer">{DISCLAIMER}</p>
        <p className="small">
          <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
            Privacy policy
          </a>{" "}
          – the app collects no personal data; your game is only saved on this device.
        </p>
        <CreditList title="The game" items={gameCredits} />
        <CreditList title="Rules sources" items={ruleCredits} />
        <CreditList title="Software" items={softwareCredits} />
        <CreditList title="Fonts" items={fontCredits} />
        <CreditList title="This project" items={originalCredits} />
        <h4 className="credit-head">Licence texts</h4>
        <p className="credit-detail">
          The open-source software and fonts bundled in this app are distributed under the MIT and SIL Open Font
          licences; their full texts are included with the app.
        </p>
        <LicenceTexts />
      </Collapsible>
    </article>
  );
}
