export function BondingCurveChart({ progressBps }: { progressBps: number }) {
  const progressX = Math.max(12, Math.min(288, (progressBps / 10_000) * 300));
  const progressY = 220 - ((progressX - 12) * (progressX - 12)) / 380;

  return (
    <svg viewBox="0 0 320 240" className="chart" role="img" aria-label="Bonding curve">
      <path
        d="M12 220 C 70 190, 120 120, 170 78 C 220 42, 260 32, 308 28"
        fill="none"
        stroke="#111111"
        strokeWidth="3"
      />
      <line x1="12" y1="220" x2="308" y2="220" stroke="rgba(17,17,17,0.18)" strokeWidth="1" />
      <line x1="12" y1="220" x2="12" y2="18" stroke="rgba(17,17,17,0.18)" strokeWidth="1" />
      <circle cx={progressX} cy={progressY} r="7" fill="#ff6b35" />
    </svg>
  );
}

