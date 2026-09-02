import { RotateCcw, X } from "lucide-react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";
import { CenteredCard } from "./CenteredCard";

export function TopicQuizResultsScreen({
  embedded,
  topicName,
  correctCount,
  totalQuestions,
  onStudyAgain,
  onExit,
}: {
  embedded: boolean;
  topicName: string | undefined;
  correctCount: number;
  totalQuestions: number;
  onStudyAgain: () => void;
  onExit?: () => void;
}) {
  const scorePercent =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  return (
    <CenteredCard embedded={embedded}>
      <ParchmentCard className="p-6 md:p-10 text-center flex flex-col items-center gap-6 w-full max-w-lg">
        <p className="text-xs font-semibold text-ghibli-forest uppercase tracking-wider">
          Topic Study Complete
        </p>
        <div className="space-y-1">
          <p className="font-serif text-2xl font-bold">{scorePercent}%</p>
          <p className="font-serif text-base font-semibold">
            {correctCount} of {totalQuestions} seeds took root
          </p>
          <p className="text-xs text-ghibli-bark italic">{topicName}</p>
        </div>
        <p className="text-sm font-sans text-ghibli-bark">
          {scorePercent >= 80
            ? "Wonderful! This topic is blossoming beautifully."
            : scorePercent >= 60
            ? "Good growth! Keep tending to this patch."
            : scorePercent >= 40
            ? "The soil is getting richer. Keep watering."
            : "Every garden starts from a single seed. Try again!"}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full">
          <Button
            size="lg"
            className="flex-1 gap-2 rounded-parchment"
            onClick={onStudyAgain}
          >
            <RotateCcw className="w-4 h-4" />
            Fresh Quiz
          </Button>
          {onExit && (
            <Button
              size="lg"
              variant="outline"
              className="flex-1 gap-2 rounded-parchment border-ghibli-moss/30 hover:border-ghibli-forest hover:text-ghibli-forest"
              onClick={onExit}
            >
              <X className="w-4 h-4" />
              Return
            </Button>
          )}
        </div>
      </ParchmentCard>
    </CenteredCard>
  );
}
