import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { fetchQuiz, submitQuizAttempt } from "../services/quizService";
import type { Quiz, QuizAnswer } from "@/types/quiz";

export function QuizTaking() {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [showHint, setShowHint] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadQuiz() {
      if (!quizId) return;

      try {
        setLoading(true);
        const data = await fetchQuiz(quizId);
        setQuiz(data);
      } catch (err) {
        console.error("Failed to load quiz:", err);
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [quizId]);

  if (loading || !quiz) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-background to-muted/20">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];
  const selectedAnswer = answers.get(currentQuestion.id);
  const allAnswered = answers.size === quiz.questions.length;

  const handleSelectOption = (optionIndex: number) => {
    // Only allow selection if no answer has been selected yet
    if (selectedAnswer !== undefined) return;

    setAnswers(new Map(answers.set(currentQuestion.id, optionIndex)));
    setShowHint(false);
  };

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowHint(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowHint(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !allAnswered) return;

    setSubmitting(true);
    try {
      const quizAnswers: QuizAnswer[] = Array.from(answers.entries()).map(
        ([questionId, selectedOption]) => ({
          questionId,
          selectedOption,
        }),
      );

      const result = await submitQuizAttempt(quiz.id, user.id, quizAnswers);
      navigate(`/quiz/${quiz.id}/results`, { state: { result } });
    } catch (err) {
      console.error("Failed to submit quiz:", err);
      alert("Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getOptionLabel = (index: number) => {
    return String.fromCharCode(65 + index); // A, B, C, D
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 pt-8 pb-16">
        <div className="space-y-8">
          {/* Header with progress indicator */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {currentIndex + 1}/{quiz.questions.length}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/quizzes")}
            >
              <X className="w-4 h-4 mr-1" />
              Exit Quiz
            </Button>
          </div>

          {/* Segmented Progress Bar */}
          <div className="flex gap-1">
            {quiz.questions.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  idx <= currentIndex ? "bg-primary" : "bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>

          {/* Question */}
          <div>
            <p className="text-lg mb-6">
              <span className="font-semibold">{currentIndex + 1}.</span>{" "}
              {currentQuestion.question}
            </p>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrect = idx === currentQuestion.correctAnswer;
                const showFeedback = selectedAnswer !== undefined;
                const shouldShowExplanation =
                  showFeedback && (isSelected || isCorrect);

                return (
                  <div key={idx}>
                    <button
                      onClick={() => handleSelectOption(idx)}
                      disabled={selectedAnswer !== undefined}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                        !showFeedback
                          ? isSelected
                            ? "border-primary bg-background hover:bg-accent/50"
                            : "border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 hover:border-muted-foreground/40"
                          : isSelected && !isCorrect
                            ? "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/20"
                            : isCorrect
                              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20"
                              : "border-muted-foreground/10 bg-muted/20"
                      } ${selectedAnswer !== undefined ? "cursor-default" : "cursor-pointer group"}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-base font-medium text-muted-foreground shrink-0 pt-0.5">
                          {getOptionLabel(idx)}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-base leading-relaxed">{option}</p>

                          {/* Feedback */}
                          {shouldShowExplanation &&
                            currentQuestion.explanation && (
                              <div className="mt-3">
                                <div className="flex items-start gap-2">
                                  {isSelected && !isCorrect ? (
                                    <X className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-1" />
                                  ) : isCorrect ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-1" />
                                  ) : null}
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`text-sm font-medium mb-1 ${
                                        isSelected && !isCorrect
                                          ? "text-rose-600 dark:text-rose-400"
                                          : "text-emerald-600 dark:text-emerald-400"
                                      }`}
                                    >
                                      {isSelected && !isCorrect
                                        ? "Not quite"
                                        : "Right answer"}
                                    </p>
                                    <p
                                      className={`text-sm leading-relaxed ${
                                        isSelected && !isCorrect
                                          ? "text-rose-900/80 dark:text-rose-100/80"
                                          : "text-emerald-900/80 dark:text-emerald-100/80"
                                      }`}
                                    >
                                      {currentQuestion.explanation}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Hint Section */}
            {currentQuestion.hint && (
              <div className="mt-6">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Show hint</span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${showHint ? "rotate-90" : ""}`}
                  />
                </button>
                {showHint && (
                  <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                    <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{currentQuestion.hint}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            {currentIndex === quiz.questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
                className="gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Quiz
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="gap-2"
                disabled={selectedAnswer === undefined}
              >
                Next Question
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
