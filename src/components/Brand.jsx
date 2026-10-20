// Elemente de identitate desenate după logo: monograma S|C și crenguța botanică.

export function Monogram({ className = "" }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <text x="4" y="29" fontFamily="'Bodoni Moda', serif" fontSize="30" fill="currentColor">
        S
      </text>
      <text x="23" y="44" fontFamily="'Bodoni Moda', serif" fontSize="30" fill="currentColor">
        C
      </text>
      <line x1="20" y1="3" x2="27" y2="46" stroke="currentColor" strokeWidth="1" />
      <circle cx="31" cy="12" r="1.4" fill="var(--color-magenta)" />
      <circle cx="35" cy="15" r="1.1" fill="var(--color-magenta)" />
    </svg>
  );
}

export function Wordmark({ className = "" }) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <Monogram className="h-10 w-10 text-ink" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.35rem] tracking-[0.3em] text-magenta">STECO</span>
        <span className="mt-1 text-[0.6875rem] tracking-[0.08em] text-ink-soft">event planning &amp; management</span>
      </span>
    </span>
  );
}

const LEAVES = [
  { x: 60.5, y: 501, r: -35, d: 0.35 },
  { x: 56, y: 430, r: 215, d: 0.5 },
  { x: 49.5, y: 360, r: -40, d: 0.65 },
  { x: 58, y: 290, r: 210, d: 0.8 },
  { x: 68.5, y: 220, r: -30, d: 0.95 },
  { x: 64, y: 150, r: 220, d: 1.1 },
  { x: 61, y: 90, r: -48, d: 1.25 }
];

const DOTS = [
  { cx: 86, cy: 52, r: 2.4 },
  { cx: 95, cy: 64, r: 1.8 },
  { cx: 80, cy: 70, r: 1.4 },
  { cx: 26, cy: 468, r: 2.4 },
  { cx: 17, cy: 482, r: 1.8 },
  { cx: 31, cy: 490, r: 1.4 }
];

export function Branch({ className = "", animated = true }) {
  return (
    <svg
      viewBox="0 0 120 600"
      className={`${animated ? "branch-draw" : ""} ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.15"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        pathLength="1"
        d="M50 580 C62 520 64 480 56 430 C48 380 46 340 58 290 C70 240 72 200 64 150 C58 110 60 70 70 30"
      />
      {LEAVES.map((leaf) => (
        <g key={`${leaf.x}-${leaf.y}`} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.r}) scale(1.3)`}>
          <path
            pathLength="1"
            style={{ "--d": `${leaf.d}s` }}
            d="M0 0 C8 -10 24 -11 35 -3 C24 6 8 6 0 0 Z"
          />
          <path
            pathLength="1"
            style={{ "--d": `${leaf.d + 0.2}s` }}
            d="M3 -0.5 L30 -3"
          />
        </g>
      ))}
      <g transform="translate(70 30) rotate(14) scale(1.25)">
        <path
          pathLength="1"
          style={{ "--d": "1.4s" }}
          d="M0 0 C-11 -8 -13 -25 -5 -36 C-3 -28 2 -28 4 -36 C13 -25 11 -8 0 0 Z"
        />
        <path
          pathLength="1"
          style={{ "--d": "1.55s" }}
          d="M0 -2 C-4 -14 -3 -26 0 -40 C3 -26 4 -14 0 -2"
        />
      </g>
      {DOTS.map((dot, idx) => (
        <circle
          key={`${dot.cx}-${dot.cy}`}
          cx={dot.cx}
          cy={dot.cy}
          r={dot.r}
          fill="var(--color-magenta)"
          stroke="none"
          style={{ "--d": `${1.6 + idx * 0.06}s` }}
        />
      ))}
    </svg>
  );
}
