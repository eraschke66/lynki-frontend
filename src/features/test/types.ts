/**
 * Types for the Test feature.
 */

export interface TestQuestionOption {
  id: string;
  text: string;
  index: number;
  is_correct: boolean;
  explanation: string;
}

export interface TestQuestion {
  id: string;
  question: string;
  concept_id: string | null;
  concept_name: string;
  difficulty_level: string;
  options: TestQuestionOption[];
}

export interface TestData {
  test_id: string;
  quiz_id?: string;
  course_id: string;
  course_name: string;
  questions: TestQuestion[];
  total_questions: number;
  message?: string;
  answered_count?: number;
  correct_count?: number;
}

export interface AnswerFeedback {
  question_id: string;
  concept_id: string | null;
  is_correct: boolean;
  correct_option_index: number;
  correct_option_text: string;
  explanation: string;
  selected_option_index: number;
  p_mastery_before: number;
  p_mastery_after: number;
  is_newly_mastered: boolean;
  mastery_threshold: number;
}

export interface PassChanceData {
  course_id: string;
  pass_probability: number | null;
  avg_mastery: number | null;
  target_grade: number;
  total_skills: number;
}

/** A generated quiz belonging to a course+user. */
export interface CourseQuiz {
  id: string;
  name: string;
  total_questions: number;
  created_at: string;
  quiz_attempts: QuizAttemptSummary[];
}

/** Summary of a single attempt on a quiz (used in CourseDetailPage list). */
export interface QuizAttemptSummary {
  id: string;
  status: "in_progress" | "completed";
  answered_count: number;
  correct_count: number;
  pass_chance: number | null;
  started_at: string;
  completed_at: string | null;
}

/** Response from POST /quiz-sessions/generate */
export interface GeneratedQuizInfo {
  quiz_id: string;
  name: string;
  total_questions: number;
  course_id: string;
}

/**
 * Lifecycle of the AI question-bank build on `quizzes.generation_status`.
 *
 * "failed" is not only set by the generator giving up — a pg_cron sweep
 * (`sweep_stale_quiz_generations(15)`, every 5 minutes) marks anything still
 * "pending"/"generating" after 15 minutes as failed. So a student can land on
 * a failed quiz that never reported an error, and the UI has to offer a retry
 * rather than spin forever.
 */
export type QuizGenerationStatus =
  | "pending"
  | "generating"
  | "completed"
  | "failed";

/** Latest question-bank build for a course. */
export interface QuizGeneration {
  id: string;
  status: QuizGenerationStatus;
  createdAt: string;
}

/** Legacy — used by test_sessions-backed history (deprecated, kept for compatibility) */
export interface TestSession {
  id: string;
  status: "in_progress" | "completed";
  total_questions: number;
  correct_count: number;
  answered_count: number;
  pass_chance: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface TestHistoryData {
  sessions: TestSession[];
  total: number;
}

/** A single question's result within a completed attempt (v1 review page). */
export interface AttemptQuestionResult {
  question_id: string;
  question_text: string;
  options: Array<{ index: number; text: string; is_correct: boolean; explanation: string | null }>;
  selected_option_index: number | null; // null if the question wasn't answered
  correct_option_index: number;
  is_correct: boolean;
  concept_name: string | null;
}

/** Full payload for the attempt results review page. */
export interface AttemptResultsData {
  attempt_id: string;
  quiz_id: string;
  quiz_name: string;
  course_id: string;
  total_questions: number;
  correct_count: number;
  answered_count: number;
  completed_at: string | null;
  started_at: string;
  questions: AttemptQuestionResult[];
}
