import { useState } from "react";
import { Check, X as XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { evaluateRecall } from "../services/tendingApi";
import type { ActiveRecallResult, RecallEvaluation } from "../types";
import { SkipStageLink } from "./SkipStageLink";

const MIN_CHARS = 20;

interface ActiveRecallStageProps {
  sessionId: string;
  prompt: string;
  sourceParagraphFallback: string;
  onComplete: (result: ActiveRecallResult) => void;
  onSkip: () => void;
}

export function ActiveRecallStage({
  sessionId,
  prompt,
  sourceParagraphFallback,
  onComplete,
  onSkip,
}: ActiveRecallStageProps) {
  const [response, setResponse] = useState("");
  const [evaluation, setEvaluation] = useState<RecallEvaluation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit = response.trim().length >= MIN_CHARS && !submitting;

  const submit = async () => {
    if (response.trim().length === 0) {
      toast.info("Try writing at least a sentence first");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await evaluateRecall({ sessionId, studentResponse: response });
      setEvaluation(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't evaluate your response.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    onComplete({ student_response: response, evaluation });
  };

  // Pre-evaluation: prompt + textarea + submit
  if (!evaluation) {
    return (
      <div className="max-w-2xl mx-auto w-full">
        <ParchmentCard className="p-6 md:p-8" hover={false}>
          <h2 className="font-serif text-xl md:text-2xl text-ghibli-canopy mb-5 leading-snug">
            {prompt}
          </h2>
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Write everything you can remember. Don't worry about being polished."
            rows={6}
            className="resize-y min-h-[160px] font-sans text-base"
            disabled={submitting}
          />
          <div className="flex items-center justify-between mt-4 gap-3">
            <p className="text-xs text-ghibli-moss/70">
              {response.trim().length < MIN_CHARS
                ? `${MIN_CHARS - response.trim().length} more ${
                    MIN_CHARS - response.trim().length === 1 ? "character" : "characters"
                  } before you can submit`
                : "Looking good."}
            </p>
            <Button onClick={submit} disabled={!canSubmit}>
              {submitting ? "Evaluating…" : "Submit"}
            </Button>
          </div>
          {submitError && (
            <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3 flex items-center justify-between gap-3">
              <span>{submitError}</span>
              <button
                type="button"
                onClick={submit}
                className="underline hover:no-underline shrink-0"
              >
                Try again
              </button>
            </div>
          )}
        </ParchmentCard>
        <SkipStageLink onSkip={onSkip} />
      </div>
    );
  }

  // Post-evaluation: 3-column got/missed/source paragraph
  const sourceParagraph = evaluation.source_paragraph || sourceParagraphFallback;
  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ParchmentCard className="p-5" hover={false}>
          <p className="text-xs uppercase tracking-wider text-ghibli-moss/80 font-medium mb-3">
            You wrote
          </p>
          <p className="text-sm font-sans text-ghibli-canopy whitespace-pre-wrap leading-relaxed">
            {response}
          </p>
        </ParchmentCard>

        <ParchmentCard className="p-5" hover={false}>
          <p className="text-xs uppercase tracking-wider text-ghibli-moss/80 font-medium mb-3">
            You got
          </p>
          <ul className="space-y-2">
            {evaluation.got_right.length === 0 ? (
              <li className="text-sm text-ghibli-moss/60 italic">Nothing matched yet.</li>
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
          <p className="text-xs uppercase tracking-wider text-ghibli-moss/80 font-medium mb-3">
            You missed
          </p>
          <ul className="space-y-2">
            {evaluation.missed.length === 0 ? (
              <li className="text-sm text-ghibli-moss/60 italic">
                Nothing was missed — nice.
              </li>
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
        <p className="text-xs uppercase tracking-wider text-ghibli-moss/80 font-medium mb-3">
          The full picture
        </p>
        <p className="font-serif text-ghibli-canopy leading-relaxed text-sm md:text-base">
          {sourceParagraph}
        </p>
      </ParchmentCard>

      <div className="flex justify-end mt-6">
        <Button onClick={handleContinue}>Continue</Button>
      </div>
      <SkipStageLink onSkip={onSkip} />
    </div>
  );
}
