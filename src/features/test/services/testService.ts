/**
 * Service layer for the Test feature.
 * Communicates with the backend /api/v1/test endpoints.
 */

import type {
  TestData,
  AnswerFeedback,
  PassChanceData,
  TestHistoryData,
  TestQuestion,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

/**
 * Fetch a test for a course. Returns one question per concept.
 */
export async function fetchTest(
  userId: string,
  courseId: string,
): Promise<TestData> {
  const res = await fetch(`${API_URL}/test/${userId}/${courseId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to load test");
  }
  return res.json();
}

/**
 * Resume an in-progress test session.
 */
export async function fetchResumeTest(
  userId: string,
  sessionId: string,
): Promise<TestData> {
  const res = await fetch(`${API_URL}/test/resume/${userId}/${sessionId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to resume test");
  }
  return res.json();
}

/**
 * Submit a single answer and get feedback.
 */
export async function submitAnswer(
  userId: string,
  courseId: string,
  questionId: string,
  selectedOptionIndex: number,
  testId?: string,
): Promise<AnswerFeedback> {
  const res = await fetch(`${API_URL}/test/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      course_id: courseId,
      question_id: questionId,
      selected_option_index: selectedOptionIndex,
      test_id: testId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to submit answer");
  }
  return res.json();
}

/**
 * Fetch the current pass chance for a course.
 */
export async function fetchPassChance(
  userId: string,
  courseId: string,
): Promise<PassChanceData> {
  const res = await fetch(`${API_URL}/test/pass-chance/${userId}/${courseId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to load pass chance");
  }
  return res.json();
}

/**
 * Fetch quiz history for a course.
 */
export async function fetchTestHistory(
  userId: string,
  courseId: string,
): Promise<TestHistoryData> {
  const res = await fetch(`${API_URL}/test/history/${userId}/${courseId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to load test history");
  }
  return res.json();
}

/**
 * Fetch a BKT-native session, optionally scoped to a topic or specific concept IDs.
 * Priority: conceptIds > topicId > whole course.
 * Normalizes the response into TestData so TestPage can render it unchanged.
 */
export async function fetchBktSession(
  userId: string,
  courseId: string,
  topicId?: string | null,
  conceptIds?: string | null,
): Promise<TestData> {
  const params = new URLSearchParams();
  if (topicId) params.set("topic_id", topicId);
  if (conceptIds) params.set("concept_ids", conceptIds);
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

/**
 * Mark a test session as completed.
 */
export async function completeTest(
  userId: string,
  courseId: string,
  testId: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/test/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      course_id: courseId,
      test_id: testId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to complete test");
  }
}
