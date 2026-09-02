import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { PlantIndicator } from "@/components/garden/PlantIndicator";
import { PreviewBadge } from "../shared/PreviewBadge";

export function BigGardenPreview() {
  const topics = [
    { name: "Cellular Respiration", status: "Needs Water", color: "var(--color-marketing-status-water)", bg: "rgb(from var(--color-marketing-status-water) r g b / 0.12)", pct: 38 },
    { name: "Photosynthesis", status: "Growing", color: "var(--color-marketing-status-growing)", bg: "rgb(from var(--color-marketing-status-growing) r g b / 0.12)", pct: 64 },
    { name: "Cell Division", status: "Blooming", color: "var(--color-marketing-status-blooming)", bg: "rgb(from var(--color-marketing-status-blooming) r g b / 0.14)", pct: 78 },
    { name: "Genetics & Heredity", status: "Sprouting", color: "var(--color-marketing-status-sprouting)", bg: "rgb(from var(--color-marketing-status-sprouting) r g b / 0.14)", pct: 48 },
    { name: "Evolution", status: "Thriving", color: "var(--color-marketing-status-thriving)", bg: "rgb(from var(--color-marketing-status-thriving) r g b / 0.14)", pct: 92 },
  ];
  return (
    <ParchmentCard className="p-7 md:p-8" glow>
      <div className="flex items-center justify-end mb-4">
        <PreviewBadge />
      </div>
      <div className="grid md:grid-cols-[auto_1fr] gap-7 items-center mb-6">
        <PlantIndicator probability={64} size="xl" glow showPercent />
        <div>
          <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-forest mb-1.5">
            Biology · Year 12 · Example
          </p>
          <h3 className="font-serif text-2xl md:text-3xl font-semibold text-ghibli-canopy leading-tight mb-1.5">
            14 of 22 concepts mastered.
          </h3>
          <p className="font-sans text-sm text-ghibli-bark">
            A grove of <span className="font-semibold text-ghibli-forest">5 topics</span> is taking root.
          </p>
        </div>
      </div>
      <div>
        <div className="space-y-2.5">
          {topics.map((t) => (
            <div
              key={t.name}
              className="flex items-center gap-3 rounded-2xl bg-white/55 border border-ghibli-moss/15 px-3.5 py-3"
            >
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
      </div>
    </ParchmentCard>
  );
}
