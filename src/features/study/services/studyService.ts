import { supabase } from "@/lib/supabase";
import type {
  ConceptMastery,
  TopicProgress,
  DocumentProgress,
  StudySession,
  StudySessionQuestion,
  QuestionAttempt,
  MasteryStatus,
} from "../types";
import { MASTERY_CONFIG } from "../types";

/**
 * Fetch all concepts for a document with user's mastery progress
 */
export async function fetchDocumentProgress(
  documentId: string,
  userId: string
): Promise<DocumentProgress | null> {
  try {
    // Fetch document info
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, title")
      .eq("id", documentId)
      .single();

    if (docError || !document) return null;

    // Fetch all topics and concepts for this document
    const { data: topics, error: topicsError } = await supabase
      .from("topics")
      .select(`
        id,
        name,
        concepts (
          id,
          name,
          explanation
        )
      `)
      .eq("document_id", documentId);

    if (topicsError || !topics) return null;

    // Fetch user's mastery data for all concepts in this document
    const conceptIds = topics.flatMap((t) =>
      (t.concepts as { id: string }[]).map((c) => c.id)
    );

    const { data: masteryData } = await supabase
      .from("user_concept_mastery")
      .select("*")
      .eq("user_id", userId)
      .in("concept_id", conceptIds);

    // Fetch question counts per concept
    const { data: questionCounts } = await supabase
      .from("questions")
      .select("concept_id")
      .in("concept_id", conceptIds);

    const questionCountMap = new Map<string, number>();
    questionCounts?.forEach((q) => {
      if (q.concept_id) {
        questionCountMap.set(
          q.concept_id,
          (questionCountMap.get(q.concept_id) || 0) + 1
        );
      }
    });

    // Create mastery lookup
    const masteryMap = new Map(
      masteryData?.map((m) => [m.concept_id, m]) || []
    );

    // Build topic progress
    const topicProgressList: TopicProgress[] = topics.map((topic) => {
      const concepts = (
        topic.concepts as { id: string; name: string; explanation: string }[]
      ).map((concept): ConceptMastery => {
        const mastery = masteryMap.get(concept.id);
        const attemptCount = mastery?.attempt_count || 0;
        const correctCount = mastery?.correct_count || 0;

        return {
          id: mastery?.id || "",
          conceptId: concept.id,
          conceptName: concept.name,
          conceptExplanation: concept.explanation,
          topicId: topic.id,
          topicName: topic.name,
          documentId,
          status: (mastery?.status as MasteryStatus) || "not_started",
          correctCount,
          attemptCount,
          currentStreak: mastery?.current_streak || 0,
          accuracyPercent:
            attemptCount > 0
              ? Math.round((correctCount / attemptCount) * 100)
              : 0,
          questionCount: questionCountMap.get(concept.id) || 0,
          masteredAt: mastery?.mastered_at || null,
          nextReviewAt: mastery?.next_review_at || null,
          reviewIntervalDays: mastery?.review_interval_days || 1,
          reviewCount: mastery?.review_count || 0,
        };
      });

      const masteredCount = concepts.filter((c) => c.status === "mastered").length;
      const inProgressCount = concepts.filter((c) => c.status === "in_progress").length;

      return {
        topicId: topic.id,
        topicName: topic.name,
        documentId,
        concepts,
        totalConcepts: concepts.length,
        masteredConcepts: masteredCount,
        inProgressConcepts: inProgressCount,
        notStartedConcepts: concepts.length - masteredCount - inProgressCount,
        overallProgress:
          concepts.length > 0
            ? Math.round((masteredCount / concepts.length) * 100)
            : 0,
      };
    });

    const totalConcepts = topicProgressList.reduce(
      (sum, t) => sum + t.totalConcepts,
      0
    );
    const masteredConcepts = topicProgressList.reduce(
      (sum, t) => sum + t.masteredConcepts,
      0
    );

    // Check for concepts due for review
    const now = new Date().toISOString();
    const conceptsDueForReview =
      masteryData?.filter(
        (m) =>
          m.status === "mastered" && m.next_review_at && m.next_review_at <= now
      ).length || 0;

    return {
      documentId,
      documentTitle: document.title,
      topics: topicProgressList,
      totalConcepts,
      masteredConcepts,
      overallProgress:
        totalConcepts > 0
          ? Math.round((masteredConcepts / totalConcepts) * 100)
          : 0,
      isReadyForReview: conceptsDueForReview > 0,
      conceptsDueForReview,
    };
  } catch (error) {
    console.error("Error fetching document progress:", error);
    return null;
  }
}

/**
 * Start a study session for a specific concept
 */
export async function startStudySession(
  conceptId: string,
  userId: string
): Promise<StudySession | null> {
  try {
    // Get concept info
    const { data: concept, error: conceptError } = await supabase
      .from("concepts")
      .select(`
        id,
        name,
        topic_id,
        topics (
          document_id
        )
      `)
      .eq("id", conceptId)
      .single();

    if (conceptError || !concept) return null;

    // Get questions for this concept that user hasn't seen recently
    // (or all if they've seen them all)
    const { data: recentAttempts } = await supabase
      .from("user_question_attempts")
      .select("question_id")
      .eq("user_id", userId)
      .eq("concept_id", conceptId)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const recentQuestionIds = new Set(recentAttempts?.map((a) => a.question_id) || []);

    // Fetch all questions for this concept
    const { data: allQuestions, error: questionsError } = await supabase
      .from("questions")
      .select(`
        id,
        question,
        hint,
        difficulty_level,
        concept_id,
        question_options (
          option_text,
          option_index,
          is_correct,
          explanation
        )
      `)
      .eq("concept_id", conceptId);

    if (questionsError || !allQuestions || allQuestions.length === 0) {
      return null;
    }

    // Prioritize unseen questions, but include seen ones if needed
    let questions = allQuestions.filter((q) => !recentQuestionIds.has(q.id));
    if (questions.length < MASTERY_CONFIG.MAX_QUESTIONS_PER_SESSION) {
      const seenQuestions = allQuestions.filter((q) =>
        recentQuestionIds.has(q.id)
      );
      questions = [...questions, ...seenQuestions];
    }

    // Shuffle and limit
    questions = shuffleArray(questions).slice(
      0,
      MASTERY_CONFIG.MAX_QUESTIONS_PER_SESSION
    );

    // Format questions
    const sessionQuestions: StudySessionQuestion[] = questions.map((q) => {
      const options = (q.question_options as {
        option_text: string;
        option_index: number;
        is_correct: boolean;
        explanation: string;
      }[]).sort((a, b) => a.option_index - b.option_index);

      const correctIndex = options.findIndex((o) => o.is_correct);

      return {
        id: q.id,
        question: q.question,
        options: options.map((o) => o.option_text),
        correctAnswer: correctIndex,
        explanation: options.find((o) => o.is_correct)?.explanation,
        hint: q.hint || undefined,
        difficultyLevel: q.difficulty_level as "easy" | "medium" | "hard",
        conceptId: q.concept_id!,
        conceptName: concept.name,
      };
    });

    // Get current mastery state
    const { data: mastery } = await supabase
      .from("user_concept_mastery")
      .select("correct_count")
      .eq("user_id", userId)
      .eq("concept_id", conceptId)
      .single();

    const currentCorrect = mastery?.correct_count || 0;
    const remainingToMaster = Math.max(0, MASTERY_CONFIG.CORRECT_TO_MASTER - currentCorrect);

    return {
      sessionId: crypto.randomUUID(),
      conceptId,
      conceptName: concept.name,
      documentId: (concept.topics as { document_id: string }).document_id,
      questions: sessionQuestions,
      currentQuestionIndex: 0,
      correctCount: 0,
      attemptCount: 0,
      masteryThreshold: remainingToMaster,
      isComplete: false,
      isMastered: false,
    };
  } catch (error) {
    console.error("Error starting study session:", error);
    return null;
  }
}

/**
 * Record a question attempt and update mastery
 */
export async function recordQuestionAttempt(
  userId: string,
  attempt: QuestionAttempt,
  sessionId: string
): Promise<{
  newStreak: number;
  newCorrectCount: number;
  isMastered: boolean;
  newStatus: MasteryStatus;
}> {
  try {
    // Record the attempt
    await supabase.from("user_question_attempts").insert({
      user_id: userId,
      question_id: attempt.questionId,
      concept_id: attempt.conceptId,
      selected_option: attempt.selectedOption,
      is_correct: attempt.isCorrect,
      time_spent_ms: attempt.timeSpentMs,
      session_id: sessionId,
    });

    // Get or create mastery record
    const { data: existingMastery } = await supabase
      .from("user_concept_mastery")
      .select("*")
      .eq("user_id", userId)
      .eq("concept_id", attempt.conceptId)
      .single();

    let newStreak = attempt.isCorrect ? (existingMastery?.current_streak || 0) + 1 : 0;
    let newCorrectCount = (existingMastery?.correct_count || 0) + (attempt.isCorrect ? 1 : 0);
    let newAttemptCount = (existingMastery?.attempt_count || 0) + 1;

    // Determine new status
    let newStatus: MasteryStatus = "in_progress";
    let masteredAt: string | null = existingMastery?.mastered_at || null;
    let nextReviewAt: string | null = existingMastery?.next_review_at || null;
    let reviewIntervalDays = existingMastery?.review_interval_days || 1;

    if (newCorrectCount >= MASTERY_CONFIG.CORRECT_TO_MASTER) {
      newStatus = "mastered";
      if (!masteredAt) {
        masteredAt = new Date().toISOString();
        // Schedule first review
        nextReviewAt = new Date(
          Date.now() + reviewIntervalDays * 24 * 60 * 60 * 1000
        ).toISOString();
      }
    }

    // Upsert mastery record
    if (existingMastery) {
      await supabase
        .from("user_concept_mastery")
        .update({
          status: newStatus,
          correct_count: newCorrectCount,
          attempt_count: newAttemptCount,
          current_streak: newStreak,
          mastered_at: masteredAt,
          next_review_at: nextReviewAt,
          review_interval_days: reviewIntervalDays,
        })
        .eq("id", existingMastery.id);
    } else {
      await supabase.from("user_concept_mastery").insert({
        user_id: userId,
        concept_id: attempt.conceptId,
        status: newStatus,
        correct_count: newCorrectCount,
        attempt_count: newAttemptCount,
        current_streak: newStreak,
        mastered_at: masteredAt,
        next_review_at: nextReviewAt,
        review_interval_days: reviewIntervalDays,
      });
    }

    return {
      newStreak,
      newCorrectCount,
      isMastered: newStatus === "mastered",
      newStatus,
    };
  } catch (error) {
    console.error("Error recording question attempt:", error);
    throw error;
  }
}

/**
 * Get the next concept to study (prioritizes weak areas)
 */
export async function getNextConceptToStudy(
  documentId: string,
  userId: string
): Promise<string | null> {
  try {
    const progress = await fetchDocumentProgress(documentId, userId);
    if (!progress) return null;

    // Flatten all concepts
    const allConcepts = progress.topics.flatMap((t) => t.concepts);

    // Filter to concepts that have questions
    const studyableConcepts = allConcepts.filter((c) => c.questionCount > 0);

    if (studyableConcepts.length === 0) return null;

    // Priority order:
    // 1. In-progress concepts (continue what they started)
    // 2. Not started concepts
    // 3. Mastered concepts due for review

    const inProgress = studyableConcepts.filter((c) => c.status === "in_progress");
    if (inProgress.length > 0) {
      // Return the one with lowest accuracy (most struggling)
      return inProgress.sort((a, b) => a.accuracyPercent - b.accuracyPercent)[0]
        .conceptId;
    }

    const notStarted = studyableConcepts.filter((c) => c.status === "not_started");
    if (notStarted.length > 0) {
      return notStarted[0].conceptId;
    }

    // Check for reviews
    const now = new Date().toISOString();
    const dueForReview = studyableConcepts.filter(
      (c) => c.status === "mastered" && c.nextReviewAt && c.nextReviewAt <= now
    );
    if (dueForReview.length > 0) {
      return dueForReview[0].conceptId;
    }

    // All mastered and no reviews due
    return null;
  } catch (error) {
    console.error("Error getting next concept:", error);
    return null;
  }
}

/**
 * Complete a review session and update review schedule
 */
export async function completeReview(
  userId: string,
  conceptId: string,
  wasSuccessful: boolean
): Promise<void> {
  try {
    const { data: mastery } = await supabase
      .from("user_concept_mastery")
      .select("*")
      .eq("user_id", userId)
      .eq("concept_id", conceptId)
      .single();

    if (!mastery) return;

    let newIntervalDays = mastery.review_interval_days;
    let newReviewCount = mastery.review_count + 1;

    if (wasSuccessful) {
      // Increase interval (spaced repetition)
      const intervalIndex = MASTERY_CONFIG.REVIEW_INTERVALS.findIndex(
        (i) => i >= mastery.review_interval_days
      );
      if (intervalIndex < MASTERY_CONFIG.REVIEW_INTERVALS.length - 1) {
        newIntervalDays = MASTERY_CONFIG.REVIEW_INTERVALS[intervalIndex + 1];
      }
    } else {
      // Reset to shorter interval
      newIntervalDays = MASTERY_CONFIG.REVIEW_INTERVALS[0];
    }

    const nextReviewAt = new Date(
      Date.now() + newIntervalDays * 24 * 60 * 60 * 1000
    ).toISOString();

    await supabase
      .from("user_concept_mastery")
      .update({
        review_interval_days: newIntervalDays,
        review_count: newReviewCount,
        next_review_at: nextReviewAt,
      })
      .eq("id", mastery.id);
  } catch (error) {
    console.error("Error completing review:", error);
  }
}

// Utility function
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
