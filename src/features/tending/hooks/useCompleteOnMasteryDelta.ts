import { useCallback, useEffect, useRef, useState } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { gardenQueryKeys, tendingQueryKeys } from "@/lib/queryKeys";
import type { AuthUser } from "@/features/auth";
import { completeSession } from "../services/tendingApi";
import type { TendingMachine } from "../state/tendingMachine";
import type { AllStageResults, TendingSession } from "../types";

/**
 * Fires /complete once the machine reaches mastery_delta with no delta yet.
 * This pattern reads the latest state cleanly — earlier closure-based versions
 * captured stale recordings because state updates batch.
 */
export function useCompleteOnMasteryDelta(
  state: TendingSession,
  machine: TendingMachine,
  courseId: string | undefined,
  topicId: string | undefined,
  user: AuthUser | null,
  queryClient: QueryClient,
) {
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [completeAttempt, setCompleteAttempt] = useState(0);
  const completeFiredRef = useRef(false);

  useEffect(() => {
    if (state.currentStage !== "mastery_delta") return;
    if (state.masteryDelta) return;
    if (!state.sessionId) return;
    if (completeFiredRef.current) return;
    completeFiredRef.current = true;

    let cancelled = false;
    const results: AllStageResults = {
      recall: state.recallResults,
      active_recall: state.activeRecallResult,
      mnemonics: state.mnemonicResults,
      connections: state.connectionResults,
      quiz: state.quizResults,
      stages_skipped: state.stagesSkipped,
    };
    completeSession({ sessionId: state.sessionId, results })
      .then((delta) => {
        if (cancelled) return;
        setCompleteError(null);
        machine.recordMastery(delta);
        // Marker for KnowledgeGardenPage: it pulses semantic edges and
        // animates the tended topic's own progress bar on return. Garden
        // treats anything <30s old as "just tended". (Commit 3.)
        if (topicId && courseId) {
          try {
            sessionStorage.setItem("passai:just_tended", JSON.stringify({ topicId, courseId, ts: Date.now() }));
          } catch {
            // sessionStorage can throw in private modes; degrade silently.
          }
          if (user) {
            queryClient.invalidateQueries({ queryKey: gardenQueryKeys.progress(courseId, user.id) });
            // Without this, the garden's incomplete-session query can still
            // hold the pre-completion cached result (staleTime 30s) and keep
            // showing "Resume →" for a session that just finished.
            queryClient.invalidateQueries({ queryKey: tendingQueryKeys.incompleteSession(courseId, user.id) });
          }
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        completeFiredRef.current = false; // allow retry via stage re-entry
        const msg = err instanceof Error ? err.message : "Couldn't save your session.";
        setCompleteError(msg);
        toast.error(msg);
      });
    return () => {
      cancelled = true;
    };
  }, [
    state.currentStage,
    state.masteryDelta,
    state.sessionId,
    state.recallResults,
    state.activeRecallResult,
    state.mnemonicResults,
    state.connectionResults,
    state.quizResults,
    state.stagesSkipped,
    machine,
    topicId,
    courseId,
    user,
    queryClient,
    completeAttempt,
  ]);

  const handleRetryComplete = useCallback(() => {
    setCompleteError(null);
    completeFiredRef.current = false;
    setCompleteAttempt((n) => n + 1);
  }, []);

  return { completeError, handleRetryComplete };
}
