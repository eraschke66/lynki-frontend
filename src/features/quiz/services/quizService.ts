import { supabase } from "@/lib/supabase";
import type { Quiz, QuizListItem, QuizAnswer, QuizResult } from "@/types/quiz";
import type { Database } from "@/types/database";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// -----------------------------
// Supabase query result types
// -----------------------------
type QuizWithRelations = {
  id: string;
  title: string;
  description: string;
  document_id: string | null;
  generation_status: "pending" | "generating" | "completed" | "failed";
  created_at: string;
  documents: { title: string } | null;
  questions: { id: string }[];
};

type QuestionOption = {
  id: string;
  option_text: string;
  option_index: number;
  is_correct: boolean;
  explanation: string;
};

type QuizQuestion = {
  id: string;
  question: string;
  hint: string | null;
  difficulty_level: "easy" | "medium" | "hard";
  concept_id: string | null;
  order_index: number;
  question_options: QuestionOption[];
};

type FullQuizResponse = {
  id: string;
  title: string;
  description: string;
  document_id: string | null;
  user_id: string | null;
  generation_status: "pending" | "generating" | "completed" | "failed";
  created_at: string;
  updated_at: string;
  questions: QuizQuestion[];
};

// -----------------------------
// BKT payloads
// -----------------------------
type BktBatchUpdatePayload = {
  user_id: string;
  document_id: string;
  updates: Array<{ question_id: string; claude_score: number }>; // 0..100
};

async function postBktBatchUpdate(payload: BktBatchUpdatePayload): Promise<void> {
  const res = await fetch(`${API_URL}/bkt/update-batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch {
      bodyText = "";
    }
    throw new Error(
      `BKT batch failed (${res.status} ${res.statusText}) ${bodyText ? `- ${bodyText}` : ""}`,
    );
  }
}

/**
 * Fetch all quizzes for a user directly from Supabase.
 */
export async function fetchUserQuizzes(userId: string): Promise<QuizListItem[]> {
  try {
    const { data, error } = await supabase
      .from("quizzes")
      .select(
        `
        id,
        title,
        description,
        document_id,
        generation_status,
        created_at,
        documents ( title ),
        questions ( id )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((quiz: QuizWithRelations) => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      documentId: quiz.document_id ?? undefined,
      documentTitle: quiz.documents?.title ?? undefined,
      generationStatus: quiz.generation_status,
      questionCount: quiz.questions?.length ?? 0,
      createdAt: quiz.created_at,
    }));
  } catch (error) {
    console.error("Error fetching user quizzes:", error);
    throw error;
  }
}

/**
 * Fetch quiz for a specific document directly from Supabase.
 */
export async function fetchDocumentQuiz(documentId: string): Promise<QuizListItem | null> {
  try {
    const { data, error } = await supabase
      .from("quizzes")
      .select(
        `
        id,
        title,
        description,
        document_id,
        generation_status,
        created_at,
        documents ( title ),
        questions ( id )
      `,
      )
      .eq("document_id", documentId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    if (!data) return null;

    const typed = data as unknown as QuizWithRelations;

    return {
      id: typed.id,
      title: typed.title,
      description: typed.description,
      documentId: typed.document_id ?? undefined,
      documentTitle: typed.documents?.title ?? undefined,
      generationStatus: typed.generation_status,
      questionCount: typed.questions?.length ?? 0,
      createdAt: typed.created_at,
    };
  } catch (error) {
    console.error("Error fetching document quiz:", error);
    throw error;
  }
}

/**
 * Fetch full quiz with all questions and options directly from Supabase.
 */
export async function fetchQuiz(quizId: string): Promise<Quiz> {
  try {
    const { data: quiz, error } = await supabase
      .from("quizzes")
      .select(
        `
        id,
        title,
        description,
        document_id,
        user_id,
        generation_status,
        created_at,
        updated_at,
        questions (
          id,
          question,
          hint,
          difficulty_level,
          concept_id,
          order_index,
          question_options (
            id,
            option_text,
            option_index,
            is_correct,
            explanation
          )
        )
      `,
      )
      .eq("id", quizId)
      .single();

    if (error) throw error;
    if (!quiz) throw new Error("Quiz not found");

    const typedQuiz = quiz as unknown as FullQuizResponse;

    return {
      id: typedQuiz.id,
      title: typedQuiz.title,
      description: typedQuiz.description,
      documentId: typedQuiz.document_id ?? undefined,
      userId: typedQuiz.user_id ?? undefined,
      generationStatus: typedQuiz.generation_status,
      questions: (typedQuiz.questions || [])
        .sort((a, b) => a.order_index - b.order_index)
        .map((q) => {
          const options = (q.question_options || []).sort((a, b) => a.option_index - b.option_index);
          const correctOption = options.find((opt) => opt.is_correct);
          return {
            id: q.id,
            question: q.question,
            options: options.map((opt) => opt.option_text),
            correctAnswer: correctOption?.option_index ?? 0,
            explanation: correctOption?.explanation,
            hint: q.hint ?? undefined,
            difficultyLevel: q.difficulty_level,
            conceptId: q.concept_id ?? undefined,
            orderIndex: q.order_index,
          };
        }),
      createdAt: typedQuiz.created_at,
      updatedAt: typedQuiz.updated_at,
    };
  } catch (error) {
    console.error("Error fetching quiz:", error);
    throw error;
  }
}

/**
 * Submit quiz attempt and get results.
 * BKT is sent ONCE (batch) and is NON-FATAL.
 */
export async function submitQuizAttempt(
  quizId: string,
  userId: string,
  answers: QuizAnswer[],
): Promise<QuizResult> {
  try {
    const quiz = await fetchQuiz(quizId);

    const questionResults = answers.map((answer) => {
      const question = quiz.questions.find((q) => q.id === answer.questionId);
      if (!question) throw new Error(`Question ${answer.questionId} not found`);
      const isCorrect = question.correctAnswer === answer.selectedOption;

      return {
        questionId: question.id,
        questionText: question.question,
        selectedOptionIndex: answer.selectedOption,
        correctOptionIndex: question.correctAnswer,
        isCorrect,
        explanation: question.explanation ?? "",
        hint: question.hint,
      };
    });

    const score = questionResults.filter((r) => r.isCorrect).length;
    const percentage = (score / quiz.questions.length) * 100;

    // -----------------------------
    // BKT (batch) - non fatal
    // -----------------------------
    const documentId = quiz.documentId;
    if (!documentId) {
      console.warn("BKT skipped: quiz.documentId missing (quizId=%s)", quizId);
    } else {
      const payload: BktBatchUpdatePayload = {
        user_id: userId,
        document_id: documentId,
        updates: questionResults.map((r) => ({
          question_id: r.questionId,
          claude_score: r.isCorrect ? 100 : 0,
        })),
      };

      try {
        await postBktBatchUpdate(payload);
      } catch (e) {
        console.error(
          `BKT batch failed (quizId=${quizId}, userId=${userId}, updates=${payload.updates.length})`,
          e,
        );
        // DO NOT throw.
      }
    }

    // Save attempt
    const { data: attempt, error } = await supabase
      .from("user_quiz_attempts")
      .insert({
        user_id: userId,
        quiz_id: quizId,
        score,
        total_questions: quiz.questions.length,
        answers: JSON.parse(JSON.stringify(answers)),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      attemptId: attempt.id,
      quizId,
      score,
      totalQuestions: quiz.questions.length,
      percentage,
      questionResults,
      completedAt: attempt.completed_at,
    };
  } catch (error) {
    console.error("Error submitting quiz attempt:", error);
    throw error;
  }
}

/**
 * Fetch quiz attempt history directly from Supabase.
 */
export async function fetchQuizAttempts(
  userId: string,
  quizId: string,
): Promise<Array<{ id: string; score: number; totalQuestions: number; percentage: number; completedAt: string }>> {
  try {
    const { data, error } = await supabase
      .from("user_quiz_attempts")
      .select("id, score, total_questions, completed_at")
      .eq("user_id", userId)
      .eq("quiz_id", quizId)
      .order("completed_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((attempt) => ({
      id: attempt.id,
      score: attempt.score,
      totalQuestions: attempt.total_questions,
      percentage: (attempt.score / attempt.total_questions) * 100,
      completedAt: attempt.completed_at,
    }));
  } catch (error) {
    console.error("Error fetching quiz attempts:", error);
    throw error;
  }
}

/**
 * Trigger manual quiz generation for a document (uses FastAPI for processing).
 */
export async function triggerQuizGeneration(
  documentId: string,
  questionsPerConcept: number = 3,
): Promise<{ quizId: string; status: string; message: string }> {
  try {
    const response = await fetch(`${API_URL}/quizzes/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document_id: documentId,
        questions_per_concept: questionsPerConcept,
        include_hints: true,
      }),
    });

    if (!response.ok) throw new Error("Failed to trigger quiz generation");

    const data = await response.json();
    return { quizId: data.quiz_id, status: data.status, message: data.message };
  } catch (error) {
    console.error("Error triggering quiz generation:", error);
    throw error;
  }
}

/**
 * Subscribe to quiz generation status updates.
 */
export function subscribeToQuizUpdates(documentId: string, callback: (quiz: QuizListItem) => void) {
  const channel = supabase
    .channel(`quiz-updates-${documentId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "quizzes", filter: `document_id=eq.${documentId}` },
      async (payload) => {
        if (payload.new) {
          const data = payload.new as Database["public"]["Tables"]["quizzes"]["Row"];

          let questionCount = 0;
          if (data.generation_status === "completed") {
            try {
              const { count } = await supabase
                .from("questions")
                .select("id", { count: "exact", head: true })
                .eq("quiz_id", data.id);
              questionCount = count ?? 0;
            } catch {
              // ignore
            }
          }

          callback({
            id: data.id,
            title: data.title,
            description: data.description,
            documentId: data.document_id ?? undefined,
            documentTitle: undefined,
            generationStatus: data.generation_status,
            questionCount,
            createdAt: data.created_at,
          });
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Calculate quiz score from answers.
 */
export function calculateQuizScore(quiz: Quiz, answers: QuizAnswer[]): number {
  return answers.reduce((score, answer) => {
    const question = quiz.questions.find((q) => q.id === answer.questionId);
    return question && question.correctAnswer === answer.selectedOption ? score + 1 : score;
  }, 0);
}
