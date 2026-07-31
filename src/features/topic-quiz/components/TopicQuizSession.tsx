import { reportError } from "@/lib/sentry";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, RefreshCw, RotateCcw, X } from "lucide-react";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { GardenVideoLoader } from "@/components/garden/GardenVideoLoader";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
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

const STONE_LETTERS = ["A", "B", "C", "D"];

interface LocalFeedback extends AnswerResult {
  selected_option: number;
}

export interface TopicQuizCompletionResult {
  correct: number;
  total: number;
  question_ids: string[];
}

interface TopicQuizSessionProps {
  courseId: string;
  topicId: string;
  /** Fired on quiz finish in either mode. Standalone uses this to drop the exit-confirm dialog after completion; embedded uses it to advance its own state machine. */
  onComplete?: (result: TopicQuizCompletionResult) => void;
  /** Wired to internal "Return" affordances in error / no-questions / results states. */
  onExit?: () => void;
  /** When true: skip the post-quiz results screen, use a contained loader, drop min-h-screen wrappers. The parent shell handles all top-level chrome. */
  embedded?: boolean;
}

export function TopicQuizSession({
  courseId,
  topicId,
  onComplete,
  onExit,
  embedded = false,
}: TopicQuizSessionProps) {
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

  // ── Loading ──
  if (isLoading) {
    if (embedded) {
      return (
        <div className="max-w-md mx-auto w-full">
          <ParchmentCard className="p-5 md:p-8 text-center" hover={false}>
            <p className="font-serif text-ghibli-canopy">Preparing fresh soil for this topic…</p>
            {showSlowLink && (
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-4 text-xs text-ghibli-bark hover:text-ghibli-canopy hover:underline"
              >
                This is taking longer than usual — try again?
              </button>
            )}
          </ParchmentCard>
        </div>
      );
    }
    return <GardenVideoLoader message="Preparing fresh soil for this topic..." />;
  }

  // ── Error ──
  if (error) {
    return (
      <CenteredCard embedded={embedded}>
        <ParchmentCard className="p-6 md:p-10 text-center flex flex-col items-center gap-4">
          <AlertCircle className="w-10 h-10 text-destructive" />
          <div>
            <p className="font-serif font-semibold mb-1">The seeds are resting</p>
            <p className="text-sm text-ghibli-bark">
              {(error as Error).message || "Failed to load quiz. Please try again."}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </Button>
        </ParchmentCard>
      </CenteredCard>
    );
  }

  // ── No questions ──
  if (!questions.length) {
    return (
      <CenteredCard embedded={embedded}>
        <ParchmentCard className="p-6 md:p-10 text-center flex flex-col items-center gap-4 max-w-sm">
          <p className="font-serif text-lg font-semibold">No questions could be grown</p>
          <p className="text-sm text-ghibli-bark">
            This topic may not have enough material yet.
          </p>
          {onExit && (
            <Button variant="outline" className="rounded-parchment" onClick={onExit}>
              Return
            </Button>
          )}
        </ParchmentCard>
      </CenteredCard>
    );
  }

  // ── Results (standalone only) ──
  if (quizComplete && !embedded) {
    const scorePercent =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    return (
      <CenteredCard embedded={embedded}>
        <ParchmentCard className="p-6 md:p-10 text-center flex flex-col items-center gap-6 w-full max-w-lg">
          <p className="text-xs font-semibold text-ghibli-forest uppercase tracking-wider">
            Topic Study Complete
          </p>
          <div className="space-y-1">
            <p className="font-serif text-2xl font-bold">{scorePercent}%</p>
            <p className="font-serif text-base font-semibold">
              {correctCount} of {totalQuestions} seeds took root
            </p>
            <p className="text-xs text-ghibli-bark italic">{session?.topic_name}</p>
          </div>
          <p className="text-sm font-sans text-ghibli-bark">
            {scorePercent >= 80
              ? "Wonderful! This topic is blossoming beautifully."
              : scorePercent >= 60
              ? "Good growth! Keep tending to this patch."
              : scorePercent >= 40
              ? "The soil is getting richer. Keep watering."
              : "Every garden starts from a single seed. Try again!"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full">
            <Button
              size="lg"
              className="flex-1 gap-2 rounded-parchment"
              onClick={handleStudyAgain}
            >
              <RotateCcw className="w-4 h-4" />
              Fresh Quiz
            </Button>
            {onExit && (
              <Button
                size="lg"
                variant="outline"
                className="flex-1 gap-2 rounded-parchment border-ghibli-moss/30 hover:border-ghibli-forest hover:text-ghibli-forest"
                onClick={onExit}
              >
                <X className="w-4 h-4" />
                Return
              </Button>
            )}
          </div>
        </ParchmentCard>
      </CenteredCard>
    );
  }

  // Embedded + complete: parent will unmount; render nothing meaningful.
  if (quizComplete && embedded) return null;

  // ── Active question ──
  const progress = (currentIndex + (feedback ? 1 : 0)) / totalQuestions;

  const questionUI = (
    <div className="max-w-2xl w-full mx-auto px-6">
      <div className="w-full mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="font-serif text-sm font-semibold text-primary">
            {session?.topic_name ?? "Topic Study"}
          </span>
          <span className="font-sans text-xs text-ghibli-bark">
            Step {currentIndex + 1} of {totalQuestions} &middot; {correctCount} took root
          </span>
        </div>
        <div className="relative h-5 rounded-full bg-ghibli-mist/70 border border-ghibli-moss/40 overflow-hidden parchment-texture">
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
                    : "bg-ghibli-ivory border-ghibli-moss/45"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <ParchmentCard className="p-8 md:p-10 mb-6">
        <div className="flex justify-center mb-4">
          <svg width="80" height="12" viewBox="0 0 80 12" className="text-ghibli-bark-ghost">
            <path
              d="M0 6 Q10 0 20 6 Q30 12 40 6 Q50 0 60 6 Q70 12 80 6"
              stroke="currentColor"
              fill="none"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <h2 className="font-serif text-xl md:text-2xl font-semibold text-ghibli-canopy text-center leading-relaxed">
          {currentQuestion!.question}
        </h2>
        <div className="flex justify-center mt-4">
          <svg width="80" height="12" viewBox="0 0 80 12" className="text-ghibli-bark-ghost">
            <path
              d="M0 6 Q10 12 20 6 Q30 0 40 6 Q50 12 60 6 Q70 0 80 6"
              stroke="currentColor"
              fill="none"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </ParchmentCard>

      {feedback && (
        <div
          className={`flex items-start gap-3 p-4 rounded-parchment mb-4 ${
            feedback.is_correct
              ? "bg-ghibli-moss/15 border border-ghibli-moss/30"
              : "bg-ghibli-petal/15 border border-ghibli-petal/40"
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
            <p className="font-serif font-semibold text-ghibli-canopy text-base">
              {feedback.is_correct ? "That one took root." : "That seed needs more light."}
            </p>
            {!feedback.is_correct && (
              <p className="font-serif font-medium text-ghibli-bark text-base mt-1">
                The correct answer is: {feedback.correct_option_text}
              </p>
            )}
            {(feedback.is_correct
              ? feedback.selected_explanation
              : feedback.correct_explanation) && (
              <p className="font-serif text-ghibli-bark text-base mt-1.5 leading-relaxed">
                {feedback.is_correct
                  ? feedback.selected_explanation
                  : feedback.correct_explanation}
              </p>
            )}
            {feedback.hint && !feedback.is_correct && (
              <p className="font-serif text-sm text-ghibli-bark mt-1.5 italic">
                Hint: {feedback.hint}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {currentQuestion!.options.map((option) => {
          const isSelected = selectedOption === option.index;
          const showFeedback = feedback !== null;
          const isCorrect = showFeedback && feedback.correct_option_index === option.index;
          const isWrong = showFeedback && isSelected && !feedback.is_correct;

          let optionClasses =
            "relative w-full text-left rounded-parchment border-2 px-6 py-5 font-serif text-base font-semibold transition-all duration-300 flex items-center gap-4 parchment-solid text-ghibli-canopy";

          if (submitting && isSelected) {
            optionClasses += " border-ghibli-jungle bg-ghibli-moss/15 cursor-wait";
          } else if (showFeedback) {
            if (isCorrect) {
              optionClasses += " border-ghibli-moss bg-ghibli-moss/20 shadow-md cursor-default";
            } else if (isWrong) {
              optionClasses +=
                " border-ghibli-petal bg-ghibli-petal/20 text-ghibli-bark cursor-default";
            } else {
              optionClasses += " border-ghibli-moss/40 text-ghibli-bark cursor-default";
            }
          } else if (isSelected) {
            optionClasses += " border-ghibli-jungle bg-ghibli-moss/15 shadow-md cursor-wait";
          } else {
            optionClasses +=
              " border-ghibli-moss/50 hover:border-ghibli-jungle hover:shadow-lg cursor-pointer select-none";
          }

          const letter =
            STONE_LETTERS[option.index] ?? String.fromCharCode(65 + option.index);

          return (
            <button
              key={option.index}
              className={optionClasses}
              onClick={() => handleSelectOption(option.index)}
              disabled={showFeedback || submitting}
            >
              <span
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-serif font-bold text-sm ${
                  isCorrect
                    ? "bg-gradient-to-br from-ghibli-jungle to-ghibli-canopy text-primary-foreground shadow-sm"
                    : isWrong
                    ? "bg-ghibli-petal/45 text-ghibli-bark"
                    : "bg-gradient-to-br from-ghibli-ivory to-ghibli-mist text-ghibli-canopy border border-ghibli-moss/45"
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

      {feedback && (
        <div className="mt-8 flex justify-end">
          <Button size="lg" className="gap-2 rounded-parchment" onClick={handleNext}>
            {currentIndex + 1 >= totalQuestions ? "See What Grew" : "Next"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );

  if (embedded) return questionUI;
  return (
    <div className="relative z-10 min-h-screen flex flex-col py-12 pb-32">
      {questionUI}
    </div>
  );
}

interface CenteredCardProps {
  embedded: boolean;
  children: React.ReactNode;
}

function CenteredCard({ embedded, children }: CenteredCardProps) {
  if (embedded) {
    return <div className="max-w-xl mx-auto w-full">{children}</div>;
  }
  return (
    <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
      {children}
    </div>
  );
}
