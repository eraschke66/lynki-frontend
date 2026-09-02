import { ArrowRight, Loader2, X } from "lucide-react";
import GhibliBackground from "@/components/garden/GhibliBackground";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";
import type { AnswerFeedback, TestQuestion } from "../../types";
import { ExitConfirmDialog } from "./ExitConfirmDialog";
import { QuizProgressBar } from "./QuizProgressBar";
import { QuestionCard } from "./QuestionCard";
import { FeedbackBanner } from "./FeedbackBanner";
import { AnswerOptions } from "./AnswerOptions";

export function QuizQuestionScreen({
  courseName,
  currentIndex,
  totalQuestions,
  correctCount,
  currentQuestion,
  selectedOption,
  feedback,
  showExitConfirm,
  onShowExitConfirmChange,
  onExitRequest,
  onConfirmExit,
  onSelectOption,
  onNext,
}: {
  courseName: string;
  currentIndex: number;
  totalQuestions: number;
  correctCount: number;
  currentQuestion: TestQuestion | null;
  selectedOption: number | null;
  feedback: AnswerFeedback | null;
  showExitConfirm: boolean;
  onShowExitConfirmChange: (open: boolean) => void;
  onExitRequest: () => void;
  onConfirmExit: () => void;
  onSelectOption: (optionIndex: number) => void;
  onNext: () => void;
}) {
  // A resumed, fully-answered attempt sits one past the end for the tick
  // before the finish-on-overrun effect fires — clamp what the progress UI
  // shows.
  const shownStep = Math.min(currentIndex + 1, totalQuestions);
  const litDots = currentIndex + (feedback ? 1 : 0);
  const progress = Math.min(litDots, totalQuestions) / totalQuestions;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <GhibliBackground />
      <button
        onClick={onExitRequest}
        className="absolute top-5 right-5 z-30 p-2.5 rounded-full text-ghibli-canopy bg-ghibli-cream/85 backdrop-blur-sm border border-ghibli-moss/40 shadow-sm hover:bg-ghibli-cream hover:border-ghibli-jungle hover:shadow-md transition-all"
        aria-label="Exit quiz"
      >
        <X className="w-5 h-5" strokeWidth={2.5} />
      </button>

      <ExitConfirmDialog
        open={showExitConfirm}
        onOpenChange={onShowExitConfirmChange}
        onConfirmExit={onConfirmExit}
      />

      <div className="relative z-10 min-h-screen flex flex-col py-12 pb-32">
        <div className="max-w-2xl w-full mx-auto px-6">
          <QuizProgressBar
            courseName={courseName}
            shownStep={shownStep}
            totalQuestions={totalQuestions}
            correctCount={correctCount}
            progress={progress}
            litDots={litDots}
          />

          {!currentQuestion ? (
            /* Transient: a resumed, fully-answered attempt, for the tick
               before the finish-on-overrun effect completes it. */
            <ParchmentCard className="p-8 md:p-10 mb-6">
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-ghibli-forest" />
                <h2 className="font-serif text-lg font-semibold text-ghibli-canopy">
                  Gathering what grew&hellip;
                </h2>
              </div>
            </ParchmentCard>
          ) : (
            <>
              <QuestionCard question={currentQuestion.question} />

              {feedback && <FeedbackBanner feedback={feedback} />}

              <AnswerOptions
                question={currentQuestion}
                selectedOption={selectedOption}
                feedback={feedback}
                onSelect={onSelectOption}
              />

              {feedback && (
                <div className="mt-8 flex justify-end">
                  <Button size="lg" className="gap-2 rounded-parchment" onClick={onNext}>
                    {currentIndex + 1 >= totalQuestions ? "See What Grew" : "Next"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
