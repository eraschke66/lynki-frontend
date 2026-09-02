import { ActiveRecallStage } from "../ActiveRecallStage";
import { ConnectionsStage } from "../ConnectionsStage";
import { MasteryDeltaStage } from "../MasteryDeltaStage";
import { MnemonicStage } from "../MnemonicStage";
import { QuizStage } from "../QuizStage";
import { RecallCardsStage } from "../RecallCardsStage";
import { TendingLoading } from "../TendingLoading";
import {
  persistActiveRecallStage,
  persistConnectionStage,
  persistMnemonicStage,
  persistQuizStage,
  persistRecallStage,
} from "../../services/tendingProgressApi";
import { computeMasteryPassProbabilityDelta } from "./masteryPassProbability";
import type { TendingFlow } from "../../hooks/useTendingFlow";

interface TendingStageSwitchProps {
  flow: TendingFlow;
  courseId: string;
  topicId: string;
}

/** Renders whichever stage the machine is currently on. */
export function TendingStageSwitch({ flow, courseId, topicId }: TendingStageSwitchProps) {
  const { machine, state, handleSkip, completeError, handleRetryComplete } = flow;

  switch (state.currentStage) {
    case "recall_cards":
      return state.payload ? (
        <RecallCardsStage
          cards={state.payload.recall_cards.cards}
          onComplete={(results) => {
            machine.recordRecall(results);
            machine.advance();
            void persistRecallStage(state.sessionId, results).catch(() => {});
          }}
          onSkip={handleSkip}
        />
      ) : null;

    case "active_recall":
      return state.payload ? (
        <ActiveRecallStage
          sessionId={state.sessionId}
          prompt={state.payload.active_recall.prompt}
          sourceParagraphFallback={state.payload.active_recall.source_paragraph}
          onComplete={(result) => {
            machine.recordActiveRecall(result);
            machine.advance();
            void persistActiveRecallStage(state.sessionId).catch(() => {});
          }}
          onSkip={handleSkip}
        />
      ) : null;

    case "mnemonics":
      return state.payload ? (
        <MnemonicStage
          mnemonics={state.payload.mnemonics.mnemonics}
          onComplete={(results) => {
            machine.recordMnemonics(results);
            machine.advance();
            void persistMnemonicStage(state.sessionId, results).catch(() => {});
          }}
          onSkip={handleSkip}
        />
      ) : null;

    case "connections":
      return state.payload ? (
        <ConnectionsStage
          pairs={state.payload.connections.pairs}
          type={state.payload.connections.type}
          onComplete={(results) => {
            machine.recordConnections(results);
            machine.advance();
            void persistConnectionStage(state.sessionId, results).catch(() => {});
          }}
          onSkip={handleSkip}
        />
      ) : null;

    case "quiz":
      return (
        <QuizStage
          courseId={courseId}
          topicId={topicId}
          onComplete={(result) => {
            machine.recordQuiz(result);
            machine.advance();
            void persistQuizStage(state.sessionId, result).catch(() => {});
          }}
          onSkip={handleSkip}
        />
      );

    case "mastery_delta":
      if (state.masteryDelta) {
        return (
          <MasteryDeltaStage
            courseId={courseId}
            topicId={topicId}
            delta={state.masteryDelta}
            stagesSkipped={state.stagesSkipped}
            startedAt={state.startedAt}
            passProbability={computeMasteryPassProbabilityDelta(state.masterySnapshot, state.masteryDelta)}
          />
        );
      }
      if (completeError) {
        return (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="max-w-md text-center">
              <p className="font-serif text-ghibli-canopy mb-4">{completeError}</p>
              <button type="button" className="text-sm text-ghibli-forest hover:underline" onClick={handleRetryComplete}>
                Try again
              </button>
            </div>
          </div>
        );
      }
      return <TendingLoading staticMessage="Measuring how much your bed grew…" />;

    default:
      return null;
  }
}
