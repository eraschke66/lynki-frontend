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

  if (!stage.evaluation) {
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
