import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { PlantIndicator } from "@/components/garden/PlantIndicator";
import { PreviewBadge } from "../shared/PreviewBadge";

export function GardenPreview() {
  const topics = [
    { name: "Cellular Respiration", status: "Needs Water", color: "var(--color-marketing-status-water)", bg: "rgb(from var(--color-marketing-status-water) r g b / 0.12)", pct: 38, plant: 28 },
    { name: "Photosynthesis", status: "Growing", color: "var(--color-marketing-status-growing)", bg: "rgb(from var(--color-marketing-status-growing) r g b / 0.12)", pct: 64, plant: 64 },
    { name: "Cell Division", status: "Blooming", color: "var(--color-marketing-status-blooming)", bg: "rgb(from var(--color-marketing-status-blooming) r g b / 0.14)", pct: 78, plant: 78 },
    { name: "Genetics & Heredity", status: "Sprouting", color: "var(--color-marketing-status-sprouting)", bg: "rgb(from var(--color-marketing-status-sprouting) r g b / 0.14)", pct: 48, plant: 48 },
  ];
  return (
    <ParchmentCard className="p-6 md:p-7" hover={false}>
      <div className="flex items-center justify-between mb-5">
        <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-forest font-semibold">
          Knowledge Garden · Biology
        </span>
        <PreviewBadge />
      </div>
      <div className="space-y-3">
        {topics.map((t) => (
          <div
            key={t.name}
            className="flex items-center gap-3 rounded-2xl bg-white/55 border border-ghibli-moss/15 px-3.5 py-3"
          >
            <PlantIndicator probability={t.plant} size="sm" showPercent={false} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="font-serif text-sm font-semibold text-ghibli-canopy truncate">
                  {t.name}
                </p>
                <span
                  className="font-sans text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: t.bg, color: t.color }}
                >
                  {t.status}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-ghibli-mist overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${t.pct}%`, background: t.color }}
                />
              </div>
            </div>
            <span className="font-sans text-xs font-semibold text-ghibli-canopy tabular-nums shrink-0">
              {t.pct}%
            </span>
          </div>
        ))}
      </div>
    </ParchmentCard>
  );
}
