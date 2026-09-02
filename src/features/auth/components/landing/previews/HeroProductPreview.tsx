import { CalendarDays, Droplets, FileText } from "lucide-react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { PlantIndicator } from "@/components/garden/PlantIndicator";
import { PreviewBadge } from "../shared/PreviewBadge";

export function HeroProductPreview() {
  return (
    <ParchmentCard className="relative p-6 md:p-7" glow>
      {/* Window chrome */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-ghibli-coral/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-ghibli-gold/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-ghibli-moss/70" />
        </div>
        <div className="flex items-center gap-2">
          <PreviewBadge />
          <span className="hidden sm:inline font-sans text-[10px] uppercase tracking-[0.22em] text-ghibli-forest">
            Biology Final
          </span>
        </div>
      </div>
      <p className="font-sans text-[11px] text-ghibli-bark italic text-center mb-4">
        Example dashboard. Your numbers will come from your own materials and quizzes.
      </p>

      {/* Hero garden mini-card */}
      <div className="rounded-2xl bg-white/55 border border-ghibli-moss/15 p-5 md:p-6 mb-4">
        <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ghibli-forest mb-1.5">
              Growing toward Grade 6
            </p>
            <p className="font-serif text-2xl md:text-3xl font-semibold text-ghibli-canopy leading-tight mb-2">
              72% pass probability
            </p>
            <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "var(--color-ghibli-parchment)" }}>
              <div className="h-full rounded-full" style={{ width: "72%", background: "var(--color-ghibli-canopy-mid)" }} />
              <div
                className="absolute"
                style={{ left: "85%", width: "2px", top: "-3px", bottom: "-3px", background: "var(--color-ghibli-canopy-dark)" }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-ghibli-forest font-sans">
              <span>Needs water</span>
              <span className="mr-[13%]">Target</span>
            </div>
          </div>
          <PlantIndicator probability={72} size="lg" showPercent={false} />
        </div>
      </div>

      {/* Exam countdown row */}
      <div className="flex items-center gap-3 rounded-xl bg-white/60 border border-ghibli-moss/15 px-3.5 py-2.5 mb-2.5">
        <CalendarDays className="w-4 h-4 text-ghibli-canopy shrink-0" />
        <span className="font-sans text-sm text-ghibli-canopy flex-1">12 days until your exam</span>
        <span className="font-sans text-[10px] uppercase tracking-widest text-ghibli-forest">Study Plan</span>
      </div>

      {/* Material row */}
      <div className="flex items-center gap-3 rounded-xl bg-white/60 border border-ghibli-moss/15 px-3.5 py-2.5 mb-2.5">
        <FileText className="w-4 h-4 text-ghibli-canopy shrink-0" />
        <span className="font-sans text-sm text-ghibli-canopy truncate flex-1">The Phoenix.pdf</span>
        <span className="font-sans text-[10px] uppercase tracking-widest text-ghibli-forest">Indexed</span>
      </div>

      {/* Weak concept card */}
      <div className="rounded-xl bg-white/60 border border-ghibli-moss/15 px-3.5 py-3 flex items-center gap-3">
        <span
          className="inline-flex items-center justify-center w-9 h-9 rounded-full shrink-0"
          style={{ background: "rgb(from var(--color-marketing-status-water) r g b / 0.15)" }}
        >
          <Droplets className="w-4 h-4" style={{ color: "var(--color-marketing-status-water)" }} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-sm font-semibold text-ghibli-canopy truncate">
            Cellular Respiration
          </p>
          <p className="font-sans text-[11px] text-ghibli-bark">
            Weak concept · 38% mastery
          </p>
        </div>
        <span
          className="font-sans text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-full"
          style={{ background: "rgb(from var(--color-marketing-status-water) r g b / 0.12)", color: "var(--color-marketing-status-water)" }}
        >
          Needs Water
        </span>
      </div>
    </ParchmentCard>
  );
}
