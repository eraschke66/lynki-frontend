export function OrDivider({ label = "or email" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-ghibli-moss/30" />
      <span className="font-sans text-[10px] uppercase tracking-widest text-ghibli-bark">{label}</span>
      <div className="flex-1 h-px bg-ghibli-moss/30" />
    </div>
  );
}
