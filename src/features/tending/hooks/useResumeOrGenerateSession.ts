import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { AuthUser } from "@/features/auth";
import { generateSession } from "../services/tendingApi";
import { findIncompleteSessionForTopic, mapRowToTendingSession } from "../services/tendingProgressApi";
import type { TendingMachine } from "../state/tendingMachine";
import type { TendingSessionPayload } from "../types";

/**
 * Resumes an in-flight DB session if one exists for this course+topic, else
 * generates a fresh one. The resume check must finish first — hydrating,
 * when it finds a session — or the generate effect would race it and start
 * a redundant session. See tendingMachine.ts for why this deliberately does
 * NOT depend on `machine`'s identity in either effect.
 *
 * Both effects key off `userId` (a string), never the `user` object.
 * AuthProvider calls setUser() on every supabase onAuthStateChange event —
 * INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, and the re-emit when the tab
 * regains visibility — and each one hands back a brand-new object for the
 * same logged-in user. Depending on the object meant any of those re-fired
 * generation, and `isInitialized` (the only guard) stays false for the whole
 * call, so the re-fire always got through.
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
  const userId = user?.id;

  /**
   * The one in-flight generation, held as a promise rather than a boolean
   * flag. A repeat effect run for the same key *subscribes* to the existing
   * promise instead of skipping — which is what makes this survive
   * StrictMode's mount → cleanup → mount: the second run reuses the first
   * run's request and is the one that actually calls init(). A plain "already
   * running, bail out" guard would leave nobody listening, since the first
   * run's cleanup has already disowned the result.
   */
  const inFlight = useRef<{ key: string; promise: Promise<TendingSessionPayload> } | null>(null);

  useEffect(() => {
    if (!courseId || !topicId || !userId) return;
    if (checkedForResume) return;
    let cancelled = false;
    findIncompleteSessionForTopic(userId, courseId, topicId)
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
  }, [courseId, topicId, userId, checkedForResume]);

  useEffect(() => {
    if (!courseId || !topicId || !userId) return;
    if (!checkedForResume) return;
    if (isInitialized) return;

    // Exactly one POST /topic-tending/generate per user+topic+retry, however
    // many times this effect runs. The stable deps above stop most re-fires;
    // this stops the rest (StrictMode's double-invoke, any future dep churn).
    // It matters because a request the client walks away from still costs a
    // full Sonnet generation and a session insert server-side — and each
    // duplicate marks the previous session `abandoned`, so the UI could end up
    // holding a session the backend has already discarded.
    const key = `${userId}:${courseId}:${topicId}:${generateAttempt}`;
    if (inFlight.current?.key !== key) {
      inFlight.current = { key, promise: generateSession({ userId, courseId, topicId }) };
    }

    let cancelled = false;
    inFlight.current.promise
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
  }, [courseId, topicId, userId, checkedForResume, isInitialized, init, generateAttempt]);

  return { generateError, retryGenerate: () => setGenerateAttempt((n) => n + 1) };
}
