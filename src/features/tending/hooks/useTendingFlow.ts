import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { persistSkipStage } from "../services/tendingProgressApi";
import { nextStage, useTendingMachine } from "../state/tendingMachine";
import { useResumeOrGenerateSession } from "./useResumeOrGenerateSession";
import { usePreTendSnapshot } from "./usePreTendSnapshot";
import { useCourseMasterySnapshot } from "./useCourseMasterySnapshot";
import { useCompleteOnMasteryDelta } from "./useCompleteOnMasteryDelta";

/**
 * All state, side effects, and durability calls behind a Tending Flow run —
 * resuming an in-flight DB session, generating a fresh one, snapshotting
 * pre-session mastery, and firing /complete once the flow reaches
 * mastery_delta. See tendingMachine.ts for why `machine`'s identity is kept
 * out of several of the composed effects' dependency arrays: a spurious
 * re-fire of the generate effect would be an uncancelable duplicate Claude
 * generation + DB insert, not just a harmless re-render. Note that `user` is
 * passed down as-is but the hooks key off `user.id` — the object identity
 * changes on every supabase auth event.
 */
export function useTendingFlow(courseId: string | undefined, topicId: string | undefined) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const machine = useTendingMachine(courseId ?? "", topicId ?? "");
  const { state, isInitialized } = machine;

  const { generateError, retryGenerate } = useResumeOrGenerateSession(courseId, topicId, user, machine);
  usePreTendSnapshot(courseId, topicId, user, queryClient);
  useCourseMasterySnapshot(courseId, user, machine);
  const { completeError, handleRetryComplete } = useCompleteOnMasteryDelta(
    state,
    machine,
    courseId,
    topicId,
    user,
    queryClient,
  );

  const handleConfirmLeave = useCallback(() => {
    // No network call needed here — current_step and every completed stage's
    // results are already durably persisted by each stage's onComplete/onSkip
    // handler as the session progressed.
    navigate(`/course/${courseId}/garden`);
  }, [navigate, courseId]);

  const handleSkip = useCallback(() => {
    const sessionId = state.sessionId;
    const next = nextStage(state.currentStage);
    const skipped = [...state.stagesSkipped, state.currentStage];
    machine.skip();
    void persistSkipStage(sessionId, next, skipped).catch(() => {
      // Fire-and-forget — a failed skip-progress write shouldn't block the UI.
    });
  }, [state.sessionId, state.currentStage, state.stagesSkipped, machine]);

  return {
    machine,
    state,
    isInitialized,
    showExitConfirm,
    setShowExitConfirm,
    generateError,
    retryGenerate,
    completeError,
    handleRetryComplete,
    handleConfirmLeave,
    handleSkip,
  };
}

export type TendingFlow = ReturnType<typeof useTendingFlow>;
