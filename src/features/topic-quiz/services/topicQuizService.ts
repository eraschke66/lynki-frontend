import { backendFetch } from "@/lib/backend";
import { supabase } from "@/lib/supabase";
import {
  cacheQuizSession,
  isOfflineError,
  readCachedQuizSession,
} from "@/lib/offline/quizSessionCache";

export interface TopicQuizOption {
  index: number;
  text: string;
  explanation: string;
}

export interface TopicQuizQuestion {
  id: string;
  question: string;
  concept_id: string;
  concept_name: string;
  difficulty: "easy" | "medium" | "hard";
  hint: string | null;
  options: TopicQuizOption[];
}

export interface TopicQuizSession {
  id: string;
  topic_id: string;
  topic_name: string;
  status: "in_progress" | "completed";
  current_index: number;
  total_questions: number;
  correct_count: number;
  questions: TopicQuizQuestion[];
  created_at: string;
}

export interface AnswerResult {
  is_correct: boolean;
  correct_option_index: number;
  correct_option_text: string;
  selected_explanation: string;
  correct_explanation: string;
  hint: string | null;
}

export async function fetchTopicQuizSession(
  userId: string,
  courseId: string,
  topicId: string,
): Promise<TopicQuizSession> {
  try {
    const res = await backendFetch(
      `/topic-quiz/session/${userId}/${courseId}/${topicId}`,
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? `Failed to load topic quiz (${res.status})`);
    }

    const session: TopicQuizSession = await res.json();
    // Fire and forget — a storage failure must not fail the fetch.
    void cacheQuizSession(userId, courseId, topicId, session);
    return session;
  } catch (err) {
    // Only a lost connection falls back to the cache. A 4xx/5xx from the
    // backend still surfaces, so a real failure isn't hidden behind stale
    // questions.
    if (!isOfflineError(err)) throw err;

    const cached = await readCachedQuizSession(userId, courseId, topicId);
    if (!cached) throw err;

    return cached;
  }
}

export async function submitTopicQuizAnswer(
  sessionId: string,
  questionIndex: number,
  selectedOption: number,
): Promise<AnswerResult> {
  const res = await backendFetch("/topic-quiz/answer", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      question_index: questionIndex,
      selected_option: selectedOption,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Failed to submit answer");
  }
  return res.json();
}

export interface IncompleteTopicQuizSession {
  id: string;
  topic_id: string;
  created_at: string;
}

/**
 * Most recent unfinished topic-quiz session for a course, if any. Mirrors
 * findIncompleteSessionForCourse in tendingProgressApi.ts (the tending-flow
 * equivalent) — the two are checked side by side by the Knowledge Garden
 * page's "pick up where you left off" recommendation, since a student can
 * leave off mid-session in either flow. There's no abandon/start-fresh
 * concept for this table yet (unlike topic_tending_sessions), so a session
 * found here stays "in_progress" until it's resumed and finished.
 */
export async function findIncompleteTopicQuizSession(
  userId: string,
  courseId: string,
): Promise<IncompleteTopicQuizSession | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("topic_quiz_sessions")
    .select("id, topic_id, created_at")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("status", "in_progress")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function completeTopicQuiz(sessionId: string): Promise<void> {
  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("topic_quiz_sessions")
    .update({ status: "completed", completed_at: now, updated_at: now })
    .eq("id", sessionId);
  // Fire-and-forget — caller already silences errors
}
