// Top-down silhouettes of the game's ship tokens/miniatures. Bow points up.
// Drawn with currentColor so the faction colour comes from CSS.

export type ShipId =
  | "galactica"
  | "pegasus"
  | "basestar"
  | "raider"
  | "scar"
  | "heavy"
  | "centurion"
  | "viper"
  | "viper7"
  | "assault"
  | "raptor"
  | "civilian"
  | "nuke"
  | "occupation"
  | "human";

const TRI_ARM = "M50 50 L43 41 Q45 14 50 6 Q55 14 57 41 Z";

function Basestar() {
  return (
    <g>
      <g opacity={0.55}>
        {[60, 180, 300].map((r) => (
          <path key={r} d={TRI_ARM} transform={`rotate(${r} 50 50)`} />
        ))}
      </g>
      {[0, 120, 240].map((r) => (
        <path key={r} d={TRI_ARM} transform={`rotate(${r} 50 50)`} />
      ))}
      <circle cx={50} cy={50} r={11} />
      <circle cx={50} cy={50} r={5} className="ship-detail" />
    </g>
  );
}

function Raider({ scar = false }: { scar?: boolean }) {
  return (
    <g>
      <path d="M50 26 Q72 28 95 66 Q82 60 70 63 Q60 54 50 57 Q40 54 30 63 Q18 60 5 66 Q28 28 50 26 Z" />
      <path d="M44 58 L50 74 L56 58 Z" />
      <rect x={42} y={32} width={16} height={3} rx={1.5} className="ship-eye" />
      {scar && <path d="M30 40 L62 56" className="ship-scar" />}
    </g>
  );
}

const shapes: Record<ShipId, JSX.Element> = {
  galactica: (
    <g>
      <path d="M41 4 L59 4 L63 14 L61 27 L39 27 L37 14 Z" />
      <rect x={44} y={26} width={12} height={52} />
      <path d="M29 33 L39 30 L39 68 L29 66 Z" />
      <path d="M71 33 L61 30 L61 68 L71 66 Z" />
      <rect x={38} y={40} width={7} height={5} />
      <rect x={55} y={40} width={7} height={5} />
      <rect x={38} y={56} width={7} height={5} />
      <rect x={55} y={56} width={7} height={5} />
      <path d="M37 74 L63 74 L65 92 L35 92 Z" />
      <circle cx={42} cy={94} r={3} />
      <circle cx={50} cy={94} r={3} />
      <circle cx={58} cy={94} r={3} />
    </g>
  ),
  pegasus: (
    <g>
      <path d="M45 3 L55 3 L60 22 L40 22 Z" />
      <rect x={45} y={21} width={10} height={60} />
      <path d="M27 24 L33 18 L39 24 L39 74 L27 74 Z" />
      <path d="M73 24 L67 18 L61 24 L61 74 L73 74 Z" />
      <rect x={38} y={34} width={8} height={4} />
      <rect x={54} y={34} width={8} height={4} />
      <rect x={38} y={60} width={8} height={4} />
      <rect x={54} y={60} width={8} height={4} />
      <path d="M38 78 L62 78 L64 94 L36 94 Z" />
    </g>
  ),
  basestar: <Basestar />,
  raider: <Raider />,
  scar: <Raider scar />,
  heavy: (
    <g>
      <path d="M40 16 L60 16 L68 66 L50 84 L32 66 Z" />
      <path d="M36 40 L12 58 L16 74 L34 64 Z" />
      <path d="M64 40 L88 58 L84 74 L66 64 Z" />
      <rect x={43} y={22} width={14} height={3} rx={1.5} className="ship-eye" />
    </g>
  ),
  centurion: (
    <g>
      <path d="M40 8 Q50 2 60 8 L61 26 Q50 30 39 26 Z" />
      <rect x={42} y={15} width={16} height={3} rx={1.5} className="ship-eye" />
      <path d="M22 32 L78 32 L72 56 L62 60 L60 92 L52 92 L50 64 L48 92 L40 92 L38 60 L28 56 Z" />
      <path d="M22 32 L12 62 L18 64 L28 40 Z" />
      <path d="M78 32 L88 62 L82 64 L72 40 Z" />
    </g>
  ),
  viper: (
    <g>
      <path d="M50 4 L54 28 L55 70 L58 86 L42 86 L45 70 L46 28 Z" />
      <path d="M46 50 L16 76 L17 84 L46 72 Z" />
      <path d="M54 50 L84 76 L83 84 L54 72 Z" />
      <circle cx={44} cy={90} r={3} />
      <circle cx={50} cy={91} r={3} />
      <circle cx={56} cy={90} r={3} />
    </g>
  ),
  viper7: (
    <g>
      <path d="M50 2 L53 22 L55 74 L57 88 L43 88 L45 74 L47 22 Z" />
      <path d="M46 46 L20 58 L14 82 L46 70 Z" />
      <path d="M54 46 L80 58 L86 82 L54 70 Z" />
      <path d="M45 74 L36 92 L44 90 Z" />
      <path d="M55 74 L64 92 L56 90 Z" />
    </g>
  ),
  assault: (
    <g>
      <rect x={37} y={10} width={26} height={74} rx={10} />
      <rect x={23} y={46} width={12} height={38} rx={3} />
      <rect x={65} y={46} width={12} height={38} rx={3} />
      <rect x={30} y={24} width={5} height={24} />
      <rect x={65} y={24} width={5} height={24} />
      <rect x={45} y={16} width={10} height={6} rx={2} className="ship-detail" />
    </g>
  ),
  raptor: (
    <g>
      <rect x={37} y={12} width={26} height={72} rx={11} />
      <rect x={25} y={50} width={11} height={32} rx={3} />
      <rect x={64} y={50} width={11} height={32} rx={3} />
      <rect x={45} y={18} width={10} height={6} rx={2} className="ship-detail" />
    </g>
  ),
  civilian: (
    <g>
      <rect x={38} y={8} width={24} height={78} rx={12} />
      <rect x={30} y={30} width={40} height={8} rx={3} />
      <rect x={30} y={56} width={40} height={8} rx={3} />
      <path d="M38 78 L28 94 L44 86 Z" />
      <path d="M62 78 L72 94 L56 86 Z" />
    </g>
  ),
  nuke: (
    <g>
      <path d="M50 6 Q62 18 62 36 L62 74 L38 74 L38 36 Q38 18 50 6 Z" />
      <path d="M38 62 L26 86 L38 80 Z" />
      <path d="M62 62 L74 86 L62 80 Z" />
      <circle cx={50} cy={46} r={7} className="ship-detail" />
    </g>
  ),
  occupation: (
    <g>
      <path d="M40 8 Q50 2 60 8 L61 26 Q50 30 39 26 Z" />
      <rect x={42} y={15} width={16} height={3} rx={1.5} className="ship-eye" />
      <path d="M22 32 L78 32 L72 56 L62 60 L60 92 L52 92 L50 64 L48 92 L40 92 L38 60 L28 56 Z" />
      <rect x={10} y={80} width={80} height={6} rx={3} opacity={0.5} />
    </g>
  ),
  human: (
    <g>
      <circle cx={50} cy={20} r={12} />
      <path d="M26 92 L30 46 Q32 36 42 36 L58 36 Q68 36 70 46 L74 92 Z" />
    </g>
  ),
};

export const CYLON_SHIPS: ShipId[] = ["basestar", "raider", "scar", "heavy", "centurion", "occupation"];

export function ShipIcon({ ship, size = 64, title }: { ship: ShipId; size?: number; title?: string }) {
  const faction = CYLON_SHIPS.includes(ship) ? "cylon" : "colonial";
  return (
    <svg
      className={`ship-icon ${faction}`}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={title ?? ship}
      fill="currentColor"
    >
      {title && <title>{title}</title>}
      {shapes[ship]}
    </svg>
  );
}
