/**
 * Service layer for the Test feature.
 * Communicates with the backend /api/v1/test endpoints.
 */

import type {
  TestData,
  AnswerFeedback,
  PassChanceData,
  TestHistoryData,
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
