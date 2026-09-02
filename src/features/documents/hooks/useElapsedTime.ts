import { useEffect, useState } from "react";

/**
 * Ticks once a second while `startedAt` is set, returning elapsed ms since
 * then. Backs the "still working — Xs" reassurance and slow-processing
 * affordance shown while a document is being read/analyzed, instead of a
 * bare spinner with no sense of time passing.
 */
export function useElapsedTime(startedAt: string | null | undefined): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) return 0;
  return Math.max(0, now - new Date(startedAt).getTime());
}
