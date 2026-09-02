import { Check, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { SkipStageLink } from "../SkipStageLink";
import type { RecallEvaluation } from "../../types";

interface RecallEvaluationScreenProps {
  response: string;
  evaluation: RecallEvaluation;
  sourceParagraphFallback: string;
  onContinue: () => void;
  onSkip: () => void;
}

export function RecallEvaluationScreen({
  response,
  evaluation,
  sourceParagraphFallback,
  onContinue,
  onSkip,
}: RecallEvaluationScreenProps) {
  const sourceParagraph = evaluation.source_paragraph || sourceParagraphFallback;

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ParchmentCard className="p-5" hover={false}>
          <p className="text-xs uppercase tracking-wider text-ghibli-forest font-medium mb-3">You wrote</p>
          <p className="text-sm font-sans text-ghibli-canopy whitespace-pre-wrap leading-relaxed">{response}</p>
        </ParchmentCard>

        <ParchmentCard className="p-5" hover={false}>
          <p className="text-xs uppercase tracking-wider text-ghibli-forest font-medium mb-3">You got</p>
          <ul className="space-y-2">
            {evaluation.got_right.length === 0 ? (
              <li className="text-sm text-ghibli-forest italic">Nothing matched yet.</li>
            ) : (
              evaluation.got_right.map((item, i) => (
                <li key={i} className="text-sm text-ghibli-canopy flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-emerald-700 shrink-0" />
                  <span>{item}</span>
                </li>
              ))
            )}
          </ul>
        </ParchmentCard>

        <ParchmentCard className="p-5" hover={false}>
          <p className="text-xs uppercase tracking-wider text-ghibli-forest font-medium mb-3">You missed</p>
          <ul className="space-y-2">
            {evaluation.missed.length === 0 ? (
              <li className="text-sm text-ghibli-forest italic">Nothing was missed — nice.</li>
            ) : (
              evaluation.missed.map((item, i) => (
                <li key={i} className="text-sm text-ghibli-canopy flex items-start gap-2">
                  <XIcon className="w-4 h-4 mt-0.5 text-amber-700 shrink-0" />
                  <span>{item}</span>
                </li>
              ))
            )}
          </ul>
        </ParchmentCard>
      </div>

      <ParchmentCard className="p-6 mt-4" hover={false}>
        <p className="text-xs uppercase tracking-wider text-ghibli-forest font-medium mb-3">The full picture</p>
        <p className="font-serif text-ghibli-canopy leading-relaxed text-sm md:text-base">{sourceParagraph}</p>
      </ParchmentCard>

      <div className="flex justify-end mt-6">
        <Button onClick={onContinue}>Continue</Button>
      </div>
      <SkipStageLink onSkip={onSkip} />
    </div>
  );
}
