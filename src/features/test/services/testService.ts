/**
 * Service layer for the Test feature.
 * Communicates with the backend /api/v1/test endpoints, or Supabase directly
 * for operations that don't require server-side computation.
 */

import type {
  TestData,
  AnswerFeedback,
  PassChanceData,
  TestHistoryData,
  TestQuestion,
  GeneratedQuizInfo,
} from "../types";
import { supabase } from "@/lib/supabase";
import { computePassProbability } from "@/lib/passProbability";

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
 * Reads mastery directly from Supabase and computes the normal approximation client-side.
 */
export async function fetchPassChance(
  userId: string,
  courseId: string,
): Promise<PassChanceData> {
  const [masteryResult, courseResult] = await Promise.all([
    supabase
      .from("bkt_mastery")
      .select("p_mastery, n_attempts")
      .eq("user_id", userId)
      .eq("course_id", courseId),
    supabase
      .from("courses")
      .select("target_grade")
      .eq("id", courseId)
      .maybeSingle(),
  ]);

  if (masteryResult.error) throw new Error(masteryResult.error.message);

  const rows = masteryResult.data ?? [];
  const targetGrade = (courseResult.data?.target_grade ?? 1.0) as number;
  const totalAttempts = rows.reduce((s, r) => s + (r.n_attempts ?? 0), 0);

  const avgMastery =
    rows.length > 0
      ? rows.reduce((s, r) => s + (r.p_mastery as number), 0) / rows.length
      : null;

  if (totalAttempts === 0 || rows.length === 0) {
    return {
      course_id: courseId,
      pass_probability: null,
      avg_mastery: null,
      target_grade: targetGrade,
      total_skills: rows.length,
    };
  }

  return {
    course_id: courseId,
    pass_probability: computePassProbability(
      rows.map((r) => r.p_mastery),
      targetGrade,
    ),
    avg_mastery: avgMastery,
    target_grade: targetGrade,
    total_skills: rows.length,
  };
}

/**
 * Fetch quiz history for a course directly from Supabase.
 */
export async function fetchTestHistory(
  userId: string,
  courseId: string,
): Promise<TestHistoryData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("test_sessions")
    .select(
      "id, status, total_questions, correct_count, answered_count, pass_chance, created_at, completed_at",
    )
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message || "Failed to load test history");

  const sessions = (data ?? []) as TestHistoryData["sessions"];
  return { sessions, total: sessions.length };
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
 * Generate a fresh named quiz (BKT-guided, ~20-30s).
 * Returns quiz metadata — use startQuizAttempt to actually take it.
 */
export async function generateQuiz(
  userId: string,
  courseId: string,
  quizSize = 10,
): Promise<GeneratedQuizInfo> {
  const res = await fetch(`${API_URL}/quiz-sessions/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      course_id: courseId,
      quiz_size: quizSize,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate quiz");
  }
  return res.json();
}

/**
 * Start a new attempt on a quiz. Returns TestData so TestPage can render it.
 */
export async function startQuizAttempt(
  userId: string,
  quizId: string,
  courseId: string,
): Promise<TestData> {
  const res = await fetch(`${API_URL}/quiz-attempts/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, quiz_id: quizId, course_id: courseId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to start quiz");
  }
  return res.json();
}

/**
 * Resume an in-progress quiz attempt. Returns TestData with answered_count set.
 */
export async function resumeQuizAttempt(
  userId: string,
  attemptId: string,
): Promise<TestData> {
  const res = await fetch(`${API_URL}/quiz-attempts/resume/${userId}/${attemptId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to resume quiz");
  }
  return res.json();
}

/**
 * Submit an answer within a quiz attempt.
 */
export async function submitQuizAnswer(
  userId: string,
  courseId: string,
  quizAttemptId: string,
  questionId: string,
  selectedOptionIndex: number,
): Promise<AnswerFeedback> {
  const res = await fetch(`${API_URL}/quiz-attempts/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      course_id: courseId,
      quiz_attempt_id: quizAttemptId,
      question_id: questionId,
      selected_option_index: selectedOptionIndex,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to submit answer");
  }
  return res.json();
}

/**
 * Explicitly complete a quiz attempt.
 */
export async function completeQuizAttempt(
  userId: string,
  courseId: string,
  quizAttemptId: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/quiz-attempts/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      course_id: courseId,
      quiz_attempt_id: quizAttemptId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to complete quiz attempt");
  }
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
