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
}

// V1 stub of F9. Day 5 polish: animate the number, plant tier-up,
// "See what shifted" expand. For now: real numbers, plain layout.
export function MasteryDeltaStage({
  courseId,
  delta,
  stagesSkipped,
  startedAt,
}: MasteryDeltaStageProps) {
  const navigate = useNavigate();
  // Snapshot "now" at mount so the displayed duration doesn't drift on re-render.
  const [snapshotNow] = useState(() => Date.now());
  const beforePct = Math.round(delta.mastery_before * 100);
  const afterPct = Math.round(delta.mastery_after * 100);
  const diffPct = afterPct - beforePct;
  const minutes = Math.max(1, Math.round((snapshotNow - startedAt) / 60_000));

  return (
    <div className="max-w-xl mx-auto w-full">
      <ParchmentCard className="p-8 md:p-10 text-center">
        <p className="text-xs uppercase tracking-wider text-ghibli-moss/80 font-medium mb-3">
          {delta.topic_title}
        </p>
        <h2 className="font-serif text-3xl md:text-4xl text-ghibli-canopy mb-2">
          This bed grew from <span className="font-semibold">{beforePct}%</span> →{" "}
          <span className="font-semibold">{afterPct}%</span>
        </h2>
        <p className="text-ghibli-moss/80 text-sm">
          {diffPct >= 0 ? `+${diffPct}%` : `${diffPct}%`} in {minutes}{" "}
          {minutes === 1 ? "minute" : "minutes"}
        </p>

        {delta.kc_breakdown.length > 0 && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-ghibli-canopy/80 cursor-pointer hover:text-ghibli-canopy">
              See what shifted
            </summary>
            <ul className="mt-3 space-y-2">
              {delta.kc_breakdown.map((kc) => (
                <li key={kc.kc_id} className="text-sm flex items-center justify-between gap-2">
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

      {stagesSkipped.length > 0 && (
        <ParchmentCard className="p-5 mt-4 text-sm" hover={false}>
          <p className="text-ghibli-canopy/90">
            You moved fast today — skipped {stagesSkipped.length}{" "}
            {stagesSkipped.length === 1 ? "stage" : "stages"}. Tending the full bed usually moves
            the needle further.
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
