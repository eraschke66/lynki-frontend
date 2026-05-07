import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { PlantIndicator } from "@/components/garden/PlantIndicator";
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

  const showPass =
    passProbability &&
    passProbability.before !== null &&
    passProbability.after !== null &&
    Math.round(passProbability.before * 100) !== Math.round(passProbability.after * 100);
  const passBefore = passProbability ? Math.round(passProbability.before * 100) : null;
  const passAfter = passProbability ? Math.round(passProbability.after * 100) : null;
  const passDiff = passBefore !== null && passAfter !== null ? passAfter - passBefore : null;

  return (
    <div className="relative max-w-xl mx-auto w-full">
      {/* Layered foliage — left & right, ~30% opacity, behind the parchment.
          Hidden on small screens so the card stays the focal point. */}
      <img
        src="/foliage-left-v2.png"
        alt=""
        aria-hidden="true"
        className="hidden md:block absolute -left-20 -top-6 w-44 h-auto opacity-30 pointer-events-none select-none"
        style={{ mixBlendMode: "darken" }}
      />
      <img
        src="/foliage-right-v2.png"
        alt=""
        aria-hidden="true"
        className="hidden md:block absolute -right-20 -top-6 w-44 h-auto opacity-30 pointer-events-none select-none"
        style={{ mixBlendMode: "darken" }}
      />

      <div className="relative">
        {/* Subtle leaf-edge ring at 30% — the foliage frame from the spec. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[28px] botanical-border opacity-30"
        />
        <ParchmentCard className="p-8 md:p-12 text-center relative" hover={false}>
          <p className="text-xs uppercase tracking-wider text-ghibli-moss/80 font-medium mb-5">
            {delta.topic_title}
          </p>

          {/* Plant — sized as the payoff. Sunlight halo behind it. */}
          <div className="relative flex justify-center mb-5">
            <div
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div
                className="w-56 h-56 md:w-64 md:h-64 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, hsl(48 95% 80% / 0.55) 0%, hsl(48 95% 80% / 0.25) 40%, transparent 75%)",
                  filter: "blur(8px)",
                }}
              />
            </div>
            <PlantIndicator
              probability={afterPct}
              size="xl"
              glow
              showPercent={false}
            />
          </div>

          <h2 className="font-serif text-2xl md:text-3xl text-ghibli-canopy mb-2 leading-snug">
            This corner of the garden grew from{" "}
            <span className="font-semibold">{beforePct}%</span> →{" "}
            <span className="font-semibold">{afterPct}%</span>
          </h2>
          <p className="text-ghibli-moss/80 text-sm">
            {diffPct >= 0 ? `+${diffPct}%` : `${diffPct}%`} in {minutes}{" "}
            {minutes === 1 ? "minute" : "minutes"}
          </p>

          {showPass && passBefore !== null && passAfter !== null && (
            <p className="mt-4 text-sm text-ghibli-canopy/85">
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
            <details className="mt-6 text-left">
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
        </ParchmentCard>
      </div>

      {stagesSkipped.length > 0 && (
        <ParchmentCard className="p-5 mt-4 text-sm relative" hover={false}>
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

      <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center relative">
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
