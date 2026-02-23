import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/circular-progress";
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
  XCircle,
} from "lucide-react";
import { fetchBktSession, submitAnswer } from "../services/studyService";
import type { BKTSession, SessionQuestion, AnswerResult } from "../types";

/* ── Per-concept delta tracker ────────────────────────── */
interface ConceptDelta {
  concept_name: string;
  p_start: number;
  p_end: number;
  newly_mastered: boolean;
}

/* ── Props ────────────────────────────────────────────── */
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
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [correctCount, setCorrectCount] = useState(0);
  const [conceptDeltas, setConceptDeltas] = useState<Map<string, ConceptDelta>>(
    new Map(),
  );

  /* ── Load session ───────────────────────────────────── */
  useEffect(() => {
    async function loadSession() {
      if (!user) return;
      setLoading(true);
      const bktSession = await fetchBktSession(user.id, courseId, topicId);
      if (bktSession) {
        setSession(bktSession);
        if (bktSession.all_mastered) setSessionComplete(true);
      }
      setLoading(false);
      setQuestionStartTime(Date.now());
    }
    loadSession();
  }, [topicId, courseId, user]);

  const currentQuestion: SessionQuestion | undefined =
    session?.questions[currentIndex];

  /* ── Submit answer ──────────────────────────────────── */
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
        if (result.is_correct) setCorrectCount((prev) => prev + 1);

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
    [session, currentQuestion, user, showFeedback, submitting, questionStartTime, courseId],
  );

  /* ── Next question ──────────────────────────────────── */
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

  /* ── Restart session ────────────────────────────────── */
  const handleRestart = useCallback(() => {
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
  }, [user, courseId, topicId]);

  const pct = (p: number) => Math.round(p * 100);
  const anyNewlyMastered = Array.from(conceptDeltas.values()).some(
    (d) => d.newly_mastered,
  );

  /* ═══════════════════════════════════════════════════════
   * RENDER: Loading
   * ═══════════════════════════════════════════════════ */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-80">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">
            Preparing your session...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center space-y-4 py-16">
        <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Failed to load session.
        </p>
        <Button variant="outline" size="sm" onClick={onExit}>
          Go Back
        </Button>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
   * RENDER: All mastered (empty session)
   * ═══════════════════════════════════════════════════ */
  if (session.all_mastered && session.questions.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-16 max-w-sm mx-auto space-y-5">
        <CircularProgress value={100} size={120} strokeWidth={10} />
        <div>
          <h2 className="text-xl font-bold text-emerald-500">All Mastered!</h2>
          <p className="text-sm text-muted-foreground mt-1">
            You've mastered every concept in this topic.
          </p>
        </div>
        <Button variant="outline" onClick={onComplete}>
          Back to Overview
        </Button>
      </div>
    );
  }

  if (!currentQuestion && !sessionComplete) {
    return (
      <div className="text-center space-y-4 py-16">
        <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No questions available for this topic yet.
        </p>
        <Button variant="outline" size="sm" onClick={onExit}>
          Go Back
        </Button>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
   * RENDER: Session complete
   * ═══════════════════════════════════════════════════ */
  if (sessionComplete) {
    const deltas = Array.from(conceptDeltas.values());
    const totalAnswered = currentIndex + (showFeedback ? 1 : 0);
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    return (
      <div className="max-w-lg mx-auto py-8 space-y-8">
        {/* Header celebration */}
        <div className="text-center space-y-4">
          {anyNewlyMastered ? (
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8 text-emerald-500" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold">
              {anyNewlyMastered ? "Concepts Mastered!" : "Good Progress!"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {anyNewlyMastered
                ? "Amazing work this session!"
                : "Keep going to master these concepts."}
            </p>
          </div>
        </div>

        {/* Stat rings */}
        <div className="flex items-center justify-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <CircularProgress
              value={accuracy}
              size={72}
              strokeWidth={6}
              labelClassName="text-sm"
            />
            <span className="text-xs text-muted-foreground">Accuracy</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center w-18 h-18">
              <span className="text-3xl font-bold tabular-nums">
                {correctCount}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              of {totalAnswered} correct
            </span>
          </div>
        </div>

        {/* Concept mastery deltas */}
        {deltas.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
              Concept Progress
            </h3>
            <div className="space-y-1.5">
              {deltas.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-muted/40"
                >
                  {/* Concept name */}
                  <span className="flex-1 text-sm font-medium truncate">
                    {d.concept_name}
                  </span>

                  {/* Mini bar */}
                  <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        d.newly_mastered ? "bg-emerald-500" : "bg-primary"
                      }`}
                      style={{ width: `${pct(d.p_end)}%` }}
                    />
                  </div>

                  {/* Delta text */}
                  <div className="flex items-center gap-1 text-xs shrink-0 tabular-nums w-24 justify-end">
                    <span className="text-muted-foreground">
                      {pct(d.p_start)}%
                    </span>
                    <TrendingUp className="w-3 h-3 text-primary" />
                    <span
                      className={
                        d.newly_mastered
                          ? "font-bold text-emerald-500"
                          : "font-semibold"
                      }
                    >
                      {pct(d.p_end)}%
                    </span>
                    {d.newly_mastered && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" onClick={onComplete}>
            Back to Overview
          </Button>
          <Button className="gap-2" onClick={handleRestart}>
            <Sparkles className="w-4 h-4" />
            Continue Learning
          </Button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
   * RENDER: Active question
   * ═══════════════════════════════════════════════════ */
  const totalQ = session.questions.length;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* ── Top bar: dots + exit ── */}
      <div className="flex items-center gap-3">
        {/* Step dots */}
        <div className="flex-1 flex items-center gap-1">
          {session.questions.map((_, i) => {
            const isAnswered = i < currentIndex || (i === currentIndex && showFeedback);
            const isCurrent = i === currentIndex && !showFeedback;
            return (
              <div
                key={i}
                className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                  isAnswered
                    ? "bg-primary"
                    : isCurrent
                      ? "bg-primary/40"
                      : "bg-muted"
                }`}
              />
            );
          })}
        </div>

        {/* Counter */}
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {currentIndex + 1}/{totalQ}
        </span>

        {/* Exit */}
        <button
          onClick={onExit}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── Concept label ── */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          {currentQuestion!.concept_name}
        </span>
        {currentQuestion!.difficulty_level && (
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              currentQuestion!.difficulty_level === "easy"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : currentQuestion!.difficulty_level === "medium"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
            }`}
          >
            {currentQuestion!.difficulty_level}
          </span>
        )}
      </div>

      {/* ── Question text ── */}
      <h2 className="text-lg font-semibold leading-relaxed">
        {currentQuestion!.question}
      </h2>

      {/* ── Mastery feedback (inline, after answer) ── */}
      {showFeedback && currentResult && (
        <div
          className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl ${
            currentResult.is_correct
              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300"
          }`}
        >
          {currentResult.is_correct ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0" />
          )}
          <span className="font-medium">
            {currentResult.is_correct ? "Correct!" : "Incorrect"}
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-xs tabular-nums">
            Mastery: {pct(currentResult.p_mastery_before)}%
            <TrendingUp
              className={`w-3 h-3 ${
                currentResult.p_mastery_after >= currentResult.p_mastery_before
                  ? "text-emerald-500"
                  : "text-rose-500"
              }`}
            />
            <span
              className={
                currentResult.is_newly_mastered
                  ? "font-bold text-emerald-500"
                  : "font-semibold"
              }
            >
              {pct(currentResult.p_mastery_after)}%
            </span>
            {currentResult.is_newly_mastered && (
              <span className="text-emerald-500 font-bold ml-1">Mastered!</span>
            )}
          </span>
        </div>
      )}

      {/* ── Options ── */}
      <div className="space-y-2.5">
        {currentQuestion!.options.map((option) => {
          const idx = option.index;
          const isSelected = selectedAnswer === idx;
          const isCorrectOption =
            currentResult != null && idx === currentResult.correct_option_index;
          const showResult = showFeedback && currentResult != null;

          return (
            <button
              key={option.id}
              onClick={() => handleSelectOption(idx)}
              disabled={showFeedback || submitting}
              className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-200 ${
                !showResult
                  ? isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                  : isSelected && !isCorrectOption
                    ? "border-rose-400 bg-rose-50 dark:bg-rose-950/20"
                    : isCorrectOption
                      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
                      : "border-border bg-muted/10 opacity-60"
              } ${showFeedback ? "cursor-default" : "cursor-pointer"}`}
            >
              <div className="flex items-start gap-3">
                {/* Option letter badge */}
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    showResult && isCorrectOption
                      ? "bg-emerald-500 text-white"
                      : showResult && isSelected && !isCorrectOption
                        ? "bg-rose-500 text-white"
                        : isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </span>

                <div className="flex-1 pt-0.5">
                  <p className="text-sm">{option.text}</p>

                  {/* Explanation on correct answer */}
                  {showResult &&
                    isCorrectOption &&
                    currentResult?.explanation && (
                      <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                        {currentResult.explanation}
                      </p>
                    )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Hint ── */}
      {currentQuestion!.hint && !showFeedback && (
        <div>
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>{showHint ? "Hide hint" : "Need a hint?"}</span>
          </button>
          {showHint && (
            <p className="mt-2 text-sm text-muted-foreground pl-5">
              {currentQuestion!.hint}
            </p>
          )}
        </div>
      )}

      {/* ── Next button ── */}
      {showFeedback && (
        <div className="flex justify-end pt-2">
          <Button onClick={handleNext} size="lg" className="gap-2">
            {currentIndex === totalQ - 1 ? "See Results" : "Next"}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
