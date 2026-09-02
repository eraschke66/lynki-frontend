export function GardenStatusChip({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-full bg-white/60 border border-ghibli-moss/15 font-sans text-sm text-ghibli-canopy">
      <span
        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
        style={{ background: dot }}
      />
      {label}
    </div>
  );
}
