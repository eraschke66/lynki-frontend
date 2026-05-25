import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";
import { SkipStageLink } from "./SkipStageLink";
import type { ConnectionPair, ConnectionResult, ConnectionType } from "../types";

const COLUMN_HEADERS: Record<ConnectionType, [string, string]> = {
  term_to_definition: ["Term", "Definition"],
  cause_to_effect: ["Cause", "Effect"],
  person_to_contribution: ["Person", "Contribution"],
  event_to_year: ["Event", "Year"],
};

const STUCK_THRESHOLD = 3; // wrong drops in a row → unlock Continue

interface ConnectionsStageProps {
  pairs: ConnectionPair[];
  type: ConnectionType;
  onComplete: (results: ConnectionResult[]) => void;
  onSkip: () => void;
}

export function ConnectionsStage({ pairs, type, onComplete, onSkip }: ConnectionsStageProps) {
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [attemptsById, setAttemptsById] = useState<Record<string, number>>({});
  const [wrongStreak, setWrongStreak] = useState(0);
  const [flashTargetId, setFlashTargetId] = useState<string | null>(null);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [isTouch, setIsTouch] = useState(false);

  // Shuffle the right column once so left+right rows aren't trivially aligned.
  const rightOrder = useMemo(() => {
    const arr = [...pairs];
    // Stable seedless shuffle — pairs is small enough that this runs once.
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairs.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: coarse)");
    setIsTouch(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const allMatched = matchedIds.size === pairs.length;
  const stuck = wrongStreak >= STUCK_THRESHOLD;
  const showContinue = allMatched || stuck;

  const recordMatchAttempt = (leftId: string, targetId: string) => {
    setAttemptsById((prev) => ({ ...prev, [leftId]: (prev[leftId] ?? 0) + 1 }));
    if (leftId === targetId) {
      const next = new Set(matchedIds);
      next.add(leftId);
      setMatchedIds(next);
      setWrongStreak(0);
      setPulseId(leftId);
      setSelectedLeftId(null);
      window.setTimeout(() => setPulseId(null), 600);
    } else {
      setWrongStreak((n) => n + 1);
      setFlashTargetId(targetId);
      window.setTimeout(() => setFlashTargetId(null), 500);
    }
  };

  const handleContinue = () => {
    const results: ConnectionResult[] = pairs.map((p) => ({
      id: p.id,
      attempts: attemptsById[p.id] ?? 0,
      matched: matchedIds.has(p.id),
    }));
    onComplete(results);
  };

  const [leftHeader, rightHeader] = COLUMN_HEADERS[type] ?? ["Left", "Right"];

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="text-center mb-5">
        <p className="text-xs uppercase tracking-wider text-ghibli-moss-strong font-medium">
          {matchedIds.size} of {pairs.length} connected
        </p>
        {isTouch && !allMatched && (
          <p className="text-xs text-ghibli-moss-weak mt-1">
            Tap a {leftHeader.toLowerCase()}, then tap its {rightHeader.toLowerCase()}.
          </p>
        )}
      </div>

      <ParchmentCard className="p-5 md:p-6" hover={false}>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-wider text-ghibli-moss-medium font-medium pb-1 border-b border-ghibli-moss/15">
              {leftHeader}
            </p>
            {pairs.map((p) => {
              const isMatched = matchedIds.has(p.id);
              const isSelected = selectedLeftId === p.id;
              const isPulsing = pulseId === p.id;
              return (
                <div
                  key={p.id}
                  draggable={!isMatched && !isTouch}
                  style={!isMatched && !isTouch ? ({ WebkitUserDrag: "element" } as React.CSSProperties) : undefined}
                  onDragStart={(e) => {
                    if (isMatched) return;
                    e.dataTransfer.setData("text/plain", p.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => {
                    if (isMatched) return;
                    if (!isTouch) return;
                    setSelectedLeftId(isSelected ? null : p.id);
                  }}
                  className={[
                    "rounded-md border p-3 text-sm font-sans transition-all select-none",
                    isMatched
                      ? "bg-ghibli-moss/10 border-ghibli-moss/40 text-ghibli-canopy-medium line-through cursor-default"
                      : "bg-cream-50 border-ghibli-moss/30 text-ghibli-canopy cursor-grab active:cursor-grabbing hover:border-ghibli-moss/60",
                    isSelected ? "ring-2 ring-ghibli-canopy/60" : "",
                    isPulsing ? "bg-emerald-100/70 border-emerald-500/60" : "",
                  ].join(" ")}
                >
                  <span className="flex items-start gap-2">
                    {isMatched && <Check className="w-3.5 h-3.5 mt-0.5 text-emerald-700 shrink-0" />}
                    <span>{p.left}</span>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-wider text-ghibli-moss-medium font-medium pb-1 border-b border-ghibli-moss/15">
              {rightHeader}
            </p>
            {rightOrder.map((p) => {
              const isMatched = matchedIds.has(p.id);
              const isFlashing = flashTargetId === p.id;
              const isPulsing = pulseId === p.id;
              return (
                <div
                  key={p.id}
                  onDragOver={(e) => {
                    if (isMatched || isTouch) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    if (isMatched || isTouch) return;
                    e.preventDefault();
                    const leftId = e.dataTransfer.getData("text/plain");
                    if (leftId) recordMatchAttempt(leftId, p.id);
                  }}
                  onClick={() => {
                    if (isMatched) return;
                    if (!isTouch) return;
                    if (!selectedLeftId) return;
                    recordMatchAttempt(selectedLeftId, p.id);
                  }}
                  className={[
                    "rounded-md border p-3 text-sm font-sans transition-all select-none",
                    isMatched
                      ? "bg-ghibli-moss/10 border-ghibli-moss/40 text-ghibli-canopy-medium cursor-default"
                      : "bg-cream-50 border-ghibli-moss/30 text-ghibli-canopy hover:border-ghibli-moss/60",
                    isTouch && !isMatched && selectedLeftId ? "cursor-pointer" : "",
                    isFlashing ? "bg-amber-100 border-amber-500/70" : "",
                    isPulsing ? "bg-emerald-100/70 border-emerald-500/60" : "",
                  ].join(" ")}
                >
                  {p.right}
                </div>
              );
            })}
          </div>
        </div>
      </ParchmentCard>

      {showContinue && (
        <div className="flex justify-center mt-6">
          <Button onClick={handleContinue}>Continue</Button>
        </div>
      )}
      {!showContinue && stuck && (
        <p className="text-xs text-ghibli-moss-medium text-center mt-4">
          Stuck? Skip when you're ready.
        </p>
      )}

      <SkipStageLink onSkip={onSkip} />
    </div>
  );
}
