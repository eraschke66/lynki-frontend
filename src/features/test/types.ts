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
  course_id: string;
  course_name: string;
  questions: TestQuestion[];
  total_questions: number;
  message?: string;
  /** Present when resuming — number of questions already answered */
  answered_count?: number;
  /** Present when resuming — number already correct */
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
  target_grade: number;
  total_skills: number;
}

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
