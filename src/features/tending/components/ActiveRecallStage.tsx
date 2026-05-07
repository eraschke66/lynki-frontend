import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";
import { SkipStageLink } from "./SkipStageLink";

interface ActiveRecallStageProps {
  prompt: string;
  onComplete: () => void;
  onSkip: () => void;
}

// V1 stub — full F5 implementation lands on Day 3.
export function ActiveRecallStage({ prompt, onComplete, onSkip }: ActiveRecallStageProps) {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <ParchmentCard className="p-8 md:p-10">
        <h2 className="font-serif text-2xl text-ghibli-canopy mb-4">Active Recall</h2>
        <p className="font-serif text-ghibli-canopy/80 mb-6">{prompt}</p>
        <p className="text-sm text-gray-500 italic">[F5 — full active recall lands on Day 3]</p>
        <div className="mt-6 flex justify-end">
          <Button onClick={onComplete}>Continue</Button>
        </div>
      </ParchmentCard>
      <SkipStageLink onSkip={onSkip} />
    </div>
  );
}
