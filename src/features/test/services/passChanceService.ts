import type { PassChanceData } from "../types";
import { supabase } from "@/lib/supabase";
import { computePassProbability } from "@/lib/passProbability";

/**
 * Fetch the current pass chance for a course.
 * Reads mastery directly from Supabase and computes the normal approximation client-side.
 */
export async function fetchPassChance(
  userId: string,
  courseId: string,
): Promise<PassChanceData> {
  const [masteryResult, courseResult] = await Promise.all([
    supabase
      .from("bkt_mastery")
      .select("p_mastery, n_attempts")
      .eq("user_id", userId)
      .eq("course_id", courseId),
    supabase
      .from("courses")
      .select("target_grade")
      .eq("id", courseId)
      .maybeSingle(),
  ]);

  if (masteryResult.error) throw new Error(masteryResult.error.message);

  const rows = masteryResult.data ?? [];
  const targetGrade = (courseResult.data?.target_grade ?? 1.0) as number;
  const totalAttempts = rows.reduce((s, r) => s + (r.n_attempts ?? 0), 0);

  const avgMastery =
    rows.length > 0
      ? rows.reduce((s, r) => s + (r.p_mastery as number), 0) / rows.length
      : null;

  if (totalAttempts === 0 || rows.length === 0) {
    return {
      course_id: courseId,
      pass_probability: null,
      avg_mastery: null,
      target_grade: targetGrade,
      total_skills: rows.length,
    };
  }

  return {
    course_id: courseId,
    pass_probability: computePassProbability(
      rows.map((r) => r.p_mastery),
      targetGrade,
    ),
    avg_mastery: avgMastery,
    target_grade: targetGrade,
    total_skills: rows.length,
  };
}
