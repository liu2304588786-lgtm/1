import { formatUsd6 } from "@/lib/format";

export function GraduationBar({
  progressBps,
  ltUsdValue
}: {
  progressBps: number;
  ltUsdValue: string;
}) {
  const progress = Math.min(progressBps / 100, 100);
  return (
    <div>
      <div className="metric-row">
        <span>Graduation progress</span>
        <span>{progress.toFixed(1)}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="tiny" style={{ marginTop: 10 }}>
        LT reserve value: {formatUsd6(ltUsdValue)} / $9,000
      </div>
    </div>
  );
}

