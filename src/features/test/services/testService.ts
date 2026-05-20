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
  AttemptResultsData,
  AttemptQuestionResult,
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
 * Fetch the full per-question breakdown for a completed (or in-progress) quiz
 * attempt, for the v1 attempt-review page. Reads directly from Supabase.
 *
 * Note: the generated `Database` types in src/types/database.ts predate the
 * course_quizzes / quiz_attempts / question_attempts schema, so we cast the
 * client to `any` here — same pattern as CourseDetailPage's quiz query.
 */
export async function fetchAttemptResults(
  attemptId: string,
): Promise<AttemptResultsData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // 1. The attempt itself.
  const { data: attempt, error: attemptErr } = await sb
    .from("quiz_attempts")
    .select(
      "id, quiz_id, course_id, started_at, completed_at, correct_count, answered_count",
    )
    .eq("id", attemptId)
    .maybeSingle();
  if (attemptErr) throw new Error(attemptErr.message);
  if (!attempt) throw new Error("Attempt not found");

  // 2. The quiz it belongs to.
  const { data: quiz, error: quizErr } = await sb
    .from("course_quizzes")
    .select("id, name, total_questions, question_order")
    .eq("id", attempt.quiz_id)
    .maybeSingle();
  if (quizErr) throw new Error(quizErr.message);
  if (!quiz) throw new Error("Quiz not found");

  // 3. Questions for this quiz, in stored order.
  const { data: questionRows, error: qErr } = await sb
    .from("questions")
    .select("id, question, correct_answer, concept_id, options, order_index")
    .eq("course_quiz_id", attempt.quiz_id)
    .order("order_index", { ascending: true });
  if (qErr) throw new Error(qErr.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const questions = (questionRows ?? []) as any[];
  const questionIds = questions.map((q) => q.id);

  // 4. Relational options, grouped by question_id.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const optionsByQuestion = new Map<string, any[]>();
  if (questionIds.length > 0) {
    const { data: optionRows, error: oErr } = await sb
      .from("question_options")
      .select(
        "id, question_id, option_index, option_text, is_correct, explanation",
      )
      .in("question_id", questionIds);
    if (oErr) throw new Error(oErr.message);
    for (const row of optionRows ?? []) {
      const arr = optionsByQuestion.get(row.question_id) ?? [];
      arr.push(row);
      optionsByQuestion.set(row.question_id, arr);
    }
  }

  // 5. The user's answers for this attempt, mapped by question_id.
  const answerByQuestion = new Map<
    string,
    { selected_option_index: number | null; is_correct: boolean }
  >();
  const { data: answerRows, error: aErr } = await sb
    .from("question_attempts")
    .select("question_id, selected_option_index, is_correct")
    .eq("quiz_attempt_id", attemptId);
  if (aErr) throw new Error(aErr.message);
  for (const row of answerRows ?? []) {
    answerByQuestion.set(row.question_id, {
      selected_option_index: row.selected_option_index,
      is_correct: row.is_correct,
    });
  }

  // 6. Concept names (best-effort — concept_name stays null if unavailable).
  const conceptNameById = new Map<string, string>();
  const conceptIds = [
    ...new Set(questions.map((q) => q.concept_id).filter(Boolean)),
  ] as string[];
  if (conceptIds.length > 0) {
    const { data: conceptRows } = await sb
      .from("concepts")
      .select("id, name")
      .in("id", conceptIds);
    for (const row of conceptRows ?? []) {
      conceptNameById.set(row.id, row.name);
    }
  }

  // 7. Order questions: prefer course_quizzes.question_order, fall back to
  //    the order_index sort already applied above.
  const orderList: string[] = Array.isArray(quiz.question_order)
    ? (quiz.question_order as string[])
    : [];
  let orderedQuestions = questions;
  if (orderList.length > 0) {
    const byId = new Map(questions.map((q) => [q.id, q]));
    const inOrder = orderList
      .map((id) => byId.get(id))
      .filter((q): q is (typeof questions)[number] => Boolean(q));
    const seen = new Set(orderList);
    const remaining = questions.filter((q) => !seen.has(q.id));
    orderedQuestions = [...inOrder, ...remaining];
  }

  const resultQuestions: AttemptQuestionResult[] = orderedQuestions.map((q) => {
    let options = (optionsByQuestion.get(q.id) ?? [])
      .slice()
      .sort((a, b) => a.option_index - b.option_index)
      .map((o) => ({
        index: o.option_index as number,
        text: o.option_text as string,
        is_correct: o.is_correct as boolean,
        explanation: (o.explanation ?? null) as string | null,
      }));

    // Fallback: some older questions store options on the questions.options
    // jsonb column instead of the relational table.
    if (options.length === 0 && Array.isArray(q.options) && q.options.length) {
      options = (q.options as unknown[]).map((opt, i) => ({
        index: i,
        text:
          typeof opt === "string"
            ? opt
            : // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ((opt as any)?.option_text ??
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (opt as any)?.text ??
              String(opt)),
        is_correct: i === q.correct_answer,
        explanation: null as string | null,
      }));
    }

    const correctOption = options.find((o) => o.is_correct);
    const correctIndex = correctOption
      ? correctOption.index
      : (q.correct_answer ?? 0);

    const answer = answerByQuestion.get(q.id);
    return {
      question_id: q.id,
      question_text: q.question,
      options,
      selected_option_index: answer ? answer.selected_option_index : null,
      correct_option_index: correctIndex,
      is_correct: answer ? answer.is_correct : false,
      concept_name: q.concept_id
        ? (conceptNameById.get(q.concept_id) ?? null)
        : null,
    };
  });

  const answeredCount =
    attempt.answered_count ??
    resultQuestions.filter((q) => q.selected_option_index !== null).length;
  const correctCount =
    attempt.correct_count ??
    resultQuestions.filter((q) => q.is_correct).length;

  return {
    attempt_id: attempt.id,
    quiz_id: attempt.quiz_id,
    quiz_name: quiz.name,
    course_id: attempt.course_id,
    total_questions: quiz.total_questions ?? resultQuestions.length,
    correct_count: correctCount,
    answered_count: answeredCount,
    completed_at: attempt.completed_at,
    started_at: attempt.started_at,
    questions: resultQuestions,
  };
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
