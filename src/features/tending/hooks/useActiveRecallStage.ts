import { useCallback, useEffect, useRef, useState } from "react";
import { evaluateRecall } from "../services/tendingApi";
import type { ActiveRecallResult, RecallEvaluation } from "../types";

const TIMER_SECONDS = 30;

/** The response/timer/evaluate lifecycle behind the Active Recall stage. */
export function useActiveRecallStage(sessionId: string, onComplete: (result: ActiveRecallResult) => void) {
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
      const result = await evaluateRecall({ sessionId, studentResponse: responseRef.current });
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

  return {
    response,
    setResponse,
    evaluation,
    submitting,
    submitError,
    secondsLeft,
    emptyTimeout,
    submit,
    handleRetry,
    handleContinue,
  };
}
