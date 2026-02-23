/**
 * Types for the BKT-driven adaptive learning system.
 *
 * BKT (Bayesian Knowledge Tracing) is now the single source of truth for mastery.
 * The frontend is a thin client — sessions come from the backend, answers are
 * validated server-side, and mastery is tracked via p_mastery probabilities.
 */

export type MasteryStatus = "not_started" | "in_progress" | "mastered";

// ---------------------------------------------------------------------------
// BKT Configuration (mirrors backend constants — keep in sync)
// ---------------------------------------------------------------------------

export const BKT_CONFIG = {
  // p_mastery threshold for "mastered" status (adjustable, see backend service.py)
  MASTERY_THRESHOLD: 0.85,
} as const;

// ---------------------------------------------------------------------------
// Progress types (from GET /bkt/progress/:userId/:courseId)
// ---------------------------------------------------------------------------

export interface ConceptProgress {
  concept_id: string;
  concept_name: string;
  explanation: string;
  p_mastery: number; // 0.0 - 1.0
  n_attempts: number;
  n_correct: number;
  status: MasteryStatus;
  is_mastered: boolean;
  question_count: number;
}

export interface TopicProgress {
  topic_id: string;
  topic_name: string;
  status: MasteryStatus;
  concepts: ConceptProgress[];
  total_concepts: number;
  mastered_concepts: number;
  overall_progress: number; // 0-100
}

export interface CourseProgress {
  course_id: string;
  course_title: string;
  topics: TopicProgress[];
  total_concepts: number;
  mastered_concepts: number;
  overall_progress: number; // 0-100
  mastery_threshold: number;
}

// ---------------------------------------------------------------------------
// Session types (from GET /bkt/session/:userId/:courseId)
// ---------------------------------------------------------------------------

export interface SessionQuestionOption {
  id: string;
  text: string;
  index: number;
}

export interface SessionQuestion {
  id: string;
  question: string;
  hint?: string | null;
  difficulty_level: string;
  concept_id?: string | null;
  concept_name: string;
  options: SessionQuestionOption[];
}

export interface SessionConceptSummary {
  concept_id: string;
  concept_name: string;
  p_mastery: number;
  n_attempts: number;
}

export interface BKTSession {
  session_id: string;
  questions: SessionQuestion[];
  concepts: SessionConceptSummary[];
  total_questions: number;
  all_mastered: boolean;
}

// ---------------------------------------------------------------------------
// Answer types (from POST /bkt/answer)
// ---------------------------------------------------------------------------

export interface AnswerRequest {
  user_id: string;
  question_id: string;
  course_id: string;
  selected_option_index: number;
  session_id?: string;
  time_spent_ms?: number;
}

export interface AnswerResult {
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

// ---------------------------------------------------------------------------
// Legacy types (kept temporarily for old quiz flow compatibility)
// ---------------------------------------------------------------------------

export interface QuestionAttempt {
  questionId: string;
  conceptId: string;
  selectedOption: number;
  isCorrect: boolean;
  timeSpentMs?: number;
}

/** @deprecated Use BKT_CONFIG instead */
export const MASTERY_CONFIG = {
  CORRECT_TO_MASTER: 3,
  MAX_QUESTIONS_PER_SESSION: 10,
  REVIEW_INTERVALS: [1, 3, 7, 14, 30, 60],
} as const;
