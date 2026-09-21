import { useActiveRecallStage } from "../hooks/useActiveRecallStage";
import { EmptyTimeoutScreen } from "./active-recall/EmptyTimeoutScreen";
import { RecallPromptScreen } from "./active-recall/RecallPromptScreen";
import { RecallEvaluationScreen } from "./active-recall/RecallEvaluationScreen";
import type { ActiveRecallResult } from "../types";

interface ActiveRecallStageProps {
  sessionId: string;
  prompt: string;
  sourceParagraphFallback: string;
  onComplete: (result: ActiveRecallResult) => void;
  onSkip: () => void;
}

export function ActiveRecallStage({ sessionId, prompt, sourceParagraphFallback, onComplete, onSkip }: ActiveRecallStageProps) {
  const stage = useActiveRecallStage(sessionId, onComplete);

  if (stage.emptyTimeout) {
    return <EmptyTimeoutScreen onRetry={stage.handleRetry} onSkip={onSkip} />;
  }

  // Stay on the prompt only while the student is still writing, or when a
  // submit failed (the prompt screen owns the error + "Try again" UI). The
  // instant they submit, flip to the results layout in its pending state so
  // the wait is spent reading their answer and the source paragraph.
  if (!stage.evaluation && !stage.submitting) {
    return (
      <RecallPromptScreen
        prompt={prompt}
        response={stage.response}
        onResponseChange={stage.setResponse}
        submitting={stage.submitting}
        submitError={stage.submitError}
        secondsLeft={stage.secondsLeft}
        onSubmit={stage.submit}
        onSkip={onSkip}
      />
    );
  }

  return (
    <RecallEvaluationScreen
      response={stage.response}
      evaluation={stage.evaluation}
      sourceParagraphFallback={sourceParagraphFallback}
      onContinue={stage.handleContinue}
      onSkip={onSkip}
    />
  );
}
