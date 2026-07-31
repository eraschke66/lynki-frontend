import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";
import type { MasteryDelta, Stage } from "../types";
import { STAGE_LABEL } from "../types";

interface MasteryDeltaStageProps {
  courseId: string;
  /** Topic id for the session — used by the "View Garden" exit so the
   *  garden can pulse the roots touching this topic. */
  topicId: string;
  delta: MasteryDelta;
  stagesSkipped: Stage[];
  startedAt: number;
  /** Optional pass-probability before/after — rendered whenever both are
   *  non-null, including when the value did not change. */
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

/** Pool of skipped-stage nudges. One picked at random per render — no
 *  per-line tracking needed; pool size and frequency keep repeats acceptable. */
const SKIP_NUDGE_POOL = [
  "That's not a herb patch, you've grown a real garden.",
  "Before you had sprouts, now you have enough vegetables for a salad.",
  "Those beans grew like in Jack and the Beanstalk.",
  "You came in with a window box, you left with a flowerbed.",
  "That patch went from bare dirt to dinner.",
  "What was a sapling this morning is a tree by tonight.",
  "Started with weeds, ended with wildflowers.",
  "That's a tomato vine where there used to be a stick.",
  "Yesterday it was a seed packet. Today it's a harvest.",
  "You walked in with a sprig of basil and walked out with a vegetable garden.",
];

export function MasteryDeltaStage({
  courseId,
  topicId,
  delta,
  stagesSkipped,
  startedAt,
  passProbability,
}: MasteryDeltaStageProps) {
  const navigate = useNavigate();
  // Snapshot "now" at mount so the displayed duration doesn't drift on re-render.
  const [snapshotNow] = useState(() => Date.now());
  // Pick a nudge once per mount so it doesn't shuffle if the component re-renders.
  const [nudge] = useState(
    () => SKIP_NUDGE_POOL[Math.floor(Math.random() * SKIP_NUDGE_POOL.length)],
  );
  const beforePct = Math.round(delta.mastery_before * 100);
  const afterPct = Math.round(delta.mastery_after * 100);
  const diffPct = afterPct - beforePct;
  const minutes = Math.max(1, Math.round((snapshotNow - startedAt) / 60_000));

  const heroTier = plantTierFromPercent(afterPct);

  const showPass =
    passProbability &&
    passProbability.before !== null &&
    passProbability.after !== null;
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

      <p className="text-xs uppercase tracking-wider text-ghibli-forest font-medium mt-2 mb-3">
        {delta.topic_title}
      </p>

      <h2 className="font-serif text-2xl md:text-3xl text-ghibli-canopy text-center mb-2 leading-snug px-4">
        This corner of the garden grew from{" "}
        <span className="font-semibold">{beforePct}%</span> →{" "}
        <span className="font-semibold">{afterPct}%</span>
      </h2>
      <p className="text-ghibli-forest text-sm">
        {diffPct >= 0 ? `+${diffPct}%` : `${diffPct}%`} in {minutes}{" "}
        {minutes === 1 ? "minute" : "minutes"}
      </p>

      {showPass && passBefore !== null && passAfter !== null && passDiff !== null && (() => {
        const verdictColor =
          passDiff > 0
            ? "text-ghibli-canopy"
            : passDiff < 0
              ? "text-amber-700"
              : "text-ghibli-bark";
        const deltaLabel =
          passDiff > 0
            ? `+${passDiff} points`
            : passDiff < 0
              ? `${passDiff} points`
              : "0 points";
        return (
          <div
            className={`mt-3 w-full max-w-md flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm ${verdictColor}`}
          >
            <span>
              Your pass probability moved from{" "}
              <span className="tabular-nums font-semibold">{passBefore}%</span>{" "}
              to{" "}
              <span className="tabular-nums font-semibold">{passAfter}%</span>.
            </span>
            <span className="tabular-nums font-semibold">{deltaLabel}</span>
          </div>
        );
      })()}

      {delta.kc_breakdown.length > 0 && (
        <details className="mt-5 text-left max-w-md w-full px-4">
          <summary className="text-sm text-ghibli-canopy cursor-pointer hover:text-ghibli-canopy">
            See what shifted
          </summary>
          <ul className="mt-3 space-y-2">
            {delta.kc_breakdown.map((kc) => (
              <li
                key={kc.kc_id}
                className="text-sm flex items-center justify-between gap-2"
              >
                <span className="text-ghibli-canopy">{kc.name}</span>
                <span className="text-ghibli-forest tabular-nums">
                  {Math.round(kc.before * 100)}% → {Math.round(kc.after * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {stagesSkipped.length > 0 && (
        <ParchmentCard className="p-5 mt-6 text-sm w-full max-w-lg" hover={false}>
          <p className="text-ghibli-canopy">{nudge}</p>
          <p className="mt-2 text-xs text-ghibli-forest">
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
          onClick={() =>
            navigate(`/course/${courseId}/garden?just_tended=${topicId}`)
          }
        >
          View Garden
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
