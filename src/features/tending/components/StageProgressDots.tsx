import { STAGE_LABEL, STAGE_ORDER, VISIBLE_STAGES, type Stage } from "../types";

interface StageProgressDotsProps {
  currentStage: Stage;
  stagesSkipped: Stage[];
}

/**
 * 6 dots — one per visible stage. Filled = active, faded = completed,
 * outlined-only = skipped. Hover/tap reveals the stage name via title attr.
 */
export function StageProgressDots({ currentStage, stagesSkipped }: StageProgressDotsProps) {
  const skipped = new Set(stagesSkipped);
  const currentIdx = STAGE_ORDER.indexOf(currentStage);

  return (
    <div className="flex items-center gap-2" aria-label="Session progress">
      {VISIBLE_STAGES.map((stage) => {
        const stageIdx = STAGE_ORDER.indexOf(stage);
        const isCurrent = stage === currentStage;
        const isCompleted = stageIdx < currentIdx && !skipped.has(stage);
        const isSkipped = skipped.has(stage);

        let cls = "w-2 h-2 rounded-full transition-all";
        if (isCurrent) {
          cls = "w-3 h-3 rounded-full bg-ghibli-canopy shadow-sm";
        } else if (isCompleted) {
          cls = "w-2 h-2 rounded-full bg-ghibli-moss/50";
        } else if (isSkipped) {
          cls = "w-2 h-2 rounded-full border border-gray-400/60 bg-transparent";
        } else {
          cls = "w-2 h-2 rounded-full bg-ghibli-moss/15";
        }

        return (
          <span
            key={stage}
            className={cls}
            title={STAGE_LABEL[stage]}
            aria-current={isCurrent ? "step" : undefined}
          />
        );
      })}
    </div>
  );
}
