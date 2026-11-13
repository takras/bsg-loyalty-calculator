import type { ReactNode } from "react";
import { t } from "../i18n";

/** Card content that folds away behind its angled header. Closed unless `open` is set. */
export function Collapsible({
  title,
  level = 2,
  open = false,
  children,
}: {
  title: ReactNode;
  level?: 2 | 3;
  open?: boolean;
  children: ReactNode;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <details className="collapsible" open={open}>
      <summary>
        <Heading>{title}</Heading>
        {/* both labels are rendered; CSS shows the one matching the open state */}
        <span className="collapse-hint" aria-hidden>
          <span className="hint-show">{t("collapse.show")}</span>
          <span className="hint-hide">{t("collapse.hide")}</span>
        </span>
      </summary>
      <div className="collapsible-body">{children}</div>
    </details>
  );
}
