import { Sparkles, Upload } from "lucide-react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { PlantIndicator } from "@/components/garden/PlantIndicator";
import { Button } from "@/components/ui/button";
import { getStudyCTA } from "@/lib/garden";
import { getGradeLabel } from "@/lib/curricula";
import type { DashboardData } from "../../types";

/* ── Hero Section — oasis "Tend Your Study Garden" two-column ── */
export function HeroSection({ data, curriculum, onStartStudying, onUpload }: {
  data: DashboardData;
  curriculum: string;
  onStartStudying: () => void;
  onUpload: () => void;
}) {
  const hasStudyable = data.courses.some((c) => c.totalConcepts > 0);
  const nextItem = data.nextStudyItem;

  // No quiz activity yet → hide the bar, nudge toward a first quiz.
  const hasAnyActivity = data.courses.some(
    (c) => c.passChance !== null || c.progressPercent > 0,
  );
  // Target grade for the bar caption: the course furthest from passing.
  const lowestPassCourse = data.courses.length
    ? data.courses.reduce(
        (min, c) => (c.passProbability < min.passProbability ? c : min),
        data.courses[0],
      )
    : null;
  const targetGrade = lowestPassCourse?.targetGrade ?? 0.5;
  const heroCurriculum = lowestPassCourse?.curriculumType ?? curriculum;

  const primaryAction = hasStudyable && nextItem ? onStartStudying : onUpload;
  const ctaLabel = !hasAnyActivity && hasStudyable
    ? "Generate Your First Quiz"
    : hasStudyable && nextItem
      ? getStudyCTA(nextItem.reason)
      : "Plant a Seed";

  return (
    <ParchmentCard className="p-5 md:p-12 mb-6 md:mb-10 overflow-hidden" glow>
      <div className="grid md:grid-cols-2 gap-4 md:gap-8 items-center">
        <div className="text-center md:text-left order-2 md:order-1">
          <span className="inline-block font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-forest mb-3 px-3 py-1 rounded-full bg-ghibli-mist/60">
            Your Sanctuary
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-ghibli-canopy leading-tight mb-4">
            Tend Your<br />Study Garden
          </h2>
          {hasAnyActivity ? (
            <div className="max-w-[360px] mx-auto md:mx-0 mb-6">
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-ghibli-bark">
                  Growing toward {getGradeLabel(heroCurriculum, targetGrade)}
                </span>
                <span className="text-sm font-medium text-ghibli-canopy">
                  {data.overallPassProbability}% pass probability
                </span>
              </div>
              <div className="relative h-2.5 rounded-full overflow-hidden bg-ghibli-parchment">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-ghibli-canopy-mid"
                  style={{ width: `${data.overallPassProbability}%` }}
                />
                <div
                  className="absolute bg-ghibli-canopy-dark"
                  style={{ left: "85%", width: "2px", top: "-3px", bottom: "-3px" }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-ghibli-forest">
                <span>Needs water</span>
                <span className="mr-[13%]">Thriving</span>
              </div>
            </div>
          ) : (
            <p className="font-sans text-base text-ghibli-bark leading-relaxed mb-4 md:mb-6 max-w-md mx-auto md:mx-0">
              Take your first quiz to see your pass probability.
            </p>
          )}
          <Button
            size="lg"
            onClick={primaryAction}
            className="gap-2 rounded-full px-8 py-6 text-base font-semibold bg-linear-to-b from-ghibli-jungle to-ghibli-canopy hover:from-ghibli-forest hover:to-ghibli-canopy shadow-lg hover:shadow-glow transition-all"
          >
            {hasStudyable && nextItem ? (
              <Sparkles className="w-4 h-4" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {ctaLabel}
          </Button>
        </div>
        <div className="order-1 md:order-2 flex justify-center">
          <PlantIndicator probability={data.overallProgress} size="xl" glow showPercent />
        </div>
      </div>
    </ParchmentCard>
  );
}
