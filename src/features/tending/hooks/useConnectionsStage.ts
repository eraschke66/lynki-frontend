import { useEffect, useMemo, useState } from "react";
import type { ConnectionPair, ConnectionResult } from "../types";

const STUCK_THRESHOLD = 3; // wrong drops in a row → unlock Continue

/** Match state, shuffled right column, and touch-detection behind the Connections stage. */
export function useConnectionsStage(pairs: ConnectionPair[], onComplete: (results: ConnectionResult[]) => void) {
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

  return {
    matchedIds,
    wrongStreak,
    flashTargetId,
    pulseId,
    selectedLeftId,
    setSelectedLeftId,
    isTouch,
    rightOrder,
    allMatched,
    stuck,
    showContinue,
    recordMatchAttempt,
    handleContinue,
  };
}
