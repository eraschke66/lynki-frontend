import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";
import { SkipStageLink } from "./SkipStageLink";
import type { ConnectionPair } from "../types";

interface ConnectionsStageProps {
  pairs: ConnectionPair[];
  onComplete: () => void;
  onSkip: () => void;
}

// V1 stub — drag-drop / tap-match lands on Day 4.
export function ConnectionsStage({ pairs, onComplete, onSkip }: ConnectionsStageProps) {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <ParchmentCard className="p-8 md:p-10">
        <h2 className="font-serif text-2xl text-ghibli-canopy mb-4">Concept Connections</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <ul className="space-y-2">
            {pairs.map((p) => (
              <li key={`L-${p.id}`} className="text-sm text-ghibli-canopy">
                {p.left}
              </li>
            ))}
          </ul>
          <ul className="space-y-2">
            {pairs.map((p) => (
              <li key={`R-${p.id}`} className="text-sm text-ghibli-canopy">
                {p.right}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-gray-500 italic">[F7 — drag-drop / tap-match lands on Day 4]</p>
        <div className="mt-6 flex justify-end">
          <Button onClick={onComplete}>Continue</Button>
        </div>
      </ParchmentCard>
      <SkipStageLink onSkip={onSkip} />
    </div>
  );
}
