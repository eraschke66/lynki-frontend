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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ParchmentCard className="p-6 flex flex-col items-center text-center gap-2">
        <Calendar className="w-6 h-6 text-[#40916C]" />
        <p className="text-4xl font-bold text-[#1B4332]">{daysRemaining}</p>
        <p className="text-sm text-muted-foreground">
          {daysRemaining === 1 ? "day" : "days"} until your exam
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(testDate).toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <button
          className="text-xs text-muted-foreground hover:text-[#2D6A4F] mt-1 underline underline-offset-2"
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

      <ParchmentCard className="p-6 flex flex-col items-center text-center gap-2">
        <Target className="w-6 h-6 text-[#40916C]" />
        {passPercent !== null ? (
          <>
            <PlantIndicator probability={passPercent} size="lg" showPercent={true} />
            <p className="text-xs text-muted-foreground mt-1">
              growing toward {targetLabel}
            </p>
          </>
        ) : (
          <>
            <PlantIndicator probability={0} size="lg" showPercent={false} />
            <p className="text-xs text-muted-foreground text-center max-w-35">
              Take your first quiz to see your pass chance
            </p>
          </>
        )}
      </ParchmentCard>
    </div>
  );
}
