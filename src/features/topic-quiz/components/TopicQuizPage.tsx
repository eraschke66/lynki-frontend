import { useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, RefreshCw, RotateCcw, X } from "lucide-react";
import { GardenVideoLoader } from "@/components/garden/GardenVideoLoader";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import GhibliBackground from "@/components/garden/GhibliBackground";
import { topicQuizQueryKeys, gardenQueryKeys } from "@/lib/queryKeys";
import { posthog } from "@/lib/posthog";
import {
  fetchTopicQuizSession,
  submitTopicQuizAnswer,
  completeTopicQuiz,
} from "../services/topicQuizService";
import type { AnswerResult } from "../services/topicQuizService";

const STONE_LETTERS = ["A", "B", "C", "D"];

interface LocalFeedback extends AnswerResult {
  selected_option: number;
}

export function TopicQuizPage() {
  const { courseId, topicId } = useParams<{ courseId: string; topicId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const resumeApplied = useRef(false);
  const quizStartedRef = useRef(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<LocalFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const queryKey = topicQuizQueryKeys.session(
    courseId ?? "",
    topicId ?? "",
    user?.id ?? "",
  );

  const { data: session, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchTopicQuizSession(user!.id, courseId!, topicId!),
    enabled: !!user && !!courseId && !!topicId,
    staleTime: Infinity, // don't re-fetch mid-session
    // On load, resume from server-tracked index
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
        });
      }
      return data;
    },
  });

  const questions = session?.questions ?? [];
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
        console.error("Failed to submit answer:", err);
        // Allow retry
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
      });
      // Complete the session
      if (sessionId) {
        completeTopicQuiz(sessionId).catch((err) =>
          console.error("Failed to complete topic quiz:", err),
        );
      }
      setQuizComplete(true);
      queryClient.invalidateQueries({ queryKey: gardenQueryKeys.progress(courseId!, user!.id) });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setFeedback(null);
    }
  }, [currentIndex, totalQuestions, sessionId, courseId, user, queryClient]);

  const handleStudyAgain = useCallback(() => {
    // Invalidate query so a fresh session is fetched (old one is completed → backend generates new)
    queryClient.removeQueries({ queryKey });
    resumeApplied.current = false;
    setCurrentIndex(0);
    setSelectedOption(null);
    setFeedback(null);
    setCorrectCount(0);
    setQuizComplete(false);
    setSessionId(null);
    refetch();
  }, [queryClient, queryKey, refetch]);

  const handleExit = useCallback(() => {
    navigate(`/course/${courseId}/garden`);
  }, [navigate, courseId]);

  if (!user || !courseId || !topicId) {
    navigate("/home");
    return null;
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <GardenVideoLoader message="Preparing fresh soil for this topic..." />
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <GhibliBackground />
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
            <div>
              <p className="font-serif font-semibold mb-1">The seeds are resting</p>
              <p className="text-sm text-muted-foreground">
                {(error as Error).message || "Failed to load quiz. Please try again."}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" /> Try Again
            </Button>
          </ParchmentCard>
        </div>
      </div>
    );
  }

  // ── No questions ──
  if (!questions.length) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <GhibliBackground />
        <button
          onClick={handleExit}
          className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-30"
          aria-label="Exit"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <ParchmentCard className="p-10 text-center flex flex-col items-center gap-4 max-w-sm">
            <p className="font-serif text-lg font-semibold">No questions could be grown</p>
            <p className="text-sm text-muted-foreground">
              This topic may not have enough material yet.
            </p>
            <Button variant="outline" className="rounded-parchment" onClick={handleExit}>
              Return to Knowledge Garden
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

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <GhibliBackground />
        <button
          onClick={handleExit}
          className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-30"
          aria-label="Exit"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
          <ParchmentCard className="p-10 text-center flex flex-col items-center gap-6 w-full max-w-lg">
            <p className="text-xs font-semibold text-ghibli-forest uppercase tracking-wider">
              Topic Study Complete
            </p>

            <div className="space-y-1">
              <p className="font-serif text-2xl font-bold">{scorePercent}%</p>
              <p className="font-serif text-base font-semibold">
                {correctCount} of {totalQuestions} seeds took root
              </p>
              <p className="text-xs text-muted-foreground italic">{session?.topic_name}</p>
            </div>

            <p className="text-sm font-sans text-muted-foreground">
              {scorePercent >= 80
                ? "Wonderful! This topic is blossoming beautifully."
                : scorePercent >= 60
                ? "Good growth! Keep tending to this patch."
                : scorePercent >= 40
                ? "The soil is getting richer. Keep watering."
                : "Every garden starts from a single seed. Try again!"}
            </p>

            <img
              src="/sleeping-cat.png"
              alt="Sleeping cat"
              className="w-20 h-20 object-contain select-none opacity-60"
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full">
              <Button
                size="lg"
                className="flex-1 gap-2 rounded-parchment"
                onClick={handleStudyAgain}
              >
                <RotateCcw className="w-4 h-4" />
                Fresh Quiz
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 gap-2 rounded-parchment border-ghibli-moss/30 hover:border-ghibli-forest hover:text-ghibli-forest"
                onClick={handleExit}
              >
                <X className="w-4 h-4" />
                Return to Knowledge Garden
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <GhibliBackground />
      <button
        onClick={handleExit}
        className="absolute top-5 right-5 z-30 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Exit quiz"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="relative z-10 min-h-screen flex flex-col justify-center py-12">
        <div className="max-w-2xl w-full mx-auto px-6">

          {/* Progress bar */}
          <div className="w-full mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="font-serif text-sm font-semibold text-primary">
                {session?.topic_name ?? "Topic Study"}
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

          {/* Question card */}
          <ParchmentCard className="p-8 md:p-10 mb-6">
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
                {(feedback.is_correct ? feedback.selected_explanation : feedback.correct_explanation) && (
                  <p className="text-sm font-sans mt-1 opacity-70">
                    {feedback.is_correct ? feedback.selected_explanation : feedback.correct_explanation}
                  </p>
                )}
                {feedback.hint && !feedback.is_correct && (
                  <p className="text-xs font-sans mt-1 opacity-60 italic">
                    Hint: {feedback.hint}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Answer options */}
          <div className="flex flex-col gap-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption === option.index;
              const showFeedback = feedback !== null;
              const isCorrect = showFeedback && feedback.correct_option_index === option.index;
              const isWrong = showFeedback && isSelected && !feedback.is_correct;

              let optionClasses =
                "relative w-full text-left rounded-parchment border-2 px-5 py-4 font-sans text-sm font-medium transition-all duration-300 flex items-center gap-3";

              if (submitting && isSelected) {
                optionClasses += " border-primary/50 bg-primary/5 opacity-80 cursor-wait";
              } else if (showFeedback) {
                if (isCorrect) {
                  optionClasses += " bg-ghibli-moss/15 border-ghibli-moss text-primary cursor-default";
                } else if (isWrong) {
                  optionClasses += " bg-ghibli-petal/10 border-ghibli-petal/40 text-foreground/70 cursor-default";
                } else {
                  optionClasses += " bg-card border-border/60 opacity-50 cursor-default";
                }
              } else if (isSelected) {
                optionClasses += " border-primary bg-primary/5 cursor-wait";
              } else {
                optionClasses +=
                  " bg-card border-border/60 text-foreground hover:border-ghibli-amber/60 hover:shadow-glow cursor-pointer select-none";
              }

              const letter = STONE_LETTERS[option.index] ?? String.fromCharCode(65 + option.index);

              return (
                <button
                  key={option.index}
                  className={optionClasses}
                  onClick={() => handleSelectOption(option.index)}
                  disabled={showFeedback || submitting}
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
