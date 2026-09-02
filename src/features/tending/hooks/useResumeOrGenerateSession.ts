import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AuthUser } from "@/features/auth";
import { generateSession } from "../services/tendingApi";
import { findIncompleteSessionForTopic, mapRowToTendingSession } from "../services/tendingProgressApi";
import type { TendingMachine } from "../state/tendingMachine";

/**
 * Resumes an in-flight DB session if one exists for this course+topic, else
 * generates a fresh one. The resume check must finish first — hydrating,
 * when it finds a session — or the generate effect would race it and start
 * a redundant session. See tendingMachine.ts for why this deliberately does
 * NOT depend on `machine`'s identity in either effect.
 */
export function useResumeOrGenerateSession(
  courseId: string | undefined,
  topicId: string | undefined,
  user: AuthUser | null,
  machine: TendingMachine,
) {
  const [checkedForResume, setCheckedForResume] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateAttempt, setGenerateAttempt] = useState(0);
  const { isInitialized, init } = machine;

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

  return { generateError, retryGenerate: () => setGenerateAttempt((n) => n + 1) };
}
