/**
 * BKT-driven study service.
 *
 * All intelligence lives on the backend. This service is a thin API client:
 * - fetchDocumentProgress → GET /bkt/progress/:userId/:documentId
 * - fetchBktSession       → GET /bkt/session/:userId/:documentId
 * - submitAnswer           → POST /bkt/answer
 */

import type {
  DocumentProgress,
  BKTSession,
  AnswerRequest,
  AnswerResult,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

/**
 * Fetch full document progress tree (topics → concepts with BKT mastery).
 */
export async function fetchDocumentProgress(
  documentId: string,
  userId: string,
): Promise<DocumentProgress | null> {
  try {
    const res = await fetch(`${API_URL}/bkt/progress/${userId}/${documentId}`);
    if (!res.ok) {
      console.error("Failed to fetch progress:", res.status, await res.text());
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching document progress:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

/**
 * Fetch an adaptive study session from the backend.
 * The backend uses BKT mastery + weighted random to select questions.
 * Questions do NOT include correct answers — validation is server-side.
 */
export async function fetchBktSession(
  userId: string,
  documentId: string,
  topicId?: string,
): Promise<BKTSession | null> {
  try {
    const url = new URL(`${API_URL}/bkt/session/${userId}/${documentId}`);
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
