import { useState } from "react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";
import { SkipStageLink } from "./SkipStageLink";
import type { MnemonicCard, MnemonicResult } from "../types";

interface MnemonicStageProps {
  mnemonics: MnemonicCard[];
  onComplete: (results: MnemonicResult[]) => void;
  onSkip: () => void;
}

export function MnemonicStage({ mnemonics, onComplete, onSkip }: MnemonicStageProps) {
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<MnemonicResult[]>([]);

  if (mnemonics.length === 0) {
    return (
      <div className="max-w-xl mx-auto w-full">
        <ParchmentCard className="p-8 text-center">
          <p className="font-serif text-ghibli-canopy mb-6">
            No mnemonics for this topic. Skip ahead?
          </p>
          <Button onClick={onSkip} variant="outline">
            Continue
          </Button>
        </ParchmentCard>
      </div>
    );
  }

  const card = mnemonics[idx];
  const isLast = idx === mnemonics.length - 1;

  const lockIn = () => {
    const next = [...results, { id: card.id, lockedIn: true }];
    if (isLast) {
      onComplete(next);
      return;
    }
    setResults(next);
    setIdx(idx + 1);
  };

  return (
    <div className="max-w-xl mx-auto w-full">
      <div className="text-center mb-6">
        <p className="text-xs uppercase tracking-wider text-ghibli-forest font-medium">
          Memory hook {idx + 1} of {mnemonics.length}
        </p>
      </div>

      <ParchmentCard className="p-8 md:p-10 text-center" hover={false}>
        <h2 className="font-serif text-2xl md:text-3xl text-ghibli-canopy leading-snug mb-5">
          {card.hook}
        </h2>
        <p className="font-sans text-ghibli-canopy text-sm md:text-base leading-relaxed">
          {card.explanation}
        </p>
      </ParchmentCard>

      <div className="flex justify-center mt-6">
        <Button onClick={lockIn} className="min-w-[160px]">
          Lock it in
        </Button>
      </div>

      <SkipStageLink onSkip={onSkip} />
    </div>
  );
}
