import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { toast } from "sonner";
import { gardenQueryKeys, tendingQueryKeys } from "@/lib/queryKeys";
import type { CourseGardenData } from "@/features/courses/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/features/auth";
import { PremiumGate } from "@/features/subscription";
import { ActiveRecallStage } from "../components/ActiveRecallStage";
import { ConnectionsStage } from "../components/ConnectionsStage";
import { MasteryDeltaStage } from "../components/MasteryDeltaStage";
import { MnemonicStage } from "../components/MnemonicStage";
import { QuizStage } from "../components/QuizStage";
import { RecallCardsStage } from "../components/RecallCardsStage";
import { StageProgressDots } from "../components/StageProgressDots";
import { TendingLoading } from "../components/TendingLoading";
import { computePassProbability } from "@/lib/passProbability";
import {
  completeSession,
  fetchCourseMasterySnapshot,
  generateSession,
} from "../services/tendingApi";
import {
  findIncompleteSessionForTopic,
  mapRowToTendingSession,
  persistActiveRecallStage,
  persistConnectionStage,
  persistMnemonicStage,
  persistQuizStage,
  persistRecallStage,
  persistSkipStage,
} from "../services/tendingProgressApi";
import { nextStage, useTendingMachine } from "../state/tendingMachine";
import type { AllStageResults } from "../types";

function TendingFlowInner() {
  const { courseId, topicId } = useParams<{ courseId: string; topicId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateAttempt, setGenerateAttempt] = useState(0);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [completeAttempt, setCompleteAttempt] = useState(0);
  const [checkedForResume, setCheckedForResume] = useState(false);

  const machine = useTendingMachine(courseId ?? "", topicId ?? "");
  const { state, isInitialized, init } = machine;
  const completeFiredRef = useRef(false);
  const preTendSnapshotRef = useRef(false);

  // Resume check — runs once on mount, before the generate effect. Finds an
  // in-flight DB session for this course+topic and hydrates directly from
  // it; a completed/abandoned session is never returned by this lookup (see
  // tendingProgressApi.ts), so this can never resurface stale results.
  useEffect(() => {
    if (!courseId || !topicId || !user) return;
    if (checkedForResume) return;
    let cancelled = false;
    findIncompleteSessionForTopic(user.id, courseId, topicId)
      .then((row) => {
        if (cancelled) return;
        if (row) {
          machine.hydrate(mapRowToTendingSession(row));
          toast.success("Resuming your tending session");
        }
      })
      .catch(() => {
        // Lookup failure — fall through to a fresh session rather than
        // blocking the page forever.
      })
      .finally(() => {
        if (!cancelled) setCheckedForResume(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- useTendingMachine returns a new wrapper object every render (only its dispatch is stable); including `machine` here would re-fire this lookup on every render instead of once.
  }, [courseId, topicId, user, checkedForResume]);

  // Snapshot the topic's current overall_progress from the garden query cache
  // BEFORE Tending starts changing it. Used by the garden's "tended-topic
  // own-tick" animation on return. Cache-only — we don't issue a new fetch
  // just for this; if the user landed on Tending without visiting the garden
  // first, the animation is silently skipped on return. (Commit 3.)
  useEffect(() => {
    if (!courseId || !topicId || !user) return;
    if (preTendSnapshotRef.current) return;
    preTendSnapshotRef.current = true;
    const cached = queryClient.getQueryData<CourseGardenData>(
      gardenQueryKeys.progress(courseId, user.id),
    );
    const topic = cached?.topics.find((t) => t.topic_id === topicId);
    if (topic) {
      sessionStorage.setItem(
        `passai:pre_tend_progress:${topicId}`,
        String(topic.overall_progress),
      );
    }
  }, [courseId, topicId, user, queryClient]);

  // Generate a fresh session on mount, but only once the resume check has
  // run and found nothing to hydrate — otherwise this would race the
  // resume-check effect and generate a redundant session.
  useEffect(() => {
    if (!courseId || !topicId || !user) return;
    if (!checkedForResume) return;
    if (isInitialized) return;
    let cancelled = false;
    generateSession({ userId: user.id, courseId, topicId })
      .then((payload) => {
        if (cancelled) return;
        setGenerateError(null);
        init(payload);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Couldn't start your session.";
        setGenerateError(msg);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, topicId, user, checkedForResume, isInitialized, init, generateAttempt]);

  // Snapshot course-level concept mastery once per session so MasteryDelta can
  // render pass-probability before/after. Runs in parallel with generateSession;
  // failure is silent and the screen falls back to topic-only mastery.
  // Ref-guarded (not just the state.masterySnapshot check) so a legitimate
  // state change elsewhere in the flow — e.g. init()/hydrate() firing after
  // this effect's first pass — can't trigger a second fetch before the first
  // one resolves.
  const masterySnapshotFetchedRef = useRef(false);
  useEffect(() => {
    if (!courseId || !user) return;
    if (masterySnapshotFetchedRef.current) return;
    masterySnapshotFetchedRef.current = true;
    let cancelled = false;
    fetchCourseMasterySnapshot(user.id, courseId).then((snap) => {
      if (cancelled || !snap) return;
      machine.setMasterySnapshot(snap);
    });
    return () => {
      cancelled = true;
    };
  }, [courseId, user, machine]);

  // Fire /complete once the machine reaches mastery_delta with no delta yet.
  // This pattern reads the latest state cleanly — earlier closure-based versions
  // captured stale recordings because state updates batch.
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
            sessionStorage.setItem(
              "passai:just_tended",
              JSON.stringify({ topicId, courseId, ts: Date.now() }),
            );
          } catch {
            // sessionStorage can throw in private modes; degrade silently.
          }
          if (user) {
            queryClient.invalidateQueries({
              queryKey: gardenQueryKeys.progress(courseId, user.id),
            });
            // Without this, the garden's incomplete-session query can still
            // hold the pre-completion cached result (staleTime 30s) and keep
            // showing "Resume →" for a session that just finished.
            queryClient.invalidateQueries({
              queryKey: tendingQueryKeys.incompleteSession(courseId, user.id),
            });
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

  if (!courseId || !topicId) {
    navigate("/home");
    return null;
  }

  // Loading / error state
  if (!isInitialized) {
    if (generateError) {
      return (
        <div className="flex flex-col min-h-screen">
          <TopBar
            topicTitle="Tending session"
            currentStage={state.currentStage}
            stagesSkipped={state.stagesSkipped}
            onExit={() => navigate(`/course/${courseId}/garden`)}
          />
          <main className="flex-1 flex items-center justify-center px-6">
            <div className="max-w-md text-center">
              <p className="font-serif text-ghibli-canopy mb-4">{generateError}</p>
              <button
                type="button"
                className="text-sm text-ghibli-forest hover:underline"
                onClick={() => setGenerateAttempt((n) => n + 1)}
              >
                Try again
              </button>
            </div>
          </main>
        </div>
      );
    }
    return (
      <div className="flex flex-col min-h-screen">
        <TopBar
          topicTitle="Loading…"
          currentStage="loading"
          stagesSkipped={[]}
          onExit={() => navigate(`/course/${courseId}/garden`)}
        />
        <main className="flex-1 flex flex-col">
          <TendingLoading onRetry={() => setGenerateAttempt((n) => n + 1)} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar
        topicTitle={state.topicTitle}
        currentStage={state.currentStage}
        stagesSkipped={state.stagesSkipped}
        onExit={() => setShowExitConfirm(true)}
      />

      <main className="flex-1 flex flex-col px-4 md:px-6 py-8 md:py-12">
        {state.currentStage === "recall_cards" && state.payload && (
          <RecallCardsStage
            cards={state.payload.recall_cards.cards}
            onComplete={(results) => {
              machine.recordRecall(results);
              machine.advance();
              void persistRecallStage(state.sessionId, results).catch(() => {});
            }}
            onSkip={handleSkip}
          />
        )}

        {state.currentStage === "active_recall" && state.payload && (
          <ActiveRecallStage
            sessionId={state.sessionId}
            prompt={state.payload.active_recall.prompt}
            sourceParagraphFallback={state.payload.active_recall.source_paragraph}
            onComplete={(result) => {
              machine.recordActiveRecall(result);
              machine.advance();
              void persistActiveRecallStage(state.sessionId).catch(() => {});
            }}
            onSkip={handleSkip}
          />
        )}

        {state.currentStage === "mnemonics" && state.payload && (
          <MnemonicStage
            mnemonics={state.payload.mnemonics.mnemonics}
            onComplete={(results) => {
              machine.recordMnemonics(results);
              machine.advance();
              void persistMnemonicStage(state.sessionId, results).catch(() => {});
            }}
            onSkip={handleSkip}
          />
        )}

        {state.currentStage === "connections" && state.payload && (
          <ConnectionsStage
            pairs={state.payload.connections.pairs}
            type={state.payload.connections.type}
            onComplete={(results) => {
              machine.recordConnections(results);
              machine.advance();
              void persistConnectionStage(state.sessionId, results).catch(() => {});
            }}
            onSkip={handleSkip}
          />
        )}

        {state.currentStage === "quiz" && (
          <QuizStage
            courseId={courseId}
            topicId={topicId}
            onComplete={(result) => {
              machine.recordQuiz(result);
              machine.advance();
              void persistQuizStage(state.sessionId, result).catch(() => {});
            }}
            onSkip={handleSkip}
          />
        )}

        {state.currentStage === "mastery_delta" &&
          (state.masteryDelta ? (
            <MasteryDeltaStage
              courseId={courseId}
              topicId={topicId}
              delta={state.masteryDelta}
              stagesSkipped={state.stagesSkipped}
              startedAt={state.startedAt}
              passProbability={(() => {
                if (!state.masterySnapshot) return null;
                const before = state.masterySnapshot.concepts.map((c) => c.p_mastery);
                const overrides = new Map(
                  state.masteryDelta.kc_breakdown.map((kc) => [kc.kc_id, kc.after]),
                );
                const after = state.masterySnapshot.concepts.map(
                  (c) => overrides.get(c.kc_id) ?? c.p_mastery,
                );
                const target = state.masterySnapshot.targetGrade;
                const passBefore = computePassProbability(before, target);
                const passAfter = computePassProbability(after, target);
                if (passBefore === null || passAfter === null) return null;
                return { before: passBefore, after: passAfter };
              })()}
            />
          ) : completeError ? (
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="max-w-md text-center">
                <p className="font-serif text-ghibli-canopy mb-4">{completeError}</p>
                <button
                  type="button"
                  className="text-sm text-ghibli-forest hover:underline"
                  onClick={handleRetryComplete}
                >
                  Try again
                </button>
              </div>
            </div>
          ) : (
            <TendingLoading staticMessage="Measuring how much your bed grew…" />
          ))}
      </main>

      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave session?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress is saved — come back anytime to pick up where you left off.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLeave}>Leave session</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface TopBarProps {
  topicTitle: string;
  currentStage: ReturnType<typeof useTendingMachine>["state"]["currentStage"];
  stagesSkipped: ReturnType<typeof useTendingMachine>["state"]["stagesSkipped"];
  onExit: () => void;
}

function TopBar({ topicTitle, currentStage, stagesSkipped, onExit }: TopBarProps) {
  return (
    <header className="flex items-center justify-between gap-4 px-4 md:px-6 py-3 border-b border-ghibli-moss/15 bg-white/60 backdrop-blur-sm">
      <h1 className="font-serif text-base md:text-lg text-ghibli-canopy truncate min-w-0 flex-1">
        {topicTitle}
      </h1>
      <div className="hidden sm:block">
        <StageProgressDots currentStage={currentStage} stagesSkipped={stagesSkipped} />
      </div>
      <button
        type="button"
        onClick={onExit}
        aria-label="Leave session"
        className="w-9 h-9 rounded-full border border-ghibli-moss/30 bg-cream-100/80 text-ghibli-canopy flex items-center justify-center hover:bg-cream-100 hover:border-ghibli-moss/50 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </header>
  );
}

export function TendingFlowPage() {
  return (
    <PremiumGate featureName="Tending Flow" featureDescription="Guided study sessions for one topic at a time.">
      <TendingFlowInner />
    </PremiumGate>
  );
}
