// Simple line icons for the dock, in the style of the CIC console glyphs.
const paths: Record<string, JSX.Element> = {
  setup: (
    <>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx={16} cy={7} r={2} />
      <circle cx={10} cy={17} r={2} />
    </>
  ),
  titles: (
    <>
      <path d="M12 3l7 5-7 5-7-5z" />
      <path d="M5 13l7 5 7-5" />
    </>
  ),
  combat: (
    <>
      <circle cx={12} cy={12} r={7} />
      <path d="M12 2v5M12 17v5M2 12h5M17 12h5" />
      <circle cx={12} cy={12} r={1.5} />
    </>
  ),
  crisis: (
    <>
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v5M12 18v.5" />
    </>
  ),
  execution: (
    <>
      <rect x={4} y={3} width={16} height={18} rx={2} />
      <path d="M4 12h16M12 3v18" />
      <circle cx={12} cy={12} r={3} />
    </>
  ),
  rules: (
    <>
      <path d="M4 5a2 2 0 012-2h12v16H6a2 2 0 00-2 2z" />
      <path d="M4 21V5M8 7h6M8 11h6" />
    </>
  ),
};

export function NavIcon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name]}
    </svg>
  );
}
