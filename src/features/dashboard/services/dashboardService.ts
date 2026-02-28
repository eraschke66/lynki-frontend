import { supabase } from "@/lib/supabase";
import { retryDocumentProcessing as retryDocProcessing } from "@/features/documents/services/documentService";
import type { DashboardData, CourseSummary } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

/**
 * Retry processing a failed or stuck document
 */
export async function retryDocumentProcessing(
  documentId: string,
): Promise<boolean> {
  const result = await retryDocProcessing(documentId);
  return result.success;
}

/**
 * Fetch pass chance for a single course from the backend.
 * Returns null if no data available or on error.
 */
async function fetchCoursePassChance(
  userId: string,
  courseId: string,
): Promise<number | null> {
  try {
    const res = await fetch(
      `${API_URL}/test/pass-chance/${userId}/${courseId}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Only return a meaningful pass chance if the user has actually attempted questions
    if (data.total_skills === 0) return null;
    return data.pass_probability ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch all dashboard data for a user (course-centric).
 *
 * Simple aggregation: courses, document counts, and pass chance per course.
 */
export async function fetchDashboardData(
  userId: string,
): Promise<DashboardData> {
  // 1. Fetch user's courses
  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select("id, title, description, created_at, updated_at, target_grade")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (coursesError) {
    console.error("Error fetching courses:", coursesError);
    throw coursesError;
  }

  if (!courses || courses.length === 0) {
    return {
      courses: [],
      totalCourses: 0,
    };
  }

  const courseIds = courses.map((c) => c.id);

  // 2. Fetch all documents for these courses
  const { data: documents } = await supabase
    .from("documents")
    .select("id, course_id, status")
    .in("course_id", courseIds);

  // Count documents per course, track processing
  const docCountByCourse = new Map<string, number>();
  const processingByCourse = new Map<string, boolean>();

  documents?.forEach((doc) => {
    docCountByCourse.set(
      doc.course_id,
      (docCountByCourse.get(doc.course_id) || 0) + 1,
    );
    if (doc.status === "pending" || doc.status === "processing") {
      processingByCourse.set(doc.course_id, true);
    }
  });

  // 3. Check if user has any BKT mastery data (to decide whether to fetch pass chances)
  const { data: masteryCheck } = await supabase
    .from("bkt_mastery")
    .select("course_id, n_attempts")
    .eq("user_id", userId)
    .in("course_id", courseIds)
    .gt("n_attempts", 0)
    .limit(1);

  const hasAnyMastery = masteryCheck && masteryCheck.length > 0;

  // 4. Fetch pass chances per course (only if user has tested at all)
  const passChanceByCourse = new Map<string, number | null>();
  if (hasAnyMastery) {
    // Get which courses have activity
    const { data: activeRows } = await supabase
      .from("bkt_mastery")
      .select("course_id")
      .eq("user_id", userId)
      .in("course_id", courseIds)
      .gt("n_attempts", 0);

    const activeCourseIds = new Set(activeRows?.map((r) => r.course_id) ?? []);

    // Fetch pass chances in parallel for active courses
    const promises = Array.from(activeCourseIds).map(async (cid) => {
      const pc = await fetchCoursePassChance(userId, cid);
      passChanceByCourse.set(cid, pc);
    });
    await Promise.all(promises);
  }

  // 5. Build course summaries
  const courseSummaries: CourseSummary[] = courses.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    documentCount: docCountByCourse.get(c.id) || 0,
    passChance: passChanceByCourse.get(c.id) ?? null,
    targetGrade: c.target_grade ?? 1.0,
    hasProcessing: processingByCourse.get(c.id) || false,
    createdAt: c.created_at,
    updatedAt: c.updated_at || c.created_at,
  }));

  return {
    courses: courseSummaries,
    totalCourses: courseSummaries.length,
  };
}
