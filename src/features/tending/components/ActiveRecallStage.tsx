import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clock, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { evaluateRecall } from "../services/tendingApi";
import type { ActiveRecallResult, RecallEvaluation } from "../types";
import { SkipStageLink } from "./SkipStageLink";

const TIMER_SECONDS = 30;

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
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [emptyTimeout, setEmptyTimeout] = useState(false);
  const submitGuardRef = useRef(false);

  // submit reads the latest response via a ref so the auto-submit timer
  // doesn't capture a stale closure.
  const responseRef = useRef(response);
  useEffect(() => {
    responseRef.current = response;
  }, [response]);

  const submit = useCallback(async () => {
    if (submitGuardRef.current) return;
    const text = responseRef.current.trim();
    if (text.length === 0) {
      // Auto-submit fired with nothing typed — show the dedicated empty-state
      // message instead of hitting the API with an empty string.
      setEmptyTimeout(true);
      return;
    }
    submitGuardRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await evaluateRecall({
        sessionId,
        studentResponse: responseRef.current,
      });
      setEvaluation(result);
    } catch (err) {
      submitGuardRef.current = false; // allow retry
      const msg = err instanceof Error ? err.message : "Couldn't evaluate your response.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [sessionId]);

  // 30-second countdown. Stops once the student submits or the empty-state is
  // showing. Auto-submits at 0.
  useEffect(() => {
    if (evaluation || submitting || emptyTimeout) return;
    if (secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [evaluation, submitting, emptyTimeout, secondsLeft]);

  // When the timer hits 0 — fire submit() once. submit() routes to either the
  // API call or the empty-state branch based on response length.
  useEffect(() => {
    if (secondsLeft !== 0) return;
    if (evaluation || submitting || emptyTimeout) return;
    submit();
  }, [secondsLeft, evaluation, submitting, emptyTimeout, submit]);

  const handleRetry = () => {
    setEmptyTimeout(false);
    setResponse("");
    setSubmitError(null);
    setSecondsLeft(TIMER_SECONDS);
    submitGuardRef.current = false;
  };

  const handleContinue = () => {
    onComplete({ student_response: response, evaluation });
  };

  // Empty-timeout state — student typed nothing in 30s.
  if (emptyTimeout) {
    return (
      <div className="max-w-xl mx-auto w-full">
        <ParchmentCard className="p-8 md:p-10 text-center" hover={false}>
          <p className="font-serif text-xl md:text-2xl text-ghibli-canopy leading-snug mb-6">
            Do you not remember anything, or are you against brain hyper-scanning?
          </p>
          <Button onClick={handleRetry}>Try again</Button>
        </ParchmentCard>
        <SkipStageLink onSkip={onSkip} />
      </div>
    );
  }

  // Pre-evaluation: prompt + textarea + countdown + submit
  if (!evaluation) {
    const mm = Math.floor(secondsLeft / 60);
    const ss = secondsLeft % 60;
    const timerLabel = `${mm}:${ss.toString().padStart(2, "0")}`;
    const timerCritical = secondsLeft <= 10;

    return (
      <div className="max-w-2xl mx-auto w-full">
        <ParchmentCard className="p-6 md:p-8" hover={false}>
          <div className="flex items-start justify-between gap-4 mb-5">
            <h2 className="font-serif text-xl md:text-2xl text-ghibli-canopy leading-snug flex-1">
              {prompt}
            </h2>
            <div
              className={`flex items-center gap-1.5 shrink-0 tabular-nums font-mono text-base font-semibold ${
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
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Write everything you can remember. Don't worry about being polished."
            rows={6}
            className="resize-y min-h-[160px] font-sans text-base"
            disabled={submitting}
            autoFocus
          />
          <div className="flex items-center justify-end mt-4">
            <Button onClick={submit} disabled={submitting || response.trim().length === 0}>
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
