interface PassProbabilitySummaryProps {
  passProbability?: { before: number; after: number } | null;
}

/** Pass-probability before/after this session, rendered only when both values are known. */
export function PassProbabilitySummary({ passProbability }: PassProbabilitySummaryProps) {
  if (!passProbability) return null;

  const before = Math.round(passProbability.before * 100);
  const after = Math.round(passProbability.after * 100);
  const diff = after - before;

  const verdictColor = diff > 0 ? "text-ghibli-canopy" : diff < 0 ? "text-amber-700" : "text-ghibli-bark";
  const deltaLabel = diff > 0 ? `+${diff} points` : diff < 0 ? `${diff} points` : "0 points";

  return (
    <div className={`mt-3 w-full max-w-md flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm ${verdictColor}`}>
      <span>
        Your pass probability moved from <span className="tabular-nums font-semibold">{before}%</span> to{" "}
        <span className="tabular-nums font-semibold">{after}%</span>.
      </span>
      <span className="tabular-nums font-semibold">{deltaLabel}</span>
    </div>
  );
}
