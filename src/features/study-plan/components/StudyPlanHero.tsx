import { useQueryClient } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { PlantIndicator } from "@/components/garden/PlantIndicator";

interface StudyPlanHeroProps {
  daysRemaining: number;
  testDate: string;
  passPercent: number | null;
  targetLabel: string;
  courseId: string;
}

export function StudyPlanHero({
  daysRemaining,
  testDate,
  passPercent,
  targetLabel,
  courseId,
}: StudyPlanHeroProps) {
  const queryClient = useQueryClient();

  const formattedDate = new Date(testDate).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <ParchmentCard glow className="p-8 md:p-12 mb-10 overflow-hidden">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="text-center md:text-left order-2 md:order-1">
          <span className="inline-block font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-forest mb-3 px-3 py-1 rounded-full bg-ghibli-mist/60">
            <Calendar className="inline w-3 h-3 mr-1 -mt-0.5" />
            Until Your Exam
          </span>
          <h2 className="font-serif text-6xl md:text-7xl font-semibold text-ghibli-canopy leading-none mb-3">
            {daysRemaining}
          </h2>
          <p className="font-sans text-lg text-ghibli-canopy mb-2">
            {daysRemaining === 1 ? "day" : "days"} of growing time
          </p>
          <p className="font-sans text-sm text-ghibli-bark italic mb-4">
            {formattedDate}
          </p>
          <button
            onClick={() => {
              queryClient.setQueryData(
                ["courses", "detail", courseId],
                (old: { test_date: string | null } | undefined) =>
                  old ? { ...old, test_date: null } : old,
              );
            }}
            className="font-sans text-xs text-ghibli-forest hover:text-ghibli-canopy underline underline-offset-2 transition-colors"
          >
            Change date
          </button>
        </div>
        <div className="order-1 md:order-2 flex flex-col items-center gap-2">
          {passPercent !== null ? (
            <>
              <PlantIndicator probability={passPercent} size="xl" glow showPercent />
              <p className="font-sans text-xs text-ghibli-bark italic">
                growing toward {targetLabel}
              </p>
            </>
          ) : (
            <>
              <PlantIndicator probability={0} size="xl" showPercent={false} />
              <p className="font-sans text-xs text-ghibli-bark italic max-w-[14rem] text-center leading-relaxed">
                Take your first quiz to see your pass chance
              </p>
            </>
          )}
        </div>
      </div>
    </ParchmentCard>
  );
}
