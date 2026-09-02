import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TopicQuizQuestion } from "../../services/topicQuizService";
import type { LocalFeedback } from "../../hooks/useTopicQuizSession";
import { TopicQuizProgressBar } from "./TopicQuizProgressBar";
import { TopicQuestionCard } from "./TopicQuestionCard";
import { TopicFeedbackBanner } from "./TopicFeedbackBanner";
import { TopicAnswerOptions } from "./TopicAnswerOptions";

export function TopicQuizActiveScreen({
  embedded,
  topicName,
  currentIndex,
  totalQuestions,
  correctCount,
  currentQuestion,
  selectedOption,
  feedback,
  submitting,
  onSelectOption,
  onNext,
}: {
  embedded: boolean;
  topicName: string | undefined;
  currentIndex: number;
  totalQuestions: number;
  correctCount: number;
  currentQuestion: TopicQuizQuestion;
  selectedOption: number | null;
  feedback: LocalFeedback | null;
  submitting: boolean;
  onSelectOption: (optionIndex: number) => void;
  onNext: () => void;
}) {
  const litDots = currentIndex + (feedback ? 1 : 0);
  const progress = litDots / totalQuestions;

  const questionUI = (
    <div className="max-w-2xl w-full mx-auto px-6">
      <TopicQuizProgressBar
        topicName={topicName ?? "Topic Study"}
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        correctCount={correctCount}
        progress={progress}
        litDots={litDots}
      />

      <TopicQuestionCard question={currentQuestion.question} />

      {feedback && <TopicFeedbackBanner feedback={feedback} />}

      <TopicAnswerOptions
        question={currentQuestion}
        selectedOption={selectedOption}
        feedback={feedback}
        submitting={submitting}
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
    </div>
  );

  if (embedded) return questionUI;
  return (
    <div className="relative z-10 min-h-screen flex flex-col py-12 pb-32">
      {questionUI}
    </div>
  );
}
