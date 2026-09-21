import { Check, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { SkipStageLink } from "../SkipStageLink";
import type { RecallEvaluation } from "../../types";

interface RecallEvaluationScreenProps {
  response: string;
  /**
   * null while the grader is still running. The screen is shown the moment
   * the student submits — with their own answer and the source paragraph
   * already filled in, since neither depends on the API — so the ~2.5s
   * grading round-trip is spent reading rather than staring at a disabled
   * button. Only the two verdict columns wait.
   */
  evaluation: RecallEvaluation | null;
  sourceParagraphFallback: string;
  onContinue: () => void;
  onSkip: () => void;
}

/** Placeholder rows for a verdict column while grading is in flight. */
function PendingList({ widths }: { widths: string[] }) {
  return (
    <ul className="space-y-2.5" aria-busy="true" aria-label="Grading your answer">
      {widths.map((w, i) => (
        <li key={i} className="flex items-start gap-2">
          <Skeleton className="w-4 h-4 mt-0.5 rounded-full shrink-0" />
          <Skeleton className={`h-3.5 mt-0.5 ${w}`} />
        </li>
      ))}
    </ul>
  );
}

export function RecallEvaluationScreen({
  response,
  evaluation,
  sourceParagraphFallback,
  onContinue,
  onSkip,
}: RecallEvaluationScreenProps) {
  const sourceParagraph = evaluation?.source_paragraph || sourceParagraphFallback;
  const pending = evaluation === null;

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ParchmentCard className="p-5" hover={false}>
          <p className="text-xs uppercase tracking-wider text-ghibli-forest font-medium mb-3">You wrote</p>
          <p className="text-sm font-sans text-ghibli-canopy whitespace-pre-wrap leading-relaxed">{response}</p>
        </ParchmentCard>

        <ParchmentCard className="p-5" hover={false}>
          <p className="text-xs uppercase tracking-wider text-ghibli-forest font-medium mb-3">
            {pending ? "Checking what you got…" : "You got"}
          </p>
          {pending ? (
            <PendingList widths={["w-3/4", "w-1/2", "w-2/3"]} />
          ) : (
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
          )}
        </ParchmentCard>

        <ParchmentCard className="p-5" hover={false}>
          <p className="text-xs uppercase tracking-wider text-ghibli-forest font-medium mb-3">
            {pending ? "Looking for gaps…" : "You missed"}
          </p>
          {pending ? (
            <PendingList widths={["w-2/3", "w-3/4", "w-1/2"]} />
          ) : (
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
          )}
        </ParchmentCard>
      </div>

      <ParchmentCard className="p-6 mt-4" hover={false}>
        <p className="text-xs uppercase tracking-wider text-ghibli-forest font-medium mb-3">The full picture</p>
        <p className="font-serif text-ghibli-canopy leading-relaxed text-sm md:text-base">{sourceParagraph}</p>
      </ParchmentCard>

      <div className="flex justify-end mt-6">
        <Button onClick={onContinue} disabled={pending}>
          {pending ? "Grading…" : "Continue"}
        </Button>
      </div>
      <SkipStageLink onSkip={onSkip} />
    </div>
  );
}
