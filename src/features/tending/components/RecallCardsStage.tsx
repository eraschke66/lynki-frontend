import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { CardPlant, MAX_PLANT_TIER } from "./CardPlant";
import { SkipStageLink } from "./SkipStageLink";
import type { RecallCard, RecallResult } from "../types";

interface RecallCardsStageProps {
  cards: RecallCard[];
  onComplete: (results: RecallResult[]) => void;
  onSkip: () => void;
}

export function RecallCardsStage({ cards, onComplete, onSkip }: RecallCardsStageProps) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<RecallResult[]>([]);
  // Plant tier grows with card progress. "Got it" = +1 tier.
  // "Show me again" partial growth treatment is intentionally not picked yet —
  // currently no-op for the plant. Erik to choose a treatment before V1.
  const [plantTier, setPlantTier] = useState(0);

  // Empty / error fallback
  if (cards.length === 0) {
    return (
      <div className="max-w-xl mx-auto w-full">
        <ParchmentCard className="p-8 text-center">
          <p className="font-serif text-ghibli-canopy mb-6">
            Couldn't load recall cards for this topic. Skip ahead?
          </p>
          <Button onClick={onSkip} variant="outline">
            Continue
          </Button>
        </ParchmentCard>
      </div>
    );
  }

  const card = cards[idx];
  const isLast = idx === cards.length - 1;

  const rate = (rating: RecallResult["rating"]) => {
    const next = [...results, { id: card.id, rating }];
    if (rating === "got_it") {
      setPlantTier((t) => Math.min(MAX_PLANT_TIER, t + 1));
    }
    // "again" rating: plant tier stays put for now — partial-grow visual is
    // open for Erik to pick (half-step pose / desaturated / delayed advance).
    if (isLast) {
      onComplete(next);
      return;
    }
    setResults(next);
    setIdx(idx + 1);
    setFlipped(false);
  };

  return (
    <div className="max-w-xl mx-auto w-full flex flex-col">
      <div className="text-center mb-6">
        <p className="text-xs uppercase tracking-wider text-ghibli-moss/80 font-medium">
          Recall card {idx + 1} of {cards.length}
        </p>
      </div>

      <ParchmentCard
        className="p-8 md:p-10 min-h-[280px] flex flex-col items-center justify-center cursor-pointer select-none relative"
        hover={false}
      >
        <button
          type="button"
          onClick={() => setFlipped(true)}
          disabled={flipped}
          className="w-full text-center disabled:cursor-default"
        >
          {!flipped ? (
            <>
              <h2 className="font-serif text-2xl md:text-3xl text-ghibli-canopy leading-snug mb-6">
                {card.front}
              </h2>
              <p className="text-xs text-ghibli-moss/70 italic">Tap to reveal answer</p>
            </>
          ) : (
            <>
              <p className="text-sm uppercase tracking-wider text-ghibli-moss/70 font-medium mb-3">
                Answer
              </p>
              <p className="font-serif text-lg md:text-xl text-ghibli-canopy leading-relaxed">
                {card.back}
              </p>
            </>
          )}
        </button>

        {/* Lower-right corner growth indicator. The only decoration on this card. */}
        <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4">
          <CardPlant tier={plantTier} />
        </div>
      </ParchmentCard>

      {flipped && (
        <div className="flex gap-3 justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => rate("again")}
            className="min-w-[140px]"
          >
            Show me again
          </Button>
          <Button onClick={() => rate("got_it")} className="min-w-[140px]">
            Got it
          </Button>
        </div>
      )}

      <SkipStageLink onSkip={onSkip} />
    </div>
  );
}
