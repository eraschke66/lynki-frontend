export interface QuestionOption {
  id: string;
  optionText: string;
  optionIndex: number;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  hint?: string;
  difficultyLevel?: "easy" | "medium" | "hard";
  conceptId?: string;
  orderIndex?: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  documentId?: string;
  userId?: string;
  generationStatus: "pending" | "generating" | "completed" | "failed";
  questions: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizListItem {
  id: string;
  title: string;
  description: string;
  documentId?: string;
  documentTitle?: string;
  generationStatus: "pending" | "generating" | "completed" | "failed";
  questionCount: number;
  createdAt: string;
}

export interface QuizAnswer {
  questionId: string;
  selectedOption: number;
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  explanation: string;
  hint?: string;
}

export interface QuizResult {
  attemptId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  questionResults: QuestionResult[];
  completedAt: string;
}
