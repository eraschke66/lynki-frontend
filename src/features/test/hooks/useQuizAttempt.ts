import { reportError } from "@/lib/sentry";
import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import {
  startQuizAttempt,
  resumeQuizAttempt,
  submitQuizAnswer,
  completeQuizAttempt,
  fetchQuizGenerationStatus,
} from "../services/quizAttemptService";
import { submitBktAnswer, fetchBktSession } from "../services/bktSessionService";
import { fetchPassChance } from "../services/passChanceService";
import {
  courseQueryKeys,
  testQueryKeys,
  profileQueryKeys,
  gardenQueryKeys,
} from "@/lib/queryKeys";
import { posthog } from "@/lib/posthog";
import { fetchProfile } from "@/features/settings";
import { supabase } from "@/lib/supabase";
import type { AnswerFeedback } from "../types";

/**
 * All state, data-fetching and mutation logic for a single quiz attempt —
 * across every mode TestPage supports (BKT topic session, quiz attempt
 * start/resume). TestPage itself only decides which screen to render from
 * what this returns.
 */
export function useQuizAttempt() {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const quizId = searchParams.get("quiz");
  const attemptId = searchParams.get("attempt");
  const topicId = searchParams.get("topicId");
  const fromParam = searchParams.get("from"); // V13: source page so X button returns there
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const resumeApplied = useRef(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [, setAnsweredCount] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [passChance, setPassChance] = useState<number | null>(null);
  const [passChanceBefore, setPassChanceBefore] = useState<number | null>(null);
  const [targetGrade, setTargetGrade] = useState<number>(1.0);
  const [loadingPassChance, setLoadingPassChance] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Determine query key and fetcher based on params
  const queryKey = topicId
    ? [...testQueryKeys.all, "focused", courseId, topicId]
    : quizId && attemptId
      ? testQueryKeys.resumeAttempt(attemptId)
      : quizId
        ? testQueryKeys.quizAttempt(quizId, user?.id ?? "")
        : testQueryKeys.quiz(courseId ?? "", user?.id ?? "");

  const queryFn = () => {
    if (topicId) return fetchBktSession(user!.id, courseId!, topicId);
    if (quizId && attemptId) return resumeQuizAttempt(user!.id, attemptId);
    if (quizId) return startQuizAttempt(user!.id, quizId, courseId!);
    // Unreachable: `enabled` below requires topicId or quizId to be set.
    throw new Error("useQuizAttempt: no quiz mode specified in URL");
  };

  // A freshly-generated quiz (quizId present, no attemptId yet) is generated
  // as a backend background job — poll course_quizzes.status directly rather
  // than block on the generate request, and start the attempt once the job
  // reaches a terminal state. This poll is the only latency the frontend adds
  // to generation, so the interval stays well under the time a single
  // question takes to generate.
  const isFreshQuiz = !!quizId && !attemptId;
  const { data: generationStatus, isLoading: isLoadingGenerationStatus } =
    useQuery({
      queryKey: testQueryKeys.quizGenerationStatus(quizId ?? ""),
      queryFn: () => fetchQuizGenerationStatus(quizId!),
      enabled: isFreshQuiz,
      refetchInterval: (query) =>
        query.state.data?.status === "generating" ? 1000 : false,
    });
  const quizStillGenerating =
    isFreshQuiz &&
    (isLoadingGenerationStatus || generationStatus?.status === "generating");
  const quizGenerationFailed =
    isFreshQuiz && generationStatus?.status === "failed";

  const {
    data: testData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn,
    enabled:
      !!user &&
      !!courseId &&
      (!!quizId || !!topicId) &&
      !quizStillGenerating &&
      !quizGenerationFailed,
    // The fresh-quiz queryFn POSTs /quiz-attempts/start, which creates an
    // attempt row — a refetch would create a duplicate attempt. Never refetch
    // this query (the global default is refetchOnMount: "always"); retake
    // explicitly removes the cache entry first, and mid-generation question
    // growth is merged in via setQueryData, not refetch.
    staleTime: Infinity,
    refetchOnMount: false,
  });

  const { data: profileData } = useQuery({
    queryKey: profileQueryKeys.detail(user?.id ?? ""),
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });

  // Per-course curriculum override; falls back to the account default below.
  const { data: courseCurriculumRow } = useQuery({
    queryKey: courseQueryKeys.curriculum(courseId ?? ""),
    queryFn: async () => {
      const { data } = await supabase
        .from("courses")
        .select("curriculum_type")
        .eq("id", courseId!)
        .single();
      return data;
    },
    enabled: !!courseId,
  });

  const quizStartedRef = useRef(false);
  useEffect(() => {
    if (testData && testData.questions?.length && !quizStartedRef.current) {
      quizStartedRef.current = true;
      posthog.capture("quiz_started", {
        course_id: courseId,
        mode: topicId ? "topic" : "quiz",
        topic_id: topicId ?? undefined,
        quiz_id: quizId ?? undefined,
        attempt_id: testData.test_id,
        session_resumed: !!attemptId,
      });
    }
  }, [testData, courseId, topicId, quizId, attemptId]);

  useEffect(() => {
    if (
      testData &&
      !resumeApplied.current &&
      testData.answered_count != null &&
      testData.answered_count > 0
    ) {
      resumeApplied.current = true;
      const available = testData.questions?.length ?? 0;
      // May land one past the end when the attempt's answers already cover
      // every question it holds (the user left before the completion write
      // landed); the finish-on-overrun effect below resolves that.
      const seekTo = Math.min(testData.answered_count, available);
      setCurrentIndex(seekTo);
      setAnsweredCount(testData.answered_count);
      setCorrectCount(testData.correct_count ?? 0);
    }
  }, [testData]);

  // Snapshot pass probability once when the quiz first becomes ready, so the
  // completion screen can show a before→after delta.
  useEffect(() => {
    if (!user || !courseId || !testData || quizComplete) return;
    if (passChanceBefore !== null) return; // already captured
    fetchPassChance(user.id, courseId)
      .then((pc) => setPassChanceBefore(pc.pass_probability))
      .catch(() => setPassChanceBefore(null));
  }, [user, courseId, testData, quizComplete, passChanceBefore]);

  const questions = testData?.questions ?? [];
  const currentQuestion = questions[currentIndex] ?? null;
  const totalQuestions = questions.length;

  const handleSelectOption = useCallback(
    (optionIndex: number) => {
      if (feedback || !currentQuestion || !user || !courseId) return;
      setSelectedOption(optionIndex);

      const selectedOpt = currentQuestion.options.find(
        (o) => o.index === optionIndex,
      );
      const correctOpt = currentQuestion.options.find((o) => o.is_correct);
      const isCorrect = selectedOpt?.is_correct ?? false;

      const localFeedback: AnswerFeedback = {
        question_id: currentQuestion.id,
        concept_id: currentQuestion.concept_id,
        is_correct: isCorrect,
        correct_option_index: correctOpt?.index ?? 0,
        correct_option_text: correctOpt?.text ?? "",
        explanation: isCorrect
          ? (selectedOpt?.explanation ?? "")
          : (correctOpt?.explanation ?? ""),
        selected_option_index: optionIndex,
        p_mastery_before: 0,
        p_mastery_after: 0,
        is_newly_mastered: false,
        mastery_threshold: 0.85,
      };

      setFeedback(localFeedback);
      setAnsweredCount((prev) => prev + 1);
      if (isCorrect) setCorrectCount((prev) => prev + 1);

      posthog.capture("quiz_question_answered", {
        course_id: courseId,
        question_id: currentQuestion.id,
        correct: isCorrect,
      });

      if (quizId && testData?.test_id) {
        submitQuizAnswer(
          user.id,
          courseId,
          testData.test_id,
          currentQuestion.id,
          optionIndex,
        ).catch((err) => reportError("Background quiz answer failed:", err));
      } else if (topicId) {
        submitBktAnswer(
          user.id,
          courseId,
          currentQuestion.id,
          optionIndex,
          testData?.test_id,
        ).catch((err) => reportError("Background BKT update failed:", err));
      }
    },
    [feedback, currentQuestion, user, courseId, quizId, topicId, testData?.test_id],
  );

  const finishQuiz = useCallback(async () => {
    posthog.capture("quiz_completed", {
      course_id: courseId,
      questions_answered: totalQuestions,
      correct_count: correctCount,
    });
    setQuizComplete(true);
    setLoadingPassChance(true);
    try {
      if (quizId && testData?.test_id) {
        completeQuizAttempt(user!.id, courseId!, testData.test_id).catch(
          (err) => reportError("Failed to complete quiz attempt:", err),
        );
      }
      const pc = await fetchPassChance(user!.id, courseId!);
      setPassChance(pc.pass_probability);
      setTargetGrade(pc.target_grade ?? 1.0);
    } catch (err) {
      reportError("Failed to fetch pass chance:", err);
      setPassChance(null);
    } finally {
      setLoadingPassChance(false);
    }
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({
      queryKey: testQueryKeys.quizzes(courseId!, user!.id),
    });
    queryClient.invalidateQueries({
      queryKey: gardenQueryKeys.progress(courseId!, user!.id),
    });
  }, [
    totalQuestions,
    correctCount,
    user,
    courseId,
    quizId,
    queryClient,
    testData?.test_id,
  ]);

  const handleNext = useCallback(async () => {
    if (currentIndex + 1 >= totalQuestions) {
      await finishQuiz();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setFeedback(null);
    }
  }, [currentIndex, totalQuestions, finishQuiz]);

  // Finish-on-overrun: a resumed attempt seeks one past the end when its
  // answers already cover every question it holds (the user left before the
  // completion write landed). Complete it rather than render past the end of
  // the array — the attempt would otherwise sit in_progress forever.
  useEffect(() => {
    if (!testData || quizComplete) return;
    if (questions.length > 0 && currentIndex >= questions.length) {
      void finishQuiz();
    }
  }, [testData, quizComplete, currentIndex, questions.length, finishQuiz]);

  const handleRetake = useCallback(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setFeedback(null);
    setCorrectCount(0);
    setAnsweredCount(0);
    setQuizComplete(false);
    setPassChance(null);
    setPassChanceBefore(null);
    setTargetGrade(1.0);
    resumeApplied.current = false;
    quizStartedRef.current = false;

    if (quizId) {
      // Retake same quiz — start a fresh attempt
      queryClient.removeQueries({
        queryKey: testQueryKeys.quizAttempt(quizId, user?.id ?? ""),
      });
      if (attemptId) {
        queryClient.removeQueries({
          queryKey: testQueryKeys.resumeAttempt(attemptId),
        });
      }
      // V13: preserve from param across retake URL replacements
      const fromSuffix = fromParam ? `&from=${fromParam}` : "";
      navigate(`/test/${courseId}?quiz=${quizId}${fromSuffix}`, {
        replace: true,
      });
    } else if (topicId) {
      queryClient.removeQueries({
        queryKey: [...testQueryKeys.all, "focused", courseId, topicId],
      });
      // V13: preserve the from param so X button continues to route correctly
      const fromSuffix = fromParam ? `&from=${fromParam}` : "";
      navigate(`/test/${courseId}?topicId=${topicId}${fromSuffix}`, {
        replace: true,
      });
    } else {
      queryClient.removeQueries({
        queryKey: testQueryKeys.quiz(courseId ?? "", user?.id ?? ""),
      });
      // V13: preserve from param even when no topic/quiz scoping
      navigate(`/test/${courseId}${fromParam ? `?from=${fromParam}` : ""}`, {
        replace: true,
      });
    }
    refetch();
  }, [
    courseId,
    user,
    quizId,
    topicId,
    attemptId,
    queryClient,
    refetch,
    navigate,
    fromParam,
  ]);

  // Ensure users are warned if they try to close or refresh the window mid-quiz
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only warn if the quiz has started, is not complete, and at least one question was answered
      if (!quizComplete && currentIndex >= 0 && testData) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [quizComplete, currentIndex, testData]);

  const handleExit = useCallback(() => {
    // V13: respect the source page so X button returns where the user came from.
    // - from=study-plan → back to /course/:id/study-plan
    // - from=garden    → back to /course/:id/garden
    // - default        → back to course detail (legacy behavior)
    if (fromParam === "study-plan") {
      navigate(`/course/${courseId}/study-plan`);
      return;
    }
    if (fromParam === "garden") {
      navigate(`/course/${courseId}/garden`);
      return;
    }
    navigate(`/course/${courseId}`);
  }, [navigate, courseId, fromParam]);

  // Confirm before exiting mid-quiz; results screen exits directly.
  const handleExitRequest = () => {
    if (quizComplete) {
      handleExit();
    } else {
      setShowExitConfirm(true);
    }
  };

  const loadingMessage =
    quizId && !attemptId
      ? "Growing your questions..."
      : topicId
        ? "Tending this patch..."
        : "Resuming your walk...";

  if (!user || !courseId) {
    navigate("/home");
  }

  return {
    // Identity / routing
    user,
    courseId,
    navigate,
    quizId,
    topicId,

    // Screen-selection flags
    quizStillGenerating,
    quizGenerationFailed,
    generationStatus,
    isLoading,
    error,
    refetch,

    // Data
    testData,
    profileData,
    courseCurriculumRow,
    questions,
    currentQuestion,
    totalQuestions,
    loadingMessage,

    // Quiz-in-progress state
    currentIndex,
    selectedOption,
    feedback,
    correctCount,
    quizComplete,
    showExitConfirm,
    setShowExitConfirm,

    // Results state
    passChance,
    passChanceBefore,
    targetGrade,
    loadingPassChance,

    // Handlers
    handleSelectOption,
    handleNext,
    handleRetake,
    handleExit,
    handleExitRequest,
  };
}

export type QuizAttempt = ReturnType<typeof useQuizAttempt>;
