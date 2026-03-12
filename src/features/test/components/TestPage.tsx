import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
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
import { GardenVideoLoader } from "@/components/garden/GardenVideoLoader";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { PlantIndicator } from "@/components/garden/PlantIndicator";
import GhibliBackground from "@/components/garden/GhibliBackground";
import type { AnswerFeedback } from "../types";

const stoneLetters = ["A", "B", "C", "D"];

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
  const [, setAnsweredCount] = useState(0);
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

  // ── Loading ──
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
      <div className="fixed inset-0 z-50 overflow-y-auto"><GhibliBackground />
        <button
          onClick={handleExit}
          className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-30"
          aria-label="Exit quiz"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <ParchmentCard className="p-10 text-center flex flex-col items-center gap-4">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="text-sm text-muted-foreground">Failed to load quiz</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </ParchmentCard>
        </div>
      </div>
    );
  }

  // ── No questions ──
  if (!questions.length) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto"><GhibliBackground />
        <button
          onClick={handleExit}
          className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-30"
          aria-label="Exit quiz"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <ParchmentCard className="p-10 text-center flex flex-col items-center gap-4 max-w-sm">
            <PlantIndicator probability={20} size="lg" />
            <div>
              <h2 className="font-serif text-lg font-semibold mb-1">No Questions Available</h2>
              <p className="text-sm text-muted-foreground">
                {testData?.message || "Your documents may still be processing. Check back in a moment."}
              </p>
            </div>
            <Button variant="outline" className="rounded-parchment" onClick={handleExit}>
              Back to Garden
            </Button>
          </ParchmentCard>
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
      <div className="fixed inset-0 z-50 overflow-y-auto"><GhibliBackground />
        <button
          onClick={handleExit}
          className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-30"
          aria-label="Exit quiz"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
          <ParchmentCard className="p-10 text-center flex flex-col items-center gap-6 w-full max-w-lg">
            {loadingPassChance ? (
              <div className="space-y-3">
                <PlantIndicator probability={40} size="lg" />
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-sm font-sans text-muted-foreground">Reading the garden...</p>
              </div>
            ) : passPercent !== null ? (
              <div className="space-y-3 flex flex-col items-center">
                <p className="text-xs font-semibold text-ghibli-forest uppercase tracking-wider">
                  Garden Walk Complete
                </p>
                <PlantIndicator probability={passPercent} size="xl" />
                <p className={`text-sm font-semibold ${getGardenStatus(passPercent).color}`}>
                  {getGardenStatus(passPercent).label}
                </p>
                <p className="text-sm font-sans text-muted-foreground">
                  {getGardenStatus(passPercent).description}
                </p>
                <p className="text-xs font-sans text-muted-foreground">
                  Growing toward{" "}
                  {getGradeLabel(profileData?.curriculum ?? "percentage", targetGrade)}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Could not calculate passing chance</p>
              </div>
            )}

            <div className="space-y-1">
              <p className="font-serif text-lg font-semibold">
                {correctCount} of {totalQuestions} seeds took root
              </p>
              <p className="text-sm font-sans text-muted-foreground">
                {scorePercent >= 80
                  ? "A perfect bloom! Your garden flourishes."
                  : scorePercent >= 60
                  ? "Your garden is growing well. Keep tending to it!"
                  : scorePercent >= 40
                  ? "The soil is getting richer."
                  : "Every garden needs patience. Water your knowledge and try again."}
              </p>
            </div>

            <img
              src="/sleeping-cat.png"
              alt="Sleeping cat"
              className="w-20 h-20 object-contain select-none opacity-60"
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full">
              <Button size="lg" className="flex-1 gap-2 rounded-parchment" onClick={handleRetake}>
                <RotateCcw className="w-4 h-4" />
                Walk the Path Again
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 gap-2 rounded-parchment border-ghibli-moss/30 hover:border-ghibli-forest hover:text-ghibli-forest"
                onClick={handleExit}
              >
                <X className="w-4 h-4" />
                Return to Garden
              </Button>
            </div>
          </ParchmentCard>
        </div>
      </div>
    );
  }

  // ── Active question ──
  const progress = (currentIndex + (feedback ? 1 : 0)) / totalQuestions;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto"><GhibliBackground />
      <button
        onClick={handleExit}
        className="absolute top-5 right-5 z-30 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Exit quiz"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="relative z-10 min-h-screen flex flex-col justify-center py-12">
        <div className="max-w-2xl w-full mx-auto px-6">

          {/* Garden path progress bar */}
          <div className="w-full mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="font-serif text-sm font-semibold text-primary">
                {testData?.course_name ?? "Quiz"}
              </span>
              <span className="font-sans text-xs text-muted-foreground">
                Step {currentIndex + 1} of {totalQuestions} &middot; {correctCount} took root
              </span>
            </div>
            <div className="relative h-5 rounded-full bg-card border border-border/60 overflow-hidden parchment-texture">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${progress * 100}%`,
                  background: "linear-gradient(90deg, hsl(var(--ghibli-moss)), hsl(var(--ghibli-forest)))",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-2">
                {Array.from({ length: totalQuestions }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full border transition-colors duration-300 ${
                      i < currentIndex + (feedback ? 1 : 0)
                        ? "bg-ghibli-sunlight border-ghibli-amber"
                        : "bg-card/80 border-border"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Question scroll card */}
          <ParchmentCard className="p-8 md:p-10 mb-6">
            {/* Scroll ornament top */}
            <div className="flex justify-center mb-4">
              <svg width="80" height="12" viewBox="0 0 80 12" className="text-ghibli-bark/30">
                <path
                  d="M0 6 Q10 0 20 6 Q30 12 40 6 Q50 0 60 6 Q70 12 80 6"
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="1.5"
                />
              </svg>
            </div>

            <h2 className="font-serif text-xl md:text-2xl font-semibold text-foreground text-center leading-relaxed">
              {currentQuestion.question}
            </h2>

            {/* Scroll ornament bottom */}
            <div className="flex justify-center mt-4">
              <svg width="80" height="12" viewBox="0 0 80 12" className="text-ghibli-bark/30">
                <path
                  d="M0 6 Q10 12 20 6 Q30 0 40 6 Q50 12 60 6 Q70 0 80 6"
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </ParchmentCard>

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`flex items-start gap-3 p-4 rounded-parchment mb-4 ${
                feedback.is_correct
                  ? "bg-ghibli-moss/15 border border-ghibli-moss/30 text-ghibli-forest"
                  : "bg-ghibli-petal/10 border border-ghibli-petal/30 text-foreground/80"
              }`}
            >
              <img
                src={feedback.is_correct ? "/leaf-sprout.png" : "/water-drop.png"}
                alt=""
                className={`w-8 h-8 object-contain shrink-0 ${
                  feedback.is_correct ? "animate-scale-in" : "animate-drop"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="font-sans font-medium">
                  {feedback.is_correct ? "That one took root." : "That seed needs more light."}
                </p>
                {!feedback.is_correct && (
                  <p className="text-sm font-sans mt-0.5 opacity-80">
                    The correct answer is: {feedback.correct_option_text}
                  </p>
                )}
                {feedback.explanation && (
                  <p className="text-sm font-sans mt-1 opacity-70">{feedback.explanation}</p>
                )}
              </div>
            </div>
          )}

          {/* Answer options — stone markers */}
          <div className="flex flex-col gap-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption === option.index;
              const showFeedback = feedback !== null;
              const isCorrect = showFeedback && feedback.correct_option_index === option.index;
              const isWrong = showFeedback && isSelected && !feedback.is_correct;

              let optionClasses =
                "relative w-full text-left rounded-parchment border-2 px-5 py-4 font-sans text-sm font-medium transition-all duration-300 cursor-pointer select-none flex items-center gap-3";

              if (showFeedback) {
                if (isCorrect) {
                  optionClasses += " bg-ghibli-moss/15 border-ghibli-moss text-primary";
                } else if (isWrong) {
                  optionClasses += " bg-ghibli-petal/10 border-ghibli-petal/40 text-foreground/70";
                } else {
                  optionClasses += " bg-card border-border/60 opacity-50";
                }
              } else if (isSelected) {
                optionClasses += " border-primary bg-primary/5";
              } else {
                optionClasses += " bg-card border-border/60 text-foreground hover:border-ghibli-amber/60 hover:shadow-glow";
              }

              if (showFeedback && !isCorrect && !isWrong) {
                optionClasses += " cursor-default";
              }

              const letter = stoneLetters[option.index] ?? String.fromCharCode(65 + option.index);

              return (
                <button
                  key={option.id}
                  className={optionClasses}
                  onClick={() => handleSelectOption(option.index)}
                  disabled={showFeedback}
                >
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-serif font-bold text-xs ${
                      isCorrect
                        ? "bg-primary text-primary-foreground"
                        : isWrong
                        ? "bg-ghibli-petal/30 text-ghibli-bark"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="flex-1">{option.text}</span>
                  {isCorrect && (
                    <img
                      src="/leaf-sprout.png"
                      alt="Correct!"
                      className="w-8 h-8 object-contain animate-scale-in"
                    />
                  )}
                  {isWrong && (
                    <img
                      src="/water-drop.png"
                      alt="Incorrect"
                      className="w-7 h-7 object-contain animate-drop"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Next button */}
          {feedback && (
            <div className="mt-8 flex justify-end">
              <Button size="lg" className="gap-2 rounded-parchment" onClick={handleNext}>
                {currentIndex + 1 >= totalQuestions ? "See What Grew" : "Next"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

