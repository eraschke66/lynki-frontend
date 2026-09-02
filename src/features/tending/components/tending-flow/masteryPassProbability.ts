import { computePassProbability } from "@/lib/passProbability";
import type { CourseMasterySnapshot, MasteryDelta } from "../../types";

/** Pass-probability before/after this session, from the pre-session snapshot plus the delta's per-concept results. */
export function computeMasteryPassProbabilityDelta(
  snapshot: CourseMasterySnapshot | null,
  delta: MasteryDelta,
): { before: number; after: number } | null {
  if (!snapshot) return null;

  const before = snapshot.concepts.map((c) => c.p_mastery);
  const overrides = new Map(delta.kc_breakdown.map((kc) => [kc.kc_id, kc.after]));
  const after = snapshot.concepts.map((c) => overrides.get(c.kc_id) ?? c.p_mastery);

  const passBefore = computePassProbability(before, snapshot.targetGrade);
  const passAfter = computePassProbability(after, snapshot.targetGrade);
  if (passBefore === null || passAfter === null) return null;

  return { before: passBefore, after: passAfter };
}
