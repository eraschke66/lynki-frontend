/**
 * BKT-native adaptive session — a topic-scoped quiz drawn from concept
 * mastery, as opposed to the named/generated course_quizzes flow in
 * quizAttemptService.ts.
 */
import type { TestData, AnswerFeedback, TestQuestion } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

/**
 * Fetch a BKT-native session scoped to a topic.
 * Normalizes the response into TestData so TestPage can render it unchanged.
 */
export async function fetchBktSession(
  userId: string,
  courseId: string,
  topicId: string,
): Promise<TestData> {
  const params = new URLSearchParams();
  params.set("topic_id", topicId);
  const query = params.toString();
  const url = `${API_URL}/bkt/session/${userId}/${courseId}${query ? `?${query}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to load focused session");
  }
  const data = await res.json();
  return {
    test_id: data.session_id,
    course_id: courseId,
    course_name: "Focused Study",
    questions: data.questions as TestQuestion[],
    total_questions: data.total_questions,
    message: data.all_mastered ? "All concepts in this topic are mastered!" : undefined,
  };
}

/**
 * Submit a single answer via the BKT answer endpoint (used for focused-topic sessions).
 */
export async function submitBktAnswer(
  userId: string,
  courseId: string,
  questionId: string,
  selectedOptionIndex: number,
  sessionId?: string,
): Promise<AnswerFeedback> {
  const res = await fetch(`${API_URL}/bkt/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      course_id: courseId,
      question_id: questionId,
      selected_option_index: selectedOptionIndex,
      session_id: sessionId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to submit answer");
  }
  return res.json();
}
