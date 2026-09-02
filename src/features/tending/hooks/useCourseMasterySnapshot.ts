import { useEffect, useRef } from "react";
import type { AuthUser } from "@/features/auth";
import { fetchCourseMasterySnapshot } from "../services/tendingApi";
import type { TendingMachine } from "../state/tendingMachine";

/**
 * Snapshot course-level concept mastery once per session so MasteryDelta can
 * render pass-probability before/after. Runs in parallel with generateSession;
 * failure is silent and the screen falls back to topic-only mastery.
 * Ref-guarded (not just a state check) so a legitimate state change
 * elsewhere in the flow — e.g. init()/hydrate() firing after this effect's
 * first pass — can't trigger a second fetch before the first one resolves.
 */
export function useCourseMasterySnapshot(courseId: string | undefined, user: AuthUser | null, machine: TendingMachine) {
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!courseId || !user) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    let cancelled = false;
    fetchCourseMasterySnapshot(user.id, courseId).then((snap) => {
      if (cancelled || !snap) return;
      machine.setMasterySnapshot(snap);
    });
    return () => {
      cancelled = true;
    };
  }, [courseId, user, machine]);
}
