/**
 * BKT-driven study service (course-scoped).
 *
 * All intelligence lives on the backend. This service is a thin API client:
 * - fetchCourseProgress  → GET /bkt/progress/:userId/:courseId
 * - fetchBktSession      → GET /bkt/session/:userId/:courseId
 * - submitAnswer          → POST /bkt/answer
 */

import type {
  CourseProgress,
  BKTSession,
  AnswerRequest,
  AnswerResult,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

/**
 * Fetch full course progress tree (topics → concepts with BKT mastery).
 * Aggregates across all documents in the course.
 */
export async function fetchCourseProgress(
  courseId: string,
  userId: string,
): Promise<CourseProgress | null> {
  try {
    const res = await fetch(`${API_URL}/bkt/progress/${userId}/${courseId}`);
    if (!res.ok) {
      console.error("Failed to fetch progress:", res.status, await res.text());
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching course progress:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

/**
 * Fetch an adaptive study session from the backend.
 * The backend uses BKT mastery + weighted random to select questions
 * from all documents in the course.
 * Questions do NOT include correct answers — validation is server-side.
 */
export async function fetchBktSession(
  userId: string,
  courseId: string,
  topicId?: string,
): Promise<BKTSession | null> {
  try {
    const url = new URL(`${API_URL}/bkt/session/${userId}/${courseId}`);
    if (topicId) {
      url.searchParams.set("topic_id", topicId);
    }
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("Failed to fetch session:", res.status, await res.text());
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching BKT session:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Answer
// ---------------------------------------------------------------------------

/**
 * Submit a single answer to the backend.
 * The backend checks correctness, runs BKT update, records the attempt,
 * and returns feedback (correct/wrong, explanation, updated mastery).
 */
export async function submitAnswer(
  request: AnswerRequest,
): Promise<AnswerResult | null> {
  try {
    const res = await fetch(`${API_URL}/bkt/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      console.error("Failed to submit answer:", res.status, await res.text());
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error("Error submitting answer:", error);
    return null;
  }
}
