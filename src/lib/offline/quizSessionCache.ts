/**
 * Offline copy of an in-progress topic quiz.
 *
 * What this can and cannot do is set by the backend contract. A session payload
 * carries the questions, the options and the hint, but **not** which option is
 * correct — grading happens server-side, one answer at a time, via
 * POST /topic-quiz/answer. So a cached session lets a student re-open a quiz
 * they had already loaded and keep reading it with no connection, but it cannot
 * mark an answer. Offline answering needs the backend to hand back the correct
 * index up front, or to expose a bulk-grade endpoint.
 *
 * Entries are stamped with the user id they were fetched for, so a shared
 * browser can never show one student another's questions.
 */

import { STORE_QUIZ_SESSION, idbDelete, idbGet, idbSet } from "./db";
import type { TopicQuizSession } from "@/features/topic-quiz/services/topicQuizService";

interface CachedQuizSession {
  userId: string;
  cachedAt: number;
  session: TopicQuizSession;
}

/** A cached session older than this is stale enough to ignore. */
const MAX_AGE_MS = 1000 * 60 * 60 * 24;

const keyFor = (courseId: string, topicId: string) => `${courseId}:${topicId}`;

export async function cacheQuizSession(
  userId: string,
  courseId: string,
  topicId: string,
  session: TopicQuizSession,
): Promise<void> {
  if (!session?.questions?.length) return;
  await idbSet(STORE_QUIZ_SESSION, keyFor(courseId, topicId), {
    userId,
    cachedAt: Date.now(),
    session,
  } satisfies CachedQuizSession);
}

export async function readCachedQuizSession(
  userId: string,
  courseId: string,
  topicId: string,
): Promise<TopicQuizSession | null> {
  const key = keyFor(courseId, topicId);
  const entry = await idbGet<CachedQuizSession>(STORE_QUIZ_SESSION, key);

  if (!entry || entry.userId !== userId) return null;
  if (!entry.session?.questions?.length) return null;
  if (Date.now() - entry.cachedAt > MAX_AGE_MS) {
    await idbDelete(STORE_QUIZ_SESSION, key);
    return null;
  }

  return entry.session;
}

/**
 * True for the failure modes that mean "no network", as opposed to the server
 * rejecting the request. `fetch` surfaces a lost connection as a TypeError.
 */
export function isOfflineError(err: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  if (err instanceof TypeError) return true;
  const message = (err as { message?: string })?.message?.toLowerCase() ?? "";
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("load failed")
  );
}
