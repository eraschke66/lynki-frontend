/**
 * Named/generated quiz flow: generate a course_quizzes row, start and resume
 * attempts against it, submit answers, and review a completed attempt.
 */
import type {
  TestData,
  AnswerFeedback,
  GeneratedQuizInfo,
  AttemptResultsData,
  AttemptQuestionResult,
  QuizGenerationStatusRow,
} from "../types";
import { supabase } from "@/lib/supabase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

/**
 * Kick off generation of a fresh named quiz (BKT-guided). Returns as soon as
 * the quiz row is created — generation itself runs as a backend background
 * job, so this resolves in well under a second rather than blocking on
 * Sonnet calls. Poll `fetchQuizGenerationStatus` (or let TestPage's own
 * polling query do it) to know when the quiz is actually ready.
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
 * Poll target for a single quiz's generation status directly from Supabase.
 * TestPage polls this until the row reaches a terminal state ('completed' or
 * 'failed'), then starts the attempt.
 */
export async function fetchQuizGenerationStatus(
  quizId: string,
): Promise<QuizGenerationStatusRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("course_quizzes")
    .select("status, error_message")
    .eq("id", quizId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    status: data.status,
    error_message: data.error_message,
  };
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawRow = any;

/**
 * Build one question's review-page result from the raw rows fetched by
 * fetchAttemptResults. Split out because the option-fallback and
 * correct-index logic below is where nearly all of that function's
 * complexity lived.
 */
function buildQuestionResult(
  q: RawRow,
  optionsByQuestion: Map<string, RawRow[]>,
  answerByQuestion: Map<string, { selected_option_index: number | null; is_correct: boolean }>,
  conceptNameById: Map<string, string>,
): AttemptQuestionResult {
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
          : ((opt as RawRow)?.option_text ?? (opt as RawRow)?.text ?? String(opt)),
      is_correct: i === q.correct_answer,
      explanation: null as string | null,
    }));
  }

  const correctOption = options.find((o) => o.is_correct);
  const correctIndex = correctOption ? correctOption.index : (q.correct_answer ?? 0);

  const answer = answerByQuestion.get(q.id);
  return {
    question_id: q.id,
    question_text: q.question,
    options,
    selected_option_index: answer ? answer.selected_option_index : null,
    correct_option_index: correctIndex,
    is_correct: answer ? answer.is_correct : false,
    concept_name: q.concept_id ? (conceptNameById.get(q.concept_id) ?? null) : null,
  };
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
  const questions = (questionRows ?? []) as RawRow[];
  const questionIds = questions.map((q) => q.id);

  // 4. Relational options, grouped by question_id.
  const optionsByQuestion = new Map<string, RawRow[]>();
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

  const resultQuestions = orderedQuestions.map((q) =>
    buildQuestionResult(q, optionsByQuestion, answerByQuestion, conceptNameById),
  );

  const answeredCount =
    attempt.answered_count ??
    resultQuestions.filter((q) => q.selected_option_index !== null).length;
  const correctCount =
    attempt.correct_count ?? resultQuestions.filter((q) => q.is_correct).length;

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
