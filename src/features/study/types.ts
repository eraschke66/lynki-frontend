/**
 * Types for the study/mastery feature
 */

export type MasteryStatus = "not_started" | "in_progress" | "mastered";

export interface ConceptMastery {
  id: string;
  conceptId: string;
  conceptName: string;
  conceptExplanation: string;
  topicId: string;
  topicName: string;
  documentId: string;
  status: MasteryStatus;
  correctCount: number;
  attemptCount: number;
  currentStreak: number;
  accuracyPercent: number;
  questionCount: number;
  masteredAt: string | null;
  nextReviewAt: string | null;
  reviewIntervalDays: number;
  reviewCount: number;
}

export interface TopicProgress {
  topicId: string;
  topicName: string;
  documentId: string;
  concepts: ConceptMastery[];
  totalConcepts: number;
  masteredConcepts: number;
  inProgressConcepts: number;
  notStartedConcepts: number;
  overallProgress: number; // 0-100
}

export interface DocumentProgress {
  documentId: string;
  documentTitle: string;
  topics: TopicProgress[];
  totalConcepts: number;
  masteredConcepts: number;
  overallProgress: number;
  isReadyForReview: boolean;
  conceptsDueForReview: number;
}

export interface StudySessionQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  hint?: string;
  difficultyLevel: "easy" | "medium" | "hard";
  conceptId: string;
  conceptName: string;
}

export interface StudySession {
  sessionId: string;
  conceptId: string;
  conceptName: string;
  documentId: string;
  questions: StudySessionQuestion[];
  currentQuestionIndex: number;
  correctCount: number;
  attemptCount: number;
  masteryThreshold: number; // Number of correct answers needed to master
  isComplete: boolean;
  isMastered: boolean;
}

export interface QuestionAttempt {
  questionId: string;
  conceptId: string;
  selectedOption: number;
  isCorrect: boolean;
  timeSpentMs?: number;
}

// Constants for mastery algorithm
export const MASTERY_CONFIG = {
  // Number of correct answers needed to master a concept
  CORRECT_TO_MASTER: 3,
  // Max questions per study session (to prevent frustration)
  MAX_QUESTIONS_PER_SESSION: 10,
  // Spaced repetition intervals (in days)
  REVIEW_INTERVALS: [1, 3, 7, 14, 30, 60],
} as const;
