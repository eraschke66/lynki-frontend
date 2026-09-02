import { reportError } from "@/lib/sentry";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { topicQuizQueryKeys, gardenQueryKeys } from "@/lib/queryKeys";
import { posthog } from "@/lib/posthog";
import {
  fetchTopicQuizSession,
  submitTopicQuizAnswer,
  completeTopicQuiz,
} from "../services/topicQuizService";
import type {
  AnswerResult,
  TopicQuizSession as TopicQuizSessionData,
} from "../services/topicQuizService";

export interface LocalFeedback extends AnswerResult {
  selected_option: number;
}

export interface TopicQuizCompletionResult {
  correct: number;
  total: number;
  question_ids: string[];
}

/**
 * All state, data-fetching and mutation logic for a single topic-quiz
 * session, shared by the standalone and embedded rendering modes.
 * TopicQuizSession itself only decides which screen to render from this.
 */
export function useTopicQuizSession({
  courseId,
  topicId,
  onComplete,
  embedded,
}: {
  courseId: string;
  topicId: string;
  onComplete?: (result: TopicQuizCompletionResult) => void;
  embedded: boolean;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const resumeApplied = useRef(false);
  const quizStartedRef = useRef(false);
  const completionFiredRef = useRef(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<LocalFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const queryKey = topicQuizQueryKeys.session(courseId, topicId, user?.id ?? "");

  const { data: session, isLoading, error, refetch } = useQuery<TopicQuizSessionData>({
    queryKey,
    queryFn: () => fetchTopicQuizSession(user!.id, courseId, topicId),
    enabled: !!user && !!courseId && !!topicId,
    staleTime: Infinity,
    // Surface failures fast so the user gets the error UI instead of a
    // silently-retrying load. Was unbounded; that's how V19 stuck at the
    // "Preparing fresh soil…" screen on a backend hiccup at the connections-
    // to-quiz transition.
    retry: 1,
    select: (data) => {
      if (!resumeApplied.current && data.current_index > 0) {
        resumeApplied.current = true;
        setCurrentIndex(data.current_index);
        setCorrectCount(data.correct_count);
      }
      if (!sessionId && data.id) {
        setSessionId(data.id);
      }
      if (!quizStartedRef.current && data.questions?.length) {
        quizStartedRef.current = true;
        posthog.capture("topic_quiz_started", {
          course_id: courseId,
          topic_id: topicId,
          resumed: data.current_index > 0,
          embedded,
        });
      }
      return data;
    },
  });

  const questions = useMemo(() => session?.questions ?? [], [session?.questions]);

  // Surface a manual retry after 30s of loading so a hung backend doesn't
  // strand the user on the embed loader. Used by the embedded path only —
  // the standalone GardenVideoLoader has its own affordances.
  const [showSlowLink, setShowSlowLink] = useState(false);
  useEffect(() => {
    if (!isLoading) {
      setShowSlowLink(false);
      return;
    }
    const id = window.setTimeout(() => setShowSlowLink(true), 30_000);
    return () => window.clearTimeout(id);
  }, [isLoading]);
  const currentQuestion = questions[currentIndex] ?? null;
  const totalQuestions = questions.length;

  const handleSelectOption = useCallback(
    async (optionIndex: number) => {
      if (feedback || submitting || !currentQuestion || !sessionId) return;
      setSelectedOption(optionIndex);
      setSubmitting(true);
      try {
        const result = await submitTopicQuizAnswer(sessionId, currentIndex, optionIndex);
        const localFeedback: LocalFeedback = { ...result, selected_option: optionIndex };
        setFeedback(localFeedback);
        if (result.is_correct) setCorrectCount((prev) => prev + 1);
      } catch (err) {
        reportError("Failed to submit answer:", err);
        setSelectedOption(null);
      } finally {
        setSubmitting(false);
      }
    },
    [feedback, submitting, currentQuestion, sessionId, currentIndex],
  );

  const handleNext = useCallback(async () => {
    if (currentIndex + 1 >= totalQuestions) {
      posthog.capture("topic_quiz_completed", {
        course_id: courseId,
        topic_id: topicId,
        questions_answered: totalQuestions,
        correct_count: correctCount,
        embedded,
      });
      if (sessionId) {
        completeTopicQuiz(sessionId).catch((err) =>
          reportError("Failed to complete topic quiz:", err),
        );
      }
      if (user) {
        queryClient.invalidateQueries({ queryKey: gardenQueryKeys.progress(courseId, user.id) });
      }
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      if (!completionFiredRef.current) {
        completionFiredRef.current = true;
        onComplete?.({
          correct: correctCount,
          total: totalQuestions,
          question_ids: questions.map((q) => q.id),
        });
      }

      if (!embedded) {
        setQuizComplete(true);
      }
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setFeedback(null);
  }, [
    currentIndex,
    totalQuestions,
    sessionId,
    courseId,
    topicId,
    correctCount,
    questions,
    user,
    queryClient,
    onComplete,
    embedded,
  ]);

  const handleStudyAgain = useCallback(() => {
    queryClient.removeQueries({ queryKey });
    resumeApplied.current = false;
    completionFiredRef.current = false;
    setCurrentIndex(0);
    setSelectedOption(null);
    setFeedback(null);
    setCorrectCount(0);
    setQuizComplete(false);
    setSessionId(null);
    refetch();
  }, [queryClient, queryKey, refetch]);

  return {
    session,
    isLoading,
    error,
    refetch,
    showSlowLink,
    questions,
    currentQuestion,
    totalQuestions,
    currentIndex,
    selectedOption,
    feedback,
    submitting,
    correctCount,
    quizComplete,
    handleSelectOption,
    handleNext,
    handleStudyAgain,
  };
}
