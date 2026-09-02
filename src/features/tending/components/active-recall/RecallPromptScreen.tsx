import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { SkipStageLink } from "../SkipStageLink";

interface RecallPromptScreenProps {
  prompt: string;
  response: string;
  onResponseChange: (value: string) => void;
  submitting: boolean;
  submitError: string | null;
  secondsLeft: number;
  onSubmit: () => void;
  onSkip: () => void;
}

export function RecallPromptScreen({
  prompt,
  response,
  onResponseChange,
  submitting,
  submitError,
  secondsLeft,
  onSubmit,
  onSkip,
}: RecallPromptScreenProps) {
  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;
  const timerLabel = `${mm}:${ss.toString().padStart(2, "0")}`;
  const timerCritical = secondsLeft <= 10;

  return (
    <div className="max-w-2xl mx-auto w-full">
      <ParchmentCard className="p-6 md:p-8" hover={false}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <h2 className="font-serif text-xl md:text-2xl text-ghibli-canopy leading-snug flex-1">{prompt}</h2>
          <div
            className={`flex items-center gap-1.5 shrink-0 tabular-nums text-base font-semibold ${
              timerCritical ? "text-amber-700" : "text-ghibli-canopy"
            }`}
            aria-live="polite"
            aria-label={`${secondsLeft} seconds remaining`}
          >
            <Clock className="w-4 h-4" />
            {timerLabel}
          </div>
        </div>
        <Textarea
          value={response}
          onChange={(e) => onResponseChange(e.target.value)}
          placeholder="Write everything you can remember. Don't worry about being polished."
          rows={6}
          className="resize-y min-h-[160px] font-sans text-base"
          disabled={submitting}
          autoFocus
        />
        <div className="flex items-center justify-end mt-4">
          <Button onClick={onSubmit} disabled={submitting || response.trim().length === 0}>
            {submitting ? "Evaluating…" : "Submit"}
          </Button>
        </div>
        {submitError && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3 flex items-center justify-between gap-3">
            <span>{submitError}</span>
            <button type="button" onClick={onSubmit} className="underline hover:no-underline shrink-0">
              Try again
            </button>
          </div>
        )}
      </ParchmentCard>
      <SkipStageLink onSkip={onSkip} />
    </div>
  );
}
