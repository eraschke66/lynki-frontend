import type { TopicMastery } from "@/features/courses/types";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000/api/v1";

/**
 * Call FastAPI to generate (or regenerate) an AI study plan for a user+course.
 * The backend fetches BKT data, calls Claude Sonnet, and upserts into study_plans.
 * Returns plan_json: { markdown: string, version: 2 }
 */
export async function generateStudyPlan(
  userId: string,
  courseId: string,
): Promise<{ plan_json: Record<string, unknown>; generated_at: string }> {
  const controller = new AbortController();
  // 90s timeout to survive Render cold starts
  const timer = setTimeout(() => controller.abort(), 90_000);
  try {
    const res = await fetch(`${API_URL}/study-plan/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, course_id: courseId }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { detail?: string }).detail ?? "Failed to generate study plan");
    }
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Returns topics with at least one unmastered concept, sorted weakest-first.
 * Used by the topic breakdown accordion below the AI plan.
 */
export function getWeakTopics(topics: TopicMastery[]): TopicMastery[] {
  return topics
    .filter((t) => t.mastered_concepts < t.total_concepts)
    .sort((a, b) => a.overall_progress - b.overall_progress);
}
