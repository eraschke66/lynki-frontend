import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";
import { SkipStageLink } from "./SkipStageLink";
import type { MnemonicCard } from "../types";

interface MnemonicStageProps {
  mnemonics: MnemonicCard[];
  onComplete: () => void;
  onSkip: () => void;
}

// V1 stub — full F6 lands on Day 4.
export function MnemonicStage({ mnemonics, onComplete, onSkip }: MnemonicStageProps) {
  return (
    <div className="max-w-xl mx-auto w-full">
      <ParchmentCard className="p-8 md:p-10">
        <h2 className="font-serif text-2xl text-ghibli-canopy mb-4">Mnemonics</h2>
        <ul className="space-y-3 mb-6">
          {mnemonics.map((m) => (
            <li key={m.id} className="font-serif text-lg text-ghibli-canopy">
              {m.hook}
            </li>
          ))}
        </ul>
        <p className="text-sm text-gray-500 italic">[F6 — Lock-it-in cards land on Day 4]</p>
        <div className="mt-6 flex justify-end">
          <Button onClick={onComplete}>Continue</Button>
        </div>
      </ParchmentCard>
      <SkipStageLink onSkip={onSkip} />
    </div>
  );
}
