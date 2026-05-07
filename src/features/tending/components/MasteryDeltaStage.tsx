import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";
import type { MasteryDelta, Stage } from "../types";
import { STAGE_LABEL } from "../types";

interface MasteryDeltaStageProps {
  courseId: string;
  delta: MasteryDelta;
  stagesSkipped: Stage[];
  startedAt: number;
  /** Optional pass-probability before/after — rendered only when both are
   *  non-null and they actually moved. */
  passProbability?: { before: number; after: number } | null;
}

/** Mirror PlantIndicator's tier mapping so the hero plant matches what a
 *  student sees on the dashboard for the same mastery level. */
function plantTierFromPercent(pct: number): number {
  return pct >= 80 ? 3 : pct >= 55 ? 2 : pct >= 30 ? 1 : 0;
}

const PLANT_STAGES = [
  "/plant-stage-1.png",
  "/plant-stage-2.png",
  "/plant-stage-3.png",
  "/plant-stage-4.png",
];

export function MasteryDeltaStage({
  courseId,
  delta,
  stagesSkipped,
  startedAt,
  passProbability,
}: MasteryDeltaStageProps) {
  const navigate = useNavigate();
  // Snapshot "now" at mount so the displayed duration doesn't drift on re-render.
  const [snapshotNow] = useState(() => Date.now());
  const beforePct = Math.round(delta.mastery_before * 100);
  const afterPct = Math.round(delta.mastery_after * 100);
  const diffPct = afterPct - beforePct;
  const minutes = Math.max(1, Math.round((snapshotNow - startedAt) / 60_000));

  const heroTier = plantTierFromPercent(afterPct);

  const showPass =
    passProbability &&
    passProbability.before !== null &&
    passProbability.after !== null &&
    Math.round(passProbability.before * 100) !== Math.round(passProbability.after * 100);
  const passBefore = passProbability ? Math.round(passProbability.before * 100) : null;
  const passAfter = passProbability ? Math.round(passProbability.after * 100) : null;
  const passDiff = passBefore !== null && passAfter !== null ? passAfter - passBefore : null;

  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col items-center">
      {/* Hero plant — dominant visual on the page. The plant IS the celebration. */}
      <img
        src={PLANT_STAGES[heroTier]}
        alt={`Plant at growth tier ${heroTier + 1}`}
        className="w-72 sm:w-96 md:w-[28rem] lg:w-[36rem] h-auto object-contain animate-glow-soft select-none"
        style={{ mixBlendMode: "darken" }}
      />

      <p className="text-xs uppercase tracking-wider text-ghibli-moss/80 font-medium mt-2 mb-3">
        {delta.topic_title}
      </p>

      <h2 className="font-serif text-2xl md:text-3xl text-ghibli-canopy text-center mb-2 leading-snug px-4">
        This corner of the garden grew from{" "}
        <span className="font-semibold">{beforePct}%</span> →{" "}
        <span className="font-semibold">{afterPct}%</span>
      </h2>
      <p className="text-ghibli-moss/80 text-sm">
        {diffPct >= 0 ? `+${diffPct}%` : `${diffPct}%`} in {minutes}{" "}
        {minutes === 1 ? "minute" : "minutes"}
      </p>

      {showPass && passBefore !== null && passAfter !== null && (
        <p className="mt-3 text-sm text-ghibli-canopy/85">
          Pass probability:{" "}
          <span className="tabular-nums">{passBefore}%</span> →{" "}
          <span className="font-semibold tabular-nums">{passAfter}%</span>
          {passDiff !== null && passDiff !== 0 && (
            <span className="text-ghibli-moss/75 ml-1.5 text-xs">
              ({passDiff > 0 ? `+${passDiff}` : passDiff}%)
            </span>
          )}
        </p>
      )}

      {delta.kc_breakdown.length > 0 && (
        <details className="mt-5 text-left max-w-md w-full px-4">
          <summary className="text-sm text-ghibli-canopy/80 cursor-pointer hover:text-ghibli-canopy">
            See what shifted
          </summary>
          <ul className="mt-3 space-y-2">
            {delta.kc_breakdown.map((kc) => (
              <li
                key={kc.kc_id}
                className="text-sm flex items-center justify-between gap-2"
              >
                <span className="text-ghibli-canopy">{kc.name}</span>
                <span className="text-ghibli-moss/80 tabular-nums">
                  {Math.round(kc.before * 100)}% → {Math.round(kc.after * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {stagesSkipped.length > 0 && (
        <ParchmentCard className="p-5 mt-6 text-sm w-full max-w-lg" hover={false}>
          <p className="text-ghibli-canopy/90">
            You moved fast today — skipped {stagesSkipped.length}{" "}
            {stagesSkipped.length === 1 ? "stage" : "stages"}. That's the difference
            between a nursery and an orchard.
          </p>
          <p className="mt-2 text-xs text-ghibli-moss/70">
            Skipped: {stagesSkipped.map((s) => STAGE_LABEL[s]).join(", ")}
          </p>
        </ParchmentCard>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
        <Button onClick={() => navigate(`/course/${courseId}/study-plan`)}>
          Back to Study Plan
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(`/course/${courseId}/study-plan?next=true`)}
        >
          Tend another topic
        </Button>
      </div>
    </div>
  );
}
