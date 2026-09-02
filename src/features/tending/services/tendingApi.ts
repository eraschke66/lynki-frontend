import { USE_MOCK_TENDING_API } from "@/lib/flags";
import { supabase } from "@/lib/supabase";
import type {
  AllStageResults,
  ConceptMasteryRow,
  CourseMasterySnapshot,
  MasteryDelta,
  RecallEvaluation,
  TendingSessionPayload,
} from "../types";
import generateMock from "../mocks/generateSession.mock.json";
import evaluateMock from "../mocks/evaluateRecall.mock.json";
import completeMock from "../mocks/completeSession.mock.json";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000/api/v1";

const MOCK_LATENCY_MS = 1500;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * 150s, not 90s. The backend now caps its own Claude call (75s for /generate,
 * 45s for /evaluate-recall) and returns a real error when it blows that, so
 * this only needs to be loose enough to cover the backend budget *plus* a
 * Render free-tier cold start. At 90s a cold dyno could eat the whole budget
 * before FastAPI saw the request, and the client would abort a generation that
 * was about to succeed — sending the user to the "try again" screen, which
 * started yet another one.
 */
async function postJSON<T>(path: string, body: unknown, timeoutMs = 150_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { detail?: string }).detail ?? `Request failed: ${path}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** POST /topic-tending/generate */
export async function generateSession(args: {
  userId: string;
  courseId: string;
  topicId: string;
}): Promise<TendingSessionPayload> {
  if (USE_MOCK_TENDING_API) {
    await sleep(MOCK_LATENCY_MS);
    return {
      ...(generateMock as TendingSessionPayload),
      course_id: args.courseId,
      topic_id: args.topicId,
      session_id: `mock-${args.courseId}-${args.topicId}-${Date.now()}`,
    };
  }
  return postJSON<TendingSessionPayload>("/topic-tending/generate", {
    user_id: args.userId,
    course_id: args.courseId,
    topic_id: args.topicId,
  });
}

/** POST /topic-tending/evaluate-recall */
export async function evaluateRecall(args: {
  sessionId: string;
  studentResponse: string;
}): Promise<RecallEvaluation> {
  if (USE_MOCK_TENDING_API) {
    await sleep(MOCK_LATENCY_MS);
    return evaluateMock as RecallEvaluation;
  }
  return postJSON<RecallEvaluation>("/topic-tending/evaluate-recall", {
    session_id: args.sessionId,
    student_response: args.studentResponse,
  });
}

/**
 * Read the user's BKT mastery rows for a course and the course's target_grade.
 * Used to snapshot pass-probability inputs before a tending session starts so
 * the Mastery Delta screen can render a pass-probability before/after.
 *
 * Direct supabase read — same pattern the dashboard uses. Failures are
 * swallowed and surfaced as null so the rest of the flow still works.
 */
export async function fetchCourseMasterySnapshot(
  userId: string,
  courseId: string,
): Promise<CourseMasterySnapshot | null> {
  try {
    const [masteryRes, courseRes] = await Promise.all([
      supabase
        .from("bkt_mastery")
        .select("knowledge_component_id, p_mastery")
        .eq("user_id", userId)
        .eq("course_id", courseId),
      supabase.from("courses").select("target_grade").eq("id", courseId).single(),
    ]);
    if (masteryRes.error) return null;
    const concepts: ConceptMasteryRow[] = (masteryRes.data ?? []).map((r) => ({
      kc_id: r.knowledge_component_id as string,
      p_mastery: Number(r.p_mastery),
    }));
    const targetGrade =
      (courseRes.data?.target_grade as number | null | undefined) ?? 1.0;
    return { concepts, targetGrade };
  } catch {
    return null;
  }
}

/** POST /topic-tending/complete */
export async function completeSession(args: {
  sessionId: string;
  results: AllStageResults;
}): Promise<MasteryDelta> {
  if (USE_MOCK_TENDING_API) {
    await sleep(MOCK_LATENCY_MS);
    return completeMock as MasteryDelta;
  }
  return postJSON<MasteryDelta>("/topic-tending/complete", {
    session_id: args.sessionId,
    results: args.results,
  });
}
