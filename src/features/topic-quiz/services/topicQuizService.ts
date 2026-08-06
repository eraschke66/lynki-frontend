import { supabase } from "@/lib/supabase";
import {
  cacheQuizSession,
  isOfflineError,
  readCachedQuizSession,
} from "@/lib/offline/quizSessionCache";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

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
    const res = await fetch(
      `${API_URL}/topic-quiz/session/${userId}/${courseId}/${topicId}`,
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
  const res = await fetch(`${API_URL}/topic-quiz/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

export async function completeTopicQuiz(sessionId: string): Promise<void> {
  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("topic_quiz_sessions")
    .update({ status: "completed", completed_at: now, updated_at: now })
    .eq("id", sessionId);
  // Fire-and-forget — caller already silences errors
}
