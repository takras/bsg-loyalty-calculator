import type { ReactNode } from "react";

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
        <span className="collapse-hint" aria-hidden />
      </summary>
      <div className="collapsible-body">{children}</div>
    </details>
  );
}
