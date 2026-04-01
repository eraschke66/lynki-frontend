import { supabase } from "@/lib/supabase";
import { retryDocumentProcessing as retryDocProcessing } from "@/features/documents/services/documentService";
import { computePassProbability } from "@/lib/passProbability";
import type { DashboardData, CourseSummary } from "../types";

/** BKT mastery threshold — concept is considered mastered above this */
const MASTERY_THRESHOLD = 0.85;

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
      totalConceptsMastered: 0,
      totalConcepts: 0,
      overallProgress: 0,
      overallPassProbability: 0,
      nextStudyItem: null,
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
  const allDocIds: string[] = [];

  documents?.forEach((doc) => {
    docCountByCourse.set(
      doc.course_id,
      (docCountByCourse.get(doc.course_id) || 0) + 1,
    );
    if (doc.status === "pending" || doc.status === "processing") {
      processingByCourse.set(doc.course_id, true);
    }
    allDocIds.push(doc.id);
  });

  // 3. Fetch topics + concept counts for all documents
  const { data: topics } =
    allDocIds.length > 0
      ? await supabase
          .from("topics")
          .select("id, document_id, concepts(id)")
          .in("document_id", allDocIds)
      : { data: [] };

  // Build concept count per course (via document → topic → concepts)
  const conceptCountByCourse = new Map<string, number>();

  topics?.forEach((topic) => {
    const docId = topic.document_id;
    const courseId = documents?.find((d) => d.id === docId)?.course_id;
    if (!courseId) return;
    const concepts = (topic.concepts as { id: string }[]) || [];
    conceptCountByCourse.set(
      courseId,
      (conceptCountByCourse.get(courseId) || 0) + concepts.length,
    );
  });

  // 4. Fetch all BKT mastery rows for these courses at once
  const { data: masteryRows } =
    courseIds.length > 0
      ? await supabase
          .from("bkt_mastery")
          .select("course_id, p_mastery, n_attempts")
          .eq("user_id", userId)
          .in("course_id", courseIds)
      : { data: [] };

  // Aggregate mastery per course
  const masteredByCourse = new Map<string, number>();
  const masterySumByCourse = new Map<string, number>();
  const masteryCountByCourse = new Map<string, number>();
  const masteryValuesByCourse = new Map<string, number[]>();
  const hasActivityByCourse = new Map<string, boolean>();

  masteryRows?.forEach((row) => {
    const cid = row.course_id as string | null;
    if (!cid) return;
    if (row.p_mastery >= MASTERY_THRESHOLD) {
      masteredByCourse.set(cid, (masteredByCourse.get(cid) || 0) + 1);
    }
    masterySumByCourse.set(cid, (masterySumByCourse.get(cid) || 0) + row.p_mastery);
    masteryCountByCourse.set(cid, (masteryCountByCourse.get(cid) || 0) + 1);
    const vals = masteryValuesByCourse.get(cid) ?? [];
    vals.push(row.p_mastery);
    masteryValuesByCourse.set(cid, vals);
    if (row.n_attempts > 0) {
      hasActivityByCourse.set(cid, true);
    }
  });

  // 5. Build course summaries (pass probability computed inline from mastery already in memory)
  const courseSummaries: CourseSummary[] = courses.map((c) => {
    const totalConcepts = conceptCountByCourse.get(c.id) || 0;
    const masteredConcepts = masteredByCourse.get(c.id) || 0;
    const hasActivity = hasActivityByCourse.get(c.id) ?? false;
    const masteryValues = masteryValuesByCourse.get(c.id) ?? [];
    const passChance =
      hasActivity && masteryValues.length > 0
        ? computePassProbability(masteryValues, c.target_grade ?? 1.0)
        : null;
    const passProbability =
      passChance !== null ? Math.round(passChance * 100) : 0;

    return {
      id: c.id,
      title: c.title,
      description: c.description,
      documentCount: docCountByCourse.get(c.id) || 0,
      passChance,
      passProbability,
      targetGrade: c.target_grade ?? 1.0,
      totalConcepts,
      masteredConcepts,
      progressPercent: (() => {
        const sum = masterySumByCourse.get(c.id) || 0;
        const count = masteryCountByCourse.get(c.id) || 0;
        return count > 0 ? Math.round((sum / count) * 100) : 0;
      })(),
      hasProcessing: processingByCourse.get(c.id) || false,
      createdAt: c.created_at,
      updatedAt: c.updated_at || c.created_at,
    };
  });

  // 7. Compute totals
  const totalConceptsMastered = courseSummaries.reduce(
    (sum, c) => sum + c.masteredConcepts,
    0,
  );
  const totalConcepts = courseSummaries.reduce(
    (sum, c) => sum + c.totalConcepts,
    0,
  );
  const totalMasterySum = Array.from(masterySumByCourse.values()).reduce((a, b) => a + b, 0);
  const totalMasteryCount = Array.from(masteryCountByCourse.values()).reduce((a, b) => a + b, 0);
  const overallProgress =
    totalMasteryCount > 0
      ? Math.round((totalMasterySum / totalMasteryCount) * 100)
      : 0;

  // Overall pass probability — weighted average by concept count (only courses with data)
  const coursesWithData = courseSummaries.filter((c) => c.passChance !== null);
  const weightedConceptTotal = coursesWithData.reduce(
    (sum, c) => sum + c.totalConcepts,
    0,
  );
  const overallPassProbability =
    weightedConceptTotal > 0
      ? Math.round(
          coursesWithData.reduce(
            (sum, c) => sum + c.passProbability * c.totalConcepts,
            0,
          ) / weightedConceptTotal,
        )
      : coursesWithData.length > 0
        ? Math.round(
            coursesWithData.reduce((sum, c) => sum + c.passProbability, 0) /
              coursesWithData.length,
          )
        : 0;

  // 8. Determine next study item
  let nextStudyItem: DashboardData["nextStudyItem"] = null;

  const inProgressCourse = courseSummaries.find(
    (c) =>
      hasActivityByCourse.get(c.id) &&
      c.totalConcepts > 0 &&
      c.masteredConcepts < c.totalConcepts,
  );
  if (inProgressCourse) {
    nextStudyItem = {
      courseId: inProgressCourse.id,
      courseTitle: inProgressCourse.title,
      reason: "continue",
    };
  }

  if (!nextStudyItem) {
    const newCourse = courseSummaries.find(
      (c) =>
        !hasActivityByCourse.get(c.id) &&
        c.totalConcepts > 0 &&
        c.documentCount > 0,
    );
    if (newCourse) {
      nextStudyItem = {
        courseId: newCourse.id,
        courseTitle: newCourse.title,
        reason: "new",
      };
    }
  }

  if (!nextStudyItem) {
    const reviewCourse = courseSummaries.find(
      (c) => c.totalConcepts > 0 && c.masteredConcepts > 0,
    );
    if (reviewCourse) {
      nextStudyItem = {
        courseId: reviewCourse.id,
        courseTitle: reviewCourse.title,
        reason: "review",
      };
    }
  }

  return {
    courses: courseSummaries,
    totalCourses: courseSummaries.length,
    totalConceptsMastered,
    totalConcepts,
    overallProgress,
    overallPassProbability,
    nextStudyItem,
  };
}
