import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Lightbulb,
  ChevronRight,
  CheckCircle2,
  Loader2,
  X,
  AlertCircle,
  Trophy,
  Target,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { fetchBktSession, submitAnswer } from "../services/studyService";
import type { BKTSession, SessionQuestion, AnswerResult } from "../types";

// Per-concept mastery tracker accumulated across all answers in the session
interface ConceptDelta {
  concept_name: string;
  p_start: number;
  p_end: number;
  newly_mastered: boolean;
}

interface StudySessionProps {
  topicId: string;
  courseId: string;
  onComplete: () => void;
  onExit: () => void;
}

export function StudySession({
  topicId,
  courseId,
  onComplete,
  onExit,
}: StudySessionProps) {
  const { user } = useAuth();

  const [session, setSession] = useState<BKTSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [currentResult, setCurrentResult] = useState<AnswerResult | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now(),
  );
  const [submitting, setSubmitting] = useState(false);

  // Accumulated stats
  const [correctCount, setCorrectCount] = useState(0);
  const [conceptDeltas, setConceptDeltas] = useState<Map<string, ConceptDelta>>(
    new Map(),
  );

  useEffect(() => {
    async function loadSession() {
      if (!user) return;
      setLoading(true);
      const bktSession = await fetchBktSession(user.id, courseId, topicId);
      if (bktSession) {
        setSession(bktSession);
        // If all concepts already mastered, show that immediately
        if (bktSession.all_mastered) {
          setSessionComplete(true);
        }
      }
      setLoading(false);
      setQuestionStartTime(Date.now());
    }
    loadSession();
  }, [topicId, courseId, user]);

  const currentQuestion: SessionQuestion | undefined =
    session?.questions[currentIndex];

  const handleSelectOption = useCallback(
    async (optionIndex: number) => {
      if (!session || !currentQuestion || !user || showFeedback || submitting)
        return;

      setSubmitting(true);
      setSelectedAnswer(optionIndex);
      setShowFeedback(true);

      const timeSpent = Date.now() - questionStartTime;
      const result = await submitAnswer({
        user_id: user.id,
        question_id: currentQuestion.id,
        course_id: courseId,
        selected_option_index: optionIndex,
        session_id: session.session_id,
        time_spent_ms: timeSpent,
      });

      if (result) {
        setCurrentResult(result);

        if (result.is_correct) {
          setCorrectCount((prev) => prev + 1);
        }

        // Update per-concept mastery delta tracking
        const conceptId = result.concept_id ?? currentQuestion.concept_id ?? "";
        setConceptDeltas((prev) => {
          const updated = new Map(prev);
          const existing = updated.get(conceptId);
          if (existing) {
            updated.set(conceptId, {
              ...existing,
              p_end: result.p_mastery_after,
              newly_mastered:
                existing.newly_mastered || result.is_newly_mastered,
            });
          } else {
            updated.set(conceptId, {
              concept_name: currentQuestion.concept_name,
              p_start: result.p_mastery_before,
              p_end: result.p_mastery_after,
              newly_mastered: result.is_newly_mastered,
            });
          }
          return updated;
        });
      }

      setSubmitting(false);
    },
    [
      session,
      currentQuestion,
      user,
      showFeedback,
      submitting,
      questionStartTime,
      courseId,
    ],
  );

  const handleNext = useCallback(() => {
    if (!session) return;

    const nextIndex = currentIndex + 1;
    if (nextIndex >= session.questions.length) {
      setSessionComplete(true);
      return;
    }

    setCurrentIndex(nextIndex);
    setSelectedAnswer(null);
    setCurrentResult(null);
    setShowFeedback(false);
    setShowHint(false);
    setQuestionStartTime(Date.now());
  }, [session, currentIndex]);

  const getOptionLabel = (index: number) => String.fromCharCode(65 + index);

  const masteryPercent = (p: number) => Math.round(p * 100);

  // Any concept newly mastered this session?
  const anyNewlyMastered = Array.from(conceptDeltas.values()).some(
    (d) => d.newly_mastered,
  );

  // ---------- Render states ----------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading study session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              Failed to load the session. Please try again.
            </p>
            <Button variant="outline" onClick={onExit}>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // All concepts already mastered (backend returned empty session)
  if (session.all_mastered && session.questions.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
              <Trophy className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                All Mastered!
              </h2>
              <p className="text-muted-foreground mt-2">
                You've mastered all concepts in this topic. Great work!
              </p>
            </div>
            <Button variant="outline" onClick={onComplete}>
              Back to Overview
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion && !sessionComplete) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              No questions available for this topic yet.
            </p>
            <Button variant="outline" onClick={onExit}>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---------- Session complete ----------

  if (sessionComplete) {
    const deltas = Array.from(conceptDeltas.values());

    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-6">
            {anyNewlyMastered ? (
              <>
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                  <Trophy className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    Concepts Mastered!
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    Amazing progress this session!
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                  <Target className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Good Progress!</h2>
                  <p className="text-muted-foreground mt-2">
                    Keep going to master these concepts.
                  </p>
                </div>
              </>
            )}

            {/* Session stats */}
            <div className="flex items-center justify-center gap-8 py-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {correctCount}
                </div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {currentIndex + (showFeedback ? 1 : 0)}
                </div>
                <div className="text-sm text-muted-foreground">Questions</div>
              </div>
            </div>

            {/* Per-concept mastery deltas */}
            {deltas.length > 0 && (
              <div className="space-y-3 text-left max-w-md mx-auto">
                <h3 className="text-sm font-semibold text-center text-muted-foreground">
                  Concept Mastery
                </h3>
                {deltas.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {d.concept_name}
                      </p>
                      <Progress
                        value={masteryPercent(d.p_end)}
                        className="h-1.5 mt-1"
                      />
                    </div>
                    <div className="flex items-center gap-1 text-xs shrink-0">
                      <span className="text-muted-foreground">
                        {masteryPercent(d.p_start)}%
                      </span>
                      <TrendingUp className="w-3 h-3 text-primary" />
                      <span
                        className={
                          d.newly_mastered
                            ? "font-bold text-emerald-600 dark:text-emerald-400"
                            : "font-medium"
                        }
                      >
                        {masteryPercent(d.p_end)}%
                      </span>
                      {d.newly_mastered && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-0.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 justify-center pt-4">
              <Button variant="outline" onClick={onComplete}>
                Back to Overview
              </Button>
              <Button
                onClick={() => {
                  // Request a fresh session
                  setSessionComplete(false);
                  setCurrentIndex(0);
                  setSelectedAnswer(null);
                  setCurrentResult(null);
                  setShowFeedback(false);
                  setCorrectCount(0);
                  setConceptDeltas(new Map());
                  setLoading(true);
                  fetchBktSession(user!.id, courseId, topicId).then((s) => {
                    if (s) {
                      setSession(s);
                      if (s.all_mastered) setSessionComplete(true);
                    }
                    setLoading(false);
                    setQuestionStartTime(Date.now());
                  });
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Continue Learning
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---------- Active question ----------

  const progressPercent = ((currentIndex + 1) / session.questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Studying</p>
          <h2 className="text-lg font-semibold">
            {currentQuestion!.concept_name}
          </h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onExit}>
          <X className="w-4 h-4 mr-1" />
          Exit
        </Button>
      </div>

      {/* Session progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Session progress</span>
          <span className="font-medium">
            {currentIndex + 1}/{session.questions.length}
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Mastery delta (live, after feedback) */}
      {showFeedback && currentResult && (
        <div className="flex items-center justify-center gap-2 text-sm py-1">
          <span className="text-muted-foreground">
            {currentQuestion!.concept_name} mastery:
          </span>
          <span>{masteryPercent(currentResult.p_mastery_before)}%</span>
          <TrendingUp
            className={`w-4 h-4 ${
              currentResult.p_mastery_after > currentResult.p_mastery_before
                ? "text-emerald-500"
                : "text-rose-500"
            }`}
          />
          <span
            className={
              currentResult.is_newly_mastered
                ? "font-bold text-emerald-600 dark:text-emerald-400"
                : "font-medium"
            }
          >
            {masteryPercent(currentResult.p_mastery_after)}%
          </span>
          {currentResult.is_newly_mastered && (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium ml-1">
              Mastered!
            </span>
          )}
        </div>
      )}

      {/* Question Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardDescription>
              Question {currentIndex + 1} of {session.questions.length}
            </CardDescription>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                currentQuestion!.difficulty_level === "easy"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : currentQuestion!.difficulty_level === "medium"
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {currentQuestion!.difficulty_level}
            </span>
          </div>
          <CardTitle className="text-lg leading-relaxed">
            {currentQuestion!.question}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Options */}
          <div className="space-y-3">
            {currentQuestion!.options.map((option) => {
              const idx = option.index;
              const isSelected = selectedAnswer === idx;
              const isCorrectOption =
                currentResult != null &&
                idx === currentResult.correct_option_index;
              const showResult = showFeedback && currentResult != null;

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(idx)}
                  disabled={showFeedback || submitting}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    !showResult
                      ? isSelected
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/40 hover:bg-muted/50"
                      : isSelected && !isCorrectOption
                        ? "border-rose-500 bg-rose-50 dark:bg-rose-950/20"
                        : isCorrectOption
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                          : "border-muted bg-muted/20"
                  } ${showFeedback ? "cursor-default" : "cursor-pointer"}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`font-medium ${
                        showResult && isCorrectOption
                          ? "text-emerald-600 dark:text-emerald-400"
                          : showResult && isSelected && !isCorrectOption
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {getOptionLabel(idx)}.
                    </span>
                    <div className="flex-1">
                      <p>{option.text}</p>

                      {/* Explanation appears on the correct option */}
                      {showResult &&
                        isCorrectOption &&
                        currentResult?.explanation && (
                          <div className="mt-3 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-emerald-700 dark:text-emerald-300">
                              {currentResult.explanation}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Hint */}
          {currentQuestion!.hint && !showFeedback && (
            <div className="pt-2">
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Lightbulb className="w-4 h-4" />
                <span>{showHint ? "Hide hint" : "Show hint"}</span>
              </button>
              {showHint && (
                <p className="mt-2 text-sm text-muted-foreground pl-6">
                  {currentQuestion!.hint}
                </p>
              )}
            </div>
          )}

          {/* Next button */}
          {showFeedback && (
            <div className="pt-4 flex justify-end">
              <Button onClick={handleNext} className="gap-2">
                {currentIndex === session.questions.length - 1
                  ? "See Results"
                  : "Next Question"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
