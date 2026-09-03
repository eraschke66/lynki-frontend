import { Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { PlantIndicator } from "@/components/garden/PlantIndicator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getGardenStatus } from "@/lib/garden";
import type { CourseSummary } from "../../types";

/* ── Course Card — oasis arched parchment frame ── */
export function CourseCard({ course, isRecommended, onClick, onEdit, onDelete }: {
  course: CourseSummary;
  isRecommended: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isProcessing = course.hasProcessing;
  const isClickable = course.totalConcepts > 0;
  // Both the status label and the plant tier are keyed off pass probability
  // (not progressPercent/mastery) so they always agree with the number shown
  // next to them and with the Settings-page legend that defines these tiers
  // as pass-probability ranges. progressPercent (mastery) still drives the
  // vine bar below — a separate "material covered" signal, not paired with
  // this label.
  const status = getGardenStatus(course.passProbability);

  return (
    <ParchmentCard
      hover={isClickable}
      className={`relative p-6 flex flex-col gap-3 group overflow-hidden ${isClickable ? "" : "pointer-events-none"} ${isRecommended ? "ring-2 ring-ghibli-moss/40" : ""}`}
    >
      {/* Header: title + status pill + 3-dot */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <h3 className="font-serif text-xl font-semibold text-ghibli-canopy leading-snug line-clamp-2 flex-1">
          {course.title}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          {course.totalConcepts > 0 ? (
            <>
              <span className={`text-[10px] font-sans font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-ghibli-mist/70 ${status.color}`}>
                {status.label} · {course.passProbability}%
              </span>
              {isProcessing && (
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-ghibli-mist/70 text-ghibli-forest"
                  title={`New material processing (${course.processingDocumentCount} of ${course.documentCount})`}
                >
                  <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                </span>
              )}
            </>
          ) : isProcessing ? (
            <span className="text-[10px] font-sans font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-ghibli-mist/70 text-primary">
              Processing…
            </span>
          ) : null}
          <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center justify-center w-7 h-7 rounded-full text-ghibli-forest hover:text-ghibli-canopy hover:bg-ghibli-ivory/60 transition-colors shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Centerpiece: large plant illustration */}
      <div className="flex justify-center py-4 relative z-10">
        {isProcessing && course.totalConcepts === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 text-center" style={{ width: 140, height: 140 }}>
            <Loader2 className="w-10 h-10 animate-spin text-ghibli-forest" />
            <span className="text-xs text-ghibli-bark px-2 leading-snug">
              {course.documentCount > 0
                ? `Reading ${course.processingDocumentCount} of ${course.documentCount} ${course.documentCount === 1 ? "material" : "materials"}`
                : "Reading your materials"}
              <br />
              <span className="italic">usually 1–2 min</span>
            </span>
          </div>
        ) : (
          <div className="relative">
            {/* Soft glow halo behind plant */}
            <div className="absolute inset-0 rounded-full bg-ghibli-sunlight/30 blur-2xl scale-110 -z-10" />
            <PlantIndicator probability={course.passProbability} size="lg" showPercent={false} />
          </div>
        )}
      </div>

      {/* Progress vine */}
      <div className="flex flex-col gap-2 relative z-10">
        <svg viewBox="0 0 100 8" className="w-full h-2.5 overflow-visible" preserveAspectRatio="none" aria-hidden>
          <path
            d="M0 4 Q 25 0, 50 4 T 100 4"
            fill="none"
            stroke="hsl(var(--ghibli-mist))"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M0 4 Q 25 0, 50 4 T 100 4"
            fill="none"
            stroke="hsl(var(--ghibli-forest))"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="100"
            strokeDashoffset={100 - course.progressPercent}
            style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
          />
        </svg>
        <span className="font-sans text-xs text-ghibli-bark italic text-center">
          {isProcessing && course.totalConcepts > 0
            ? `Reading new material — ${course.processingDocumentCount} of ${course.documentCount} ${course.documentCount === 1 ? "document" : "documents"} processing`
            : "Tend regularly to keep it thriving"}
        </span>
      </div>

      {/* Walk the Path CTA */}
      <Button
        onClick={onClick}
        disabled={!isClickable}
        className="w-full rounded-full font-sans text-sm font-semibold tracking-wide bg-linear-to-b from-ghibli-jungle to-ghibli-canopy hover:from-ghibli-forest hover:to-ghibli-canopy text-primary-foreground shadow-md hover:shadow-lg transition-all disabled:opacity-60 relative z-10"
      >
        Walk the Path →
      </Button>
    </ParchmentCard>
  );
}
