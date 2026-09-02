export function PreviewBadge({ className = "" }: { className?: string }) {
  return (
    <span
      aria-label="Example preview — not live data"
      title="Example preview — not live data"
      className={`inline-flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.18em] font-semibold px-2 py-0.5 rounded-full bg-ghibli-bark/10 text-ghibli-bark border border-ghibli-bark/15 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-ghibli-bark/40" />
      Preview
    </span>
  );
}
