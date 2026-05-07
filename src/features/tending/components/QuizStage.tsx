import { TopicQuizSession, type TopicQuizCompletionResult } from "@/features/topic-quiz";
import { SkipStageLink } from "./SkipStageLink";
import type { QuizResult } from "../types";

interface QuizStageProps {
  courseId: string;
  topicId: string;
  onComplete: (result: QuizResult) => void;
  onSkip: () => void;
}

/**
 * Embeds the existing topic-scoped quiz session as the 5th stage of the
 * Tending Flow. Skips the standalone results screen and the inner X button
 * — the outer Tending shell owns those.
 */
export function QuizStage({ courseId, topicId, onComplete, onSkip }: QuizStageProps) {
  return (
    <div className="w-full">
      <TopicQuizSession
        courseId={courseId}
        topicId={topicId}
        embedded
        onComplete={(r: TopicQuizCompletionResult) =>
          onComplete({
            correct: r.correct,
            total: r.total,
            question_ids: r.question_ids,
          })
        }
      />
      <div className="max-w-2xl mx-auto px-6">
        <SkipStageLink onSkip={onSkip} />
      </div>
    </div>
  );
}
