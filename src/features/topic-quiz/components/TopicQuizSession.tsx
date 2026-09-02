import { useTopicQuizSession } from "../hooks/useTopicQuizSession";
import type { TopicQuizCompletionResult } from "../hooks/useTopicQuizSession";
import { TopicQuizLoadingScreen } from "./session-screens/TopicQuizLoadingScreen";
import { TopicQuizErrorScreen } from "./session-screens/TopicQuizErrorScreen";
import { TopicQuizEmptyScreen } from "./session-screens/TopicQuizEmptyScreen";
import { TopicQuizResultsScreen } from "./session-screens/TopicQuizResultsScreen";
import { TopicQuizActiveScreen } from "./session-screens/TopicQuizActiveScreen";

export type { TopicQuizCompletionResult };

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
  const quiz = useTopicQuizSession({ courseId, topicId, onComplete, embedded });

  if (quiz.isLoading) {
    return (
      <TopicQuizLoadingScreen
        embedded={embedded}
        showSlowLink={quiz.showSlowLink}
        onRetry={() => quiz.refetch()}
      />
    );
  }

  if (quiz.error) {
    return (
      <TopicQuizErrorScreen
        embedded={embedded}
        errorMessage={(quiz.error as Error).message}
        onRetry={() => quiz.refetch()}
      />
    );
  }

  if (!quiz.questions.length) {
    return <TopicQuizEmptyScreen embedded={embedded} onExit={onExit} />;
  }

  // ── Results (standalone only) ──
  if (quiz.quizComplete && !embedded) {
    return (
      <TopicQuizResultsScreen
        embedded={embedded}
        topicName={quiz.session?.topic_name}
        correctCount={quiz.correctCount}
        totalQuestions={quiz.totalQuestions}
        onStudyAgain={quiz.handleStudyAgain}
        onExit={onExit}
      />
    );
  }

  // Embedded + complete: parent will unmount; render nothing meaningful.
  if (quiz.quizComplete && embedded) return null;

  return (
    <TopicQuizActiveScreen
      embedded={embedded}
      topicName={quiz.session?.topic_name}
      currentIndex={quiz.currentIndex}
      totalQuestions={quiz.totalQuestions}
      correctCount={quiz.correctCount}
      currentQuestion={quiz.currentQuestion!}
      selectedOption={quiz.selectedOption}
      feedback={quiz.feedback}
      submitting={quiz.submitting}
      onSelectOption={quiz.handleSelectOption}
      onNext={quiz.handleNext}
    />
  );
}
