import { Button } from "@/components/ui/button";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { SkipStageLink } from "../SkipStageLink";

interface EmptyTimeoutScreenProps {
  onRetry: () => void;
  onSkip: () => void;
}

export function EmptyTimeoutScreen({ onRetry, onSkip }: EmptyTimeoutScreenProps) {
  return (
    <div className="max-w-xl mx-auto w-full">
      <ParchmentCard className="p-8 md:p-10 text-center" hover={false}>
        <p className="font-serif text-xl md:text-2xl text-ghibli-canopy leading-snug mb-6">
          Do you not remember anything, or are you against brain hyper-scanning?
        </p>
        <Button onClick={onRetry}>Try again</Button>
      </ParchmentCard>
      <SkipStageLink onSkip={onSkip} />
    </div>
  );
}
