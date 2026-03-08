import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CircularProgress } from "@/components/ui/circular-progress";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  X,
  RotateCcw,
} from "lucide-react";
import {
  fetchTest,
  fetchResumeTest,
  submitAnswer,
  fetchPassChance,
  completeTest,
} from "../services/testService";
import { testQueryKeys, profileQueryKeys } from "@/lib/queryKeys";
import { fetchProfile } from "@/features/settings";
import { getGradeLabel } from "@/lib/curricula";
import { getGardenStatus } from "@/lib/garden";
import { VineDecoration } from "@/components/garden/VineDecoration";
import { GardenVideoLoader } from "@/components/garden/GardenVideoLoader";
import { Neko } from "@/components/garden/Neko";
import type { AnswerFeedback } from "../types";

export function TestPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const resumeApplied = useRef(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [passChance, setPassChance] = useState<number | null>(null);
  const [targetGrade, setTargetGrade] = useState<number>(1.0);
  const [loadingPassChance, setLoadingPassChance] = useState(false);

  const { data: testData, isLoading, error, refetch } = useQuery({
    queryKey: sessionId
      ? [...testQueryKeys.all, "resume", sessionId]
      : testQueryKeys.quiz(courseId ?? "", user?.id ?? ""),
    queryFn: () =>
      sessionId
        ? fetchResumeTest(user!.id, sessionId)
        : fetchTest(user!.id, courseId!),
    enabled: !!user && !!courseId,
  });

  const { data: profileData } = useQuery({
    queryKey: profileQueryKeys.detail(user?.id ?? ""),
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (
      testData &&
      sessionId &&
      !resumeApplied.current &&
      testData.answered_count != null &&
      testData.answered_count > 0
    ) {
      resumeApplied.current = true;
      setCurrentIndex(testData.answered_count);
      setAnsweredCount(testData.answered_count);
      setCorrectCount(testData.correct_count ?? 0);
    }
  }, [testData, sessionId]);

  const questions = testData?.questions ?? [];
  const currentQuestion = questions[currentIndex] ?? null;
  const totalQuestions = questions.length;

  const handleSelectOption = useCallback(
    (optionIndex: number) => {
      if (feedback || !currentQuestion || !user || !courseId) return;
      setSelectedOption(optionIndex);

      const selectedOpt = currentQuestion.options.find((o) => o.index === optionIndex);
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

      submitAnswer(user.id, courseId, currentQuestion.id, optionIndex, testData?.test_id).catch(
        (err) => console.error("Background BKT update failed:", err),
      );
    },
    [feedback, currentQuestion, user, courseId, testData?.test_id],
  );

  const handleNext = useCallback(async () => {
    if (currentIndex + 1 >= totalQuestions) {
      setQuizComplete(true);
      setLoadingPassChance(true);
      try {
        if (testData?.test_id) {
          completeTest(user!.id, courseId!, testData.test_id).catch((err) =>
            console.error("Failed to complete test session:", err),
          );
        }
        const pc = await fetchPassChance(user!.id, courseId!);
        setPassChance(pc.pass_probability);
        setTargetGrade(pc.target_grade ?? 1.0);
      } catch (err) {
        console.error("Failed to fetch pass chance:", err);
        setPassChance(null);
      } finally {
        setLoadingPassChance(false);
      }
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: testQueryKeys.history(courseId!, user!.id) });
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setFeedback(null);
    }
  }, [currentIndex, totalQuestions, user, courseId, queryClient, testData?.test_id]);

  const handleRetake = useCallback(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setFeedback(null);
    setCorrectCount(0);
    setAnsweredCount(0);
    setQuizComplete(false);
    setPassChance(null);
    setTargetGrade(1.0);
    resumeApplied.current = false;
    queryClient.removeQueries({ queryKey: testQueryKeys.quiz(courseId ?? "", user?.id ?? "") });
    if (sessionId) {
      queryClient.removeQueries({ queryKey: [...testQueryKeys.all, "resume", sessionId] });
    }
    navigate(`/test/${courseId}`, { replace: true });
    refetch();
  }, [courseId, user, queryClient, refetch, sessionId, navigate]);

  if (!user || !courseId) { navigate("/home"); return null; }

  const handleExit = useCallback(() => {
    navigate(`/course/${courseId}`);
  }, [navigate, courseId]);

  // ── Loading — sprinkler cat video ──
  if (isLoading) {
    return (
      <GardenVideoLoader
        message={sessionId ? "Resuming your walk..." : "Preparing the path..."}
      />
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <button
          onClick={handleExit}
          className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Exit quiz"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-center space-y-4">
          <AlertCircle className="w-10 h-10 mx-auto text-destructive" />
          <p className="text-sm text-muted-foreground">Failed to load quiz</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  // ── No questions ──
  if (!questions.length) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <button
          onClick={handleExit}
          className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Exit quiz"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-center space-y-4 max-w-sm">
          <img src="/plant-young-raw.png" alt="" className="w-20 h-20 object-contain mx-auto" style={{ mixBlendMode: "darken" }} />
          <div>
            <h2 className="text-lg font-semibold mb-1">No Questions Available</h2>
            <p className="text-sm text-muted-foreground">
              {testData?.message || "Your documents may still be processing. Check back in a moment."}
            </p>
          </div>
          <Button variant="outline" onClick={handleExit}>
            Back to Garden
          </Button>
        </div>
      </div>
    );
  }

  // ── Results ──
  if (quizComplete) {
    const scorePercent = totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;
    const passPercent = passChance !== null ? Math.round(passChance * 100) : null;

    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <VineDecoration />
        <button
          onClick={handleExit}
          className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Exit quiz"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="w-full max-w-lg px-6">
          <Card
            className="rounded-2xl overflow-hidden"
            style={{ borderTop: "3px solid rgba(64,145,108,0.4)" }}
          >
            <CardContent className="pt-10 pb-8 px-8">
              <div className="flex flex-col items-center text-center space-y-6">
                {loadingPassChance ? (
                  <div className="space-y-3">
                    <img src="/plant-young-raw.png" alt="" className="w-16 h-16 object-contain mx-auto" style={{ mixBlendMode: "darken" }} />
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Reading the garden...
                    </p>
                  </div>
                ) : passPercent !== null ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-[#40916C] uppercase tracking-wider">
                      Your Garden
                    </p>
                    <CircularProgress
                      value={passPercent}
                      size={160}
                      strokeWidth={12}
                      labelClassName="text-3xl font-bold"
                    />
                    <p className={`text-sm font-semibold ${getGardenStatus(passPercent).color}`}>
                      {getGardenStatus(passPercent).label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getGardenStatus(passPercent).description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Growing toward{" "}
                      {getGradeLabel(profileData?.curriculum ?? "percentage", targetGrade)}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Could not calculate passing chance</p>
                  </div>
                )}

                {/* Score */}
                <div className="space-y-1">
                  <p className="text-lg font-semibold">
                    {correctCount} of {totalQuestions} seeds took root
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {scorePercent >= 80
                      ? "Your garden flourished today."
                      : scorePercent >= 60
                      ? "Good growth today."
                      : scorePercent >= 40
                      ? "The soil is getting richer."
                      : "Every garden has days like this."}
                  </p>
                </div>

                {/* Sleeping cat */}
                <Neko size={80} className="opacity-60 mx-auto" />
              {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full">
                  <Button size="lg" className="flex-1 gap-2" onClick={handleRetake}>
                    <RotateCcw className="w-4 h-4" />
                    Walk the Path Again
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 gap-2 border-[rgba(64,145,108,0.3)] hover:border-[#40916C] hover:text-[#1B4332]"
                    onClick={handleExit}
                  >
                    <X className="w-4 h-4" />
                    Return to Garden
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Active question ──
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;
  const atMidpoint = currentIndex > 0 && Math.abs((currentIndex + 1) / totalQuestions - 0.5) < 0.1;

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <VineDecoration />
      {/* Top garden stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(64,145,108,0.4), rgba(13,115,119,0.5), rgba(64,145,108,0.4), transparent)",
        }}
      />

      <button
        onClick={handleExit}
        className="absolute top-5 right-5 z-10 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Exit quiz"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="min-h-full flex flex-col justify-center py-12">
        <div className="max-w-2xl w-full mx-auto px-6">

          {/* Progress */}
          <div className="mb-8">
            <p className="text-sm font-semibold mb-2 text-foreground">
              {testData?.course_name ?? "Quiz"}
            </p>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Step {currentIndex + 1} of {totalQuestions}
              </p>
              <p className="text-sm text-muted-foreground">
                {correctCount}/{answeredCount} took root
              </p>
            </div>
            <Progress
              value={progressPercent}
              className="h-1.5"
              style={{ background: "rgba(64,145,108,0.12)" }}
            />
          </div>

          {/* Mid-quiz nudge */}
          {atMidpoint && !feedback && (
            <div
              className="text-center p-3 rounded-xl mb-4"
              style={{
                background: "rgba(64,145,108,0.07)",
                border: "1px solid rgba(64,145,108,0.15)",
              }}
            >
              <img src="/plant-seedling-raw.png" alt="" className="w-8 h-8 object-contain inline-block" style={{ mixBlendMode: "darken" }} />
              <p className="text-sm text-[#2D6A4F] mt-1 font-medium">
                Along the way. Keep walking.
              </p>
            </div>
          )}

          {/* Question card */}
          <Card
            className="rounded-2xl overflow-hidden"
            style={{ borderTop: "3px solid rgba(64,145,108,0.25)" }}
          >
            <CardContent className="pt-8 pb-6 px-8">
              <h2 className="quiz-question text-xl leading-relaxed mb-8">
                {currentQuestion.question}
              </h2>

              {/* Feedback */}
              {feedback && (
                <div
                  className={`flex items-start gap-3 p-4 rounded-xl mb-6 ${
                    feedback.is_correct
                      ? "bg-[rgba(64,145,108,0.1)] text-[#1B4332]"
                      : "bg-red-500/10 text-red-700 dark:text-red-400"
                  }`}
                >
                  {feedback.is_correct ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#40916C]" />
                  ) : (
                    <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {feedback.is_correct ? "That one took root." : "That seed needs more light."}
                    </p>
                    {!feedback.is_correct && (
                      <p className="text-sm mt-0.5 opacity-80">
                        The correct answer is: {feedback.correct_option_text}
                      </p>
                    )}
                    {feedback.explanation && (
                      <p className="text-sm mt-1 opacity-70">{feedback.explanation}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOption === option.index;
                  const showFeedback = feedback !== null;
                  const isCorrect = showFeedback && feedback.correct_option_index === option.index;
                  const isWrong = showFeedback && isSelected && !feedback.is_correct;

                  let optionClasses =
                    "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150";

                  if (showFeedback) {
                    if (isCorrect) {
                      optionClasses += " border-[#40916C] bg-[rgba(64,145,108,0.08)]";
                    } else if (isWrong) {
                      optionClasses += " border-red-500 bg-red-500/10";
                    } else {
                      optionClasses += " border-border opacity-40";
                    }
                  } else if (isSelected) {
                    optionClasses += " border-primary bg-primary/5";
                  } else {
                    optionClasses +=
                      " border-border hover:border-[rgba(64,145,108,0.4)] hover:bg-[rgba(64,145,108,0.04)] cursor-pointer";
                  }

                  const letter = String.fromCharCode(65 + option.index);

                  return (
                    <button
                      key={option.id}
                      className={optionClasses}
                      onClick={() => handleSelectOption(option.index)}
                      disabled={showFeedback}
                    >
                      <span
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0 ${
                          showFeedback && isCorrect
                            ? "bg-[#40916C] text-white"
                            : showFeedback && isWrong
                            ? "bg-red-500 text-white"
                            : isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="flex-1 text-sm font-medium">{option.text}</span>
                      {showFeedback && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-[#40916C] shrink-0" />
                      )}
                      {showFeedback && isWrong && (
                        <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Next */}
              {feedback && (
                <div className="mt-8 flex justify-end">
                  <Button size="lg" className="gap-2" onClick={handleNext}>
                    {currentIndex + 1 >= totalQuestions ? "See What Grew" : "Next"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
