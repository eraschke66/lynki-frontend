import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";
import { SkipStageLink } from "./SkipStageLink";
import { LeftConnectionItem } from "./connections/LeftConnectionItem";
import { RightConnectionItem } from "./connections/RightConnectionItem";
import { useConnectionsStage } from "../hooks/useConnectionsStage";
import type { ConnectionPair, ConnectionResult, ConnectionType } from "../types";

const COLUMN_HEADERS: Record<ConnectionType, [string, string]> = {
  term_to_definition: ["Term", "Definition"],
  cause_to_effect: ["Cause", "Effect"],
  person_to_contribution: ["Person", "Contribution"],
  event_to_year: ["Event", "Year"],
};

interface ConnectionsStageProps {
  pairs: ConnectionPair[];
  type: ConnectionType;
  onComplete: (results: ConnectionResult[]) => void;
  onSkip: () => void;
}

export function ConnectionsStage({ pairs, type, onComplete, onSkip }: ConnectionsStageProps) {
  const stage = useConnectionsStage(pairs, onComplete);
  const [leftHeader, rightHeader] = COLUMN_HEADERS[type] ?? ["Left", "Right"];

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="text-center mb-5">
        <p className="text-xs uppercase tracking-wider text-ghibli-forest font-medium">
          {stage.matchedIds.size} of {pairs.length} connected
        </p>
        {stage.isTouch && !stage.allMatched && (
          <p className="text-xs text-ghibli-forest mt-1">
            Tap a {leftHeader.toLowerCase()}, then tap its {rightHeader.toLowerCase()}.
          </p>
        )}
      </div>

      <ParchmentCard className="p-5 md:p-6" hover={false}>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-wider text-ghibli-forest font-medium pb-1 border-b border-ghibli-moss/15">
              {leftHeader}
            </p>
            {pairs.map((p) => (
              <LeftConnectionItem
                key={p.id}
                pair={p}
                isMatched={stage.matchedIds.has(p.id)}
                isSelected={stage.selectedLeftId === p.id}
                isPulsing={stage.pulseId === p.id}
                isTouch={stage.isTouch}
                onSelect={() => stage.setSelectedLeftId(stage.selectedLeftId === p.id ? null : p.id)}
              />
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-wider text-ghibli-forest font-medium pb-1 border-b border-ghibli-moss/15">
              {rightHeader}
            </p>
            {stage.rightOrder.map((p) => (
              <RightConnectionItem
                key={p.id}
                pair={p}
                isMatched={stage.matchedIds.has(p.id)}
                isFlashing={stage.flashTargetId === p.id}
                isPulsing={stage.pulseId === p.id}
                isTouch={stage.isTouch}
                canTapToMatch={!!stage.selectedLeftId}
                onDropMatch={(leftId) => stage.recordMatchAttempt(leftId, p.id)}
                onTapMatch={() => stage.selectedLeftId && stage.recordMatchAttempt(stage.selectedLeftId, p.id)}
              />
            ))}
          </div>
        </div>
      </ParchmentCard>

      {stage.showContinue && (
        <div className="flex justify-center mt-6">
          <Button onClick={stage.handleContinue}>Continue</Button>
        </div>
      )}
      {!stage.showContinue && stage.stuck && (
        <p className="text-xs text-ghibli-forest text-center mt-4">Stuck? Skip when you're ready.</p>
      )}

      <SkipStageLink onSkip={onSkip} />
    </div>
  );
}
