import { useQueryClient } from "@tanstack/react-query";
import { Calendar, Target } from "lucide-react";
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <ParchmentCard className="p-6 md:p-8 flex flex-col items-center text-center gap-2">
        <Calendar className="w-6 h-6 text-ghibli-forest" />
        <p className="font-serif text-5xl font-semibold text-ghibli-canopy leading-none">{daysRemaining}</p>
        <p className="text-sm font-sans text-ghibli-bark/80">
          {daysRemaining === 1 ? "day" : "days"} until your exam
        </p>
        <p className="text-xs font-sans text-muted-foreground italic">
          {new Date(testDate).toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <button
          className="text-xs text-ghibli-moss hover:text-ghibli-forest mt-1 underline underline-offset-2"
          onClick={() => {
            queryClient.setQueryData(
              ["courses", "detail", courseId],
              (old: { test_date: string | null } | undefined) =>
                old ? { ...old, test_date: null } : old,
            );
          }}
        >
          Change date
        </button>
      </ParchmentCard>

      <ParchmentCard glow className="p-6 md:p-8 flex flex-col items-center text-center gap-2">
        <Target className="w-6 h-6 text-ghibli-forest" />
        {passPercent !== null ? (
          <>
            <PlantIndicator probability={passPercent} size="lg" glow showPercent={true} />
            <p className="text-xs font-sans text-ghibli-bark/80 mt-1 italic">
              growing toward {targetLabel}
            </p>
          </>
        ) : (
          <>
            <PlantIndicator probability={0} size="lg" showPercent={false} />
            <p className="text-xs font-sans text-muted-foreground text-center max-w-[14rem] italic">
              Take your first quiz to see your pass chance
            </p>
          </>
        )}
      </ParchmentCard>
    </div>
  );
}
