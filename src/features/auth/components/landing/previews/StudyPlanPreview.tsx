import { ArrowRight, CalendarDays, Droplets, Target } from "lucide-react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { PreviewBadge } from "../shared/PreviewBadge";

export function StudyPlanPreview() {
  return (
    <ParchmentCard className="p-6 md:p-7" hover={false}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-forest font-semibold">
          Study Plan · Biology
        </span>
        <PreviewBadge />
      </div>
      <div className="flex items-center gap-1.5 font-sans text-[11px] text-ghibli-bark mb-4">
        <CalendarDays className="w-3.5 h-3.5" />
        Example · Exam in 12 days
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl bg-white/55 border border-ghibli-moss/15 p-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-ghibli-forest mb-1.5">
            Target Grade
          </p>
          <p className="font-serif text-2xl font-semibold text-ghibli-canopy leading-none flex items-center gap-2">
            <Target className="w-5 h-5 text-ghibli-forest" /> Grade 6
          </p>
        </div>
        <div className="rounded-2xl bg-white/55 border border-ghibli-moss/15 p-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-ghibli-forest mb-1.5">
            Pass Probability
          </p>
          <p className="font-serif text-2xl font-semibold text-ghibli-canopy leading-none">
            72%
          </p>
        </div>
      </div>

      <p className="font-sans text-[11px] uppercase tracking-[0.18em] text-ghibli-forest mb-2.5">
        Focus next
      </p>
      <div className="space-y-2.5">
        {[
          { name: "Cellular Respiration", reason: "Needs Water · biggest impact", icon: Droplets },
          { name: "Genetics & Heredity", reason: "Sprouting · second priority", icon: ArrowRight },
        ].map((row) => (
          <div
            key={row.name}
            className="flex items-center gap-3 rounded-xl bg-white/55 border border-ghibli-moss/15 px-3.5 py-2.5"
          >
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-ghibli-mist shrink-0">
              <row.icon className="w-4 h-4 text-ghibli-canopy" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-serif text-sm font-semibold text-ghibli-canopy truncate">
                {row.name}
              </p>
              <p className="font-sans text-[11px] text-ghibli-bark">{row.reason}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-ghibli-forest shrink-0" />
          </div>
        ))}
      </div>
    </ParchmentCard>
  );
}
