import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";
import { SkipStageLink } from "./SkipStageLink";

interface QuizStageProps {
  onComplete: () => void;
  onSkip: () => void;
}

// V1 stub — Day 5: embed the existing topic-scoped quiz component as the
// 5th stage of the flow. For now this just advances on click.
export function QuizStage({ onComplete, onSkip }: QuizStageProps) {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <ParchmentCard className="p-8 md:p-10">
        <h2 className="font-serif text-2xl text-ghibli-canopy mb-4">Adaptive Quiz</h2>
        <p className="text-sm text-gray-500 italic">
          [Day 5 — embed existing topic-scoped quiz here]
        </p>
        <div className="mt-6 flex justify-end">
          <Button onClick={onComplete}>Continue</Button>
        </div>
      </ParchmentCard>
      <SkipStageLink onSkip={onSkip} />
    </div>
  );
}
