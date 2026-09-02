import { useEffect, useRef } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { gardenQueryKeys } from "@/lib/queryKeys";
import type { CourseGardenData } from "@/features/courses/types";
import type { AuthUser } from "@/features/auth";

/**
 * Snapshot the topic's current overall_progress from the garden query cache
 * BEFORE Tending starts changing it. Used by the garden's "tended-topic
 * own-tick" animation on return. Cache-only — we don't issue a new fetch
 * just for this; if the user landed on Tending without visiting the garden
 * first, the animation is silently skipped on return. (Commit 3.)
 */
export function usePreTendSnapshot(
  courseId: string | undefined,
  topicId: string | undefined,
  user: AuthUser | null,
  queryClient: QueryClient,
) {
  const takenRef = useRef(false);

  useEffect(() => {
    if (!courseId || !topicId || !user) return;
    if (takenRef.current) return;
    takenRef.current = true;
    const cached = queryClient.getQueryData<CourseGardenData>(gardenQueryKeys.progress(courseId, user.id));
    const topic = cached?.topics.find((t) => t.topic_id === topicId);
    if (topic) {
      sessionStorage.setItem(`passai:pre_tend_progress:${topicId}`, String(topic.overall_progress));
    }
  }, [courseId, topicId, user, queryClient]);
}
