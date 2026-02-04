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
} from "lucide-react";
import {
  startStudySession,
  recordQuestionAttempt,
} from "../services/studyService";
import type { StudySession as StudySessionType } from "../types";
import { MASTERY_CONFIG } from "../types";

interface StudySessionProps {
  conceptId: string;
  documentId: string;
  onComplete: (wasMastered: boolean) => void;
  onExit: () => void;
}

export function StudySession({
  conceptId,
  onComplete,
  onExit,
}: StudySessionProps) {
  const { user } = useAuth();

  const [session, setSession] = useState<StudySessionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [wasMastered, setWasMastered] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  // Track progress towards mastery in this session
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0);
  const [totalCorrectNeeded, setTotalCorrectNeeded] = useState<number>(MASTERY_CONFIG.CORRECT_TO_MASTER);

  useEffect(() => {
    async function loadSession() {
      if (!user) return;

      setLoading(true);
      const newSession = await startStudySession(conceptId, user.id);

      if (newSession) {
        setSession(newSession);
        setTotalCorrectNeeded(
          Math.max(1, MASTERY_CONFIG.CORRECT_TO_MASTER - newSession.correctCount)
        );
      }
      setLoading(false);
      setQuestionStartTime(Date.now());
    }

    loadSession();
  }, [conceptId, user]);

  const currentQuestion = session?.questions[session.currentQuestionIndex];

  const handleSelectOption = useCallback(
    async (optionIndex: number) => {
      if (!session || !currentQuestion || !user || showFeedback) return;

      const timeSpent = Date.now() - questionStartTime;
      const correct = optionIndex === currentQuestion.correctAnswer;

      setSelectedAnswer(optionIndex);
      setShowFeedback(true);

      // Record the attempt
      const result = await recordQuestionAttempt(
        user.id,
        {
          questionId: currentQuestion.id,
          conceptId: currentQuestion.conceptId,
          selectedOption: optionIndex,
          isCorrect: correct,
          timeSpentMs: timeSpent,
        },
        session.sessionId
      );

      // Update session state
      if (correct) {
        setSessionCorrectCount((prev) => prev + 1);
      }

      // Check if mastered
      if (result.isMastered) {
        setWasMastered(true);
      }
    },
    [session, currentQuestion, user, showFeedback, questionStartTime]
  );

  const handleNext = useCallback(() => {
    if (!session) return;

    const nextIndex = session.currentQuestionIndex + 1;

    // Check if session should end
    const reachedMastery = wasMastered;
    const reachedMaxQuestions = nextIndex >= session.questions.length;
    const reachedSessionGoal = sessionCorrectCount >= totalCorrectNeeded;

    if (reachedMastery || reachedMaxQuestions || reachedSessionGoal) {
      setSessionComplete(true);
      return;
    }

    // Move to next question
    setSession({
      ...session,
      currentQuestionIndex: nextIndex,
    });
    setSelectedAnswer(null);
    setShowFeedback(false);
    setShowHint(false);
    setQuestionStartTime(Date.now());
  }, [session, wasMastered, sessionCorrectCount, totalCorrectNeeded]);

  const handleComplete = () => {
    onComplete(wasMastered);
  };

  const getOptionLabel = (index: number) => {
    return String.fromCharCode(65 + index);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading study session...</p>
        </div>
      </div>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              No questions available for this concept yet.
            </p>
            <Button variant="outline" onClick={onExit}>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Session complete screen
  if (sessionComplete) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-6">
            {wasMastered ? (
              <>
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                  <Trophy className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    Concept Mastered! 🎉
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    You've demonstrated understanding of{" "}
                    <span className="font-medium">{session.conceptName}</span>
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
                    Keep practicing to master{" "}
                    <span className="font-medium">{session.conceptName}</span>
                  </p>
                </div>
              </>
            )}

            <div className="flex items-center justify-center gap-8 py-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {sessionCorrectCount}
                </div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {session.currentQuestionIndex + 1}
                </div>
                <div className="text-sm text-muted-foreground">Questions</div>
              </div>
            </div>

            <div className="flex gap-3 justify-center pt-4">
              <Button variant="outline" onClick={handleComplete}>
                Back to Overview
              </Button>
              {!wasMastered && (
                <Button
                  onClick={() => {
                    setSessionComplete(false);
                    setSession({
                      ...session,
                      currentQuestionIndex: 0,
                    });
                    setSelectedAnswer(null);
                    setShowFeedback(false);
                    setSessionCorrectCount(0);
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Continue Practicing
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercent = Math.min(
    100,
    (sessionCorrectCount / totalCorrectNeeded) * 100
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Studying</p>
          <h2 className="text-lg font-semibold">{session.conceptName}</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onExit}>
          <X className="w-4 h-4 mr-1" />
          Exit
        </Button>
      </div>

      {/* Progress towards mastery */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress to mastery</span>
          <span className="font-medium">
            {sessionCorrectCount}/{totalCorrectNeeded} correct
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardDescription>
              Question {session.currentQuestionIndex + 1} of{" "}
              {session.questions.length}
            </CardDescription>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                currentQuestion.difficultyLevel === "easy"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : currentQuestion.difficultyLevel === "medium"
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {currentQuestion.difficultyLevel}
            </span>
          </div>
          <CardTitle className="text-lg leading-relaxed">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === currentQuestion.correctAnswer;
              const showResult = showFeedback;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={showFeedback}
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
                      <p>{option}</p>

                      {/* Feedback for this option */}
                      {showResult && isCorrectOption && currentQuestion.explanation && (
                        <div className="mt-3 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <p className="text-sm text-emerald-700 dark:text-emerald-300">
                            {currentQuestion.explanation}
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
          {currentQuestion.hint && !showFeedback && (
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
                  {currentQuestion.hint}
                </p>
              )}
            </div>
          )}

          {/* Next button */}
          {showFeedback && (
            <div className="pt-4 flex justify-end">
              <Button onClick={handleNext} className="gap-2">
                {session.currentQuestionIndex === session.questions.length - 1 ||
                sessionCorrectCount >= totalCorrectNeeded
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
