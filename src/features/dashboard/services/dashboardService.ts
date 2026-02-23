import { supabase } from "@/lib/supabase";
import { retryDocumentProcessing as retryDocProcessing } from "@/features/documents/services/documentService";
import type { DashboardData, CourseSummary } from "../types";

/** BKT mastery threshold — matches backend */
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
 * Uses BKT mastery (bkt_mastery table) as the single source of truth
 * for progress. Aggregates across all documents in each course.
 */
export async function fetchDashboardData(
  userId: string,
): Promise<DashboardData> {
  // 1. Fetch user's courses
  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select("id, title, description, created_at, updated_at")
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
      nextStudyItem: null,
    };
  }

  const courseIds = courses.map((c) => c.id);

  // 2. Fetch all documents for these courses
  const { data: documents } = await supabase
    .from("documents")
    .select("id, course_id, status")
    .in("course_id", courseIds);

  // Count documents per course, and track which have processing docs
  const docCountByCourse = new Map<string, number>();
  const processingByCourse = new Map<string, boolean>();
  const docIdsByCourse = new Map<string, string[]>();

  documents?.forEach((doc) => {
    docCountByCourse.set(
      doc.course_id,
      (docCountByCourse.get(doc.course_id) || 0) + 1,
    );
    if (doc.status === "pending" || doc.status === "processing") {
      processingByCourse.set(doc.course_id, true);
    }
    const ids = docIdsByCourse.get(doc.course_id) || [];
    ids.push(doc.id);
    docIdsByCourse.set(doc.course_id, ids);
  });

  // 3. Fetch topics + concept counts for all documents
  const allDocIds = documents?.map((d) => d.id) || [];
  const { data: topics } =
    allDocIds.length > 0
      ? await supabase
          .from("topics")
          .select("id, document_id, concepts(id)")
          .in("document_id", allDocIds)
      : { data: [] };

  // Build concept count per course (via document → topic → concepts)
  const conceptCountByCourse = new Map<string, number>();
  const allConceptIds: string[] = [];

  topics?.forEach((topic) => {
    const docId = topic.document_id;
    // Find which course this document belongs to
    const courseId = documents?.find((d) => d.id === docId)?.course_id;
    if (!courseId) return;

    const concepts = (topic.concepts as { id: string }[]) || [];
    conceptCountByCourse.set(
      courseId,
      (conceptCountByCourse.get(courseId) || 0) + concepts.length,
    );
    concepts.forEach((c) => allConceptIds.push(c.id));
  });

  // 4. Fetch BKT mastery for all courses at once
  const { data: masteryData } =
    courseIds.length > 0
      ? await supabase
          .from("bkt_mastery")
          .select("course_id, knowledge_component_id, p_mastery, n_attempts")
          .eq("user_id", userId)
          .in("course_id", courseIds)
      : { data: [] };

  // Group mastery by course
  const masteredByCourse = new Map<string, number>();
  const hasActivityByCourse = new Map<string, boolean>();

  masteryData?.forEach((row) => {
    const cid = row.course_id as string | null;
    if (!cid) return;
    const courseId: string = cid;
    if (row.p_mastery >= MASTERY_THRESHOLD) {
      masteredByCourse.set(courseId, (masteredByCourse.get(courseId) || 0) + 1);
    }
    if (row.n_attempts > 0) {
      hasActivityByCourse.set(courseId, true);
    }
  });

  // 5. Build course summaries
  const courseSummaries: CourseSummary[] = courses.map((c) => {
    const totalConcepts = conceptCountByCourse.get(c.id) || 0;
    const masteredConcepts = masteredByCourse.get(c.id) || 0;
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      documentCount: docCountByCourse.get(c.id) || 0,
      totalConcepts,
      masteredConcepts,
      progressPercent:
        totalConcepts > 0
          ? Math.round((masteredConcepts / totalConcepts) * 100)
          : 0,
      hasProcessing: processingByCourse.get(c.id) || false,
      createdAt: c.created_at,
      updatedAt: c.updated_at || c.created_at,
    };
  });

  // 6. Calculate totals
  const totalConceptsMastered = courseSummaries.reduce(
    (sum, c) => sum + c.masteredConcepts,
    0,
  );
  const totalConcepts = courseSummaries.reduce(
    (sum, c) => sum + c.totalConcepts,
    0,
  );

  // 7. Determine next study item
  let nextStudyItem: DashboardData["nextStudyItem"] = null;

  // Priority: course with in-progress activity, then new course with content, then review
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
    overallProgress:
      totalConcepts > 0
        ? Math.round((totalConceptsMastered / totalConcepts) * 100)
        : 0,
    nextStudyItem,
  };
}
