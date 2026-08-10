import type { QuizGeneration } from "./types";

/**
 * One definition of "this build has stopped happening", shared by every surface
 * that watches a question-bank build.
 *
 * This used to live inside CourseDetailPage. It moved here the moment a second
 * screen needed it: two different stall timeouts in one flow is how a student
 * ends up on a wait screen that still believes, next to a card that has already
 * given up.
 *
 * The bound is measured, not guessed. The backend abandons a failing build at
 * about 2m19s — its per-question validation retry is capped at 3 attempts — and
 * every build that has actually succeeded did so in 41-74 seconds. So anything
 * still working at three minutes is past the point where the backend would have
 * either finished or stopped.
 *
 * Before any of this, the only thing that ever set status='failed' was a pg_cron
 * sweep at 15 minutes, so a student watched "your questions are still growing"
 * for a quarter of an hour after the work had already died.
 */
export const GENERATION_STALL_MS = 3 * 60_000;

/** Roughly how long a healthy build takes, used to pace the copy. */
export const GENERATION_TYPICAL_MS = 75_000;

type GenerationLike = Pick<QuizGeneration, "status" | "createdAt">;

export function isGenerationStalled(
  generation: GenerationLike | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!generation) return false;
  if (generation.status !== "pending" && generation.status !== "generating") {
    return false;
  }
  const started = new Date(generation.createdAt).getTime();
  if (Number.isNaN(started)) return false;
  return now - started > GENERATION_STALL_MS;
}

/** Milliseconds since the build started, or null if it can't be determined. */
export function generationElapsedMs(
  generation: GenerationLike | null | undefined,
  now: number = Date.now(),
): number | null {
  if (!generation) return null;
  const started = new Date(generation.createdAt).getTime();
  if (Number.isNaN(started)) return null;
  return now - started;
}

/**
 * What the wait screen should be saying.
 *
 * Deliberately few stages, and each one is reached by a real transition rather
 * than a timer cycling for the sake of movement. "settling" exists only so a
 * long wait has something honest to say instead of repeating itself.
 */
export type WaitStage = "preparing" | "reading" | "planting" | "settling";

export function waitStage(
  generation: GenerationLike | null | undefined,
  now: number = Date.now(),
): WaitStage {
  if (!generation || generation.status === "pending") return "preparing";
  const elapsed = generationElapsedMs(generation, now) ?? 0;
  if (elapsed > GENERATION_TYPICAL_MS) return "settling";
  if (elapsed > GENERATION_TYPICAL_MS / 3) return "planting";
  return "reading";
}
