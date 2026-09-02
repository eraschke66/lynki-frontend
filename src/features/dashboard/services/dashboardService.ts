import { reportError } from "@/lib/sentry";
import { supabase } from "@/lib/supabase";
import { retryDocumentProcessing as retryDocProcessing } from "@/features/documents/services/documentService";
import { computePassProbability } from "@/lib/passProbability";
import { fromDbCurriculum } from "@/lib/curricula";
import type { DashboardData, CourseSummary } from "../types";

/** BKT mastery threshold — concept is considered mastered above this */
const MASTERY_THRESHOLD = 0.85;

/**
 * Retry processing a failed or stuck document
 */
export async function retryDocumentProcessing(documentId: string): Promise<boolean> {
  const result = await retryDocProcessing(documentId);
  return result.success;
}

async function fetchCourses(userId: string) {
  const { data, error } = await supabase
    .from("courses")
    .select("id, title, description, created_at, updated_at, target_grade, curriculum_type")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    reportError("Error fetching courses (dashboard):", error);
    throw error;
  }
  return data ?? [];
}

type CourseRow = Awaited<ReturnType<typeof fetchCourses>>[number];

async function fetchDocumentsForCourses(courseIds: string[]) {
  const { data } = await supabase.from("documents").select("id, course_id, status").in("course_id", courseIds);
  return data ?? [];
}

type DocumentRow = Awaited<ReturnType<typeof fetchDocumentsForCourses>>[number];

function aggregateDocuments(documents: DocumentRow[]) {
  const docCountByCourse = new Map<string, number>();
  const processingByCourse = new Map<string, boolean>();
  const processingCountByCourse = new Map<string, number>();
  const allDocIds: string[] = [];

  documents.forEach((doc) => {
    docCountByCourse.set(doc.course_id, (docCountByCourse.get(doc.course_id) || 0) + 1);
    if (doc.status === "pending" || doc.status === "processing") {
      processingByCourse.set(doc.course_id, true);
      processingCountByCourse.set(doc.course_id, (processingCountByCourse.get(doc.course_id) || 0) + 1);
    }
    allDocIds.push(doc.id);
  });

  return { docCountByCourse, processingByCourse, processingCountByCourse, allDocIds };
}

type DocumentAggregates = ReturnType<typeof aggregateDocuments>;

async function fetchTopicsForDocuments(docIds: string[]) {
  if (docIds.length === 0) return [];
  const { data } = await supabase.from("topics").select("id, document_id, concepts(id)").in("document_id", docIds);
  return data ?? [];
}

type TopicRow = Awaited<ReturnType<typeof fetchTopicsForDocuments>>[number];

/** Concept count per course, via document → topic → concepts. */
function aggregateConceptCounts(topics: TopicRow[], documents: DocumentRow[]) {
  const conceptCountByCourse = new Map<string, number>();

  topics.forEach((topic) => {
    const courseId = documents.find((d) => d.id === topic.document_id)?.course_id;
    if (!courseId) return;
    const concepts = (topic.concepts as { id: string }[]) || [];
    conceptCountByCourse.set(courseId, (conceptCountByCourse.get(courseId) || 0) + concepts.length);
  });

  return conceptCountByCourse;
}

async function fetchMasteryRows(userId: string, courseIds: string[]) {
  if (courseIds.length === 0) return [];
  const { data } = await supabase
    .from("bkt_mastery")
    .select("course_id, p_mastery, n_attempts")
    .eq("user_id", userId)
    .in("course_id", courseIds);
  return data ?? [];
}

type MasteryRow = Awaited<ReturnType<typeof fetchMasteryRows>>[number];

function aggregateMastery(rows: MasteryRow[]) {
  const masteredByCourse = new Map<string, number>();
  const masterySumByCourse = new Map<string, number>();
  const masteryCountByCourse = new Map<string, number>();
  const masteryValuesByCourse = new Map<string, number[]>();
  const hasActivityByCourse = new Map<string, boolean>();

  rows.forEach((row) => {
    const cid = row.course_id;
    if (!cid) return;
    if (row.p_mastery >= MASTERY_THRESHOLD) {
      masteredByCourse.set(cid, (masteredByCourse.get(cid) || 0) + 1);
    }
    masterySumByCourse.set(cid, (masterySumByCourse.get(cid) || 0) + row.p_mastery);
    masteryCountByCourse.set(cid, (masteryCountByCourse.get(cid) || 0) + 1);
    const vals = masteryValuesByCourse.get(cid) ?? [];
    vals.push(row.p_mastery);
    masteryValuesByCourse.set(cid, vals);
    if (row.n_attempts > 0) hasActivityByCourse.set(cid, true);
  });

  return { masteredByCourse, masterySumByCourse, masteryCountByCourse, masteryValuesByCourse, hasActivityByCourse };
}

type MasteryAggregates = ReturnType<typeof aggregateMastery>;

function computeCoursePassStats(masteryValues: number[], hasActivity: boolean, targetGrade: number) {
  const passChance = hasActivity && masteryValues.length > 0 ? computePassProbability(masteryValues, targetGrade) : null;
  const passProbability = passChance !== null ? Math.round(passChance * 100) : 0;
  return { passChance, passProbability };
}

function buildCourseSummary(
  c: CourseRow,
  docAgg: DocumentAggregates,
  conceptCountByCourse: Map<string, number>,
  masteryAgg: MasteryAggregates,
): CourseSummary {
  const totalConcepts = conceptCountByCourse.get(c.id) || 0;
  const masteredConcepts = masteryAgg.masteredByCourse.get(c.id) || 0;
  const hasActivity = masteryAgg.hasActivityByCourse.get(c.id) ?? false;
  const masteryValues = masteryAgg.masteryValuesByCourse.get(c.id) ?? [];
  const targetGrade = c.target_grade ?? 1.0;
  const { passChance, passProbability } = computeCoursePassStats(masteryValues, hasActivity, targetGrade);
  const masterySum = masteryAgg.masterySumByCourse.get(c.id) || 0;
  const masteryCount = masteryAgg.masteryCountByCourse.get(c.id) || 0;

  return {
    id: c.id,
    title: c.title,
    description: c.description,
    documentCount: docAgg.docCountByCourse.get(c.id) || 0,
    passChance,
    passProbability,
    targetGrade,
    curriculumType: fromDbCurriculum(c.curriculum_type),
    totalConcepts,
    masteredConcepts,
    progressPercent: masteryCount > 0 ? Math.round((masterySum / masteryCount) * 100) : 0,
    hasProcessing: docAgg.processingByCourse.get(c.id) || false,
    processingDocumentCount: docAgg.processingCountByCourse.get(c.id) || 0,
    createdAt: c.created_at,
    updatedAt: c.updated_at || c.created_at,
  };
}

function buildCourseSummaries(
  courses: CourseRow[],
  docAgg: DocumentAggregates,
  conceptCountByCourse: Map<string, number>,
  masteryAgg: MasteryAggregates,
): CourseSummary[] {
  return courses.map((c) => buildCourseSummary(c, docAgg, conceptCountByCourse, masteryAgg));
}

function computeOverallStats(courseSummaries: CourseSummary[], masteryAgg: MasteryAggregates) {
  const totalConceptsMastered = courseSummaries.reduce((sum, c) => sum + c.masteredConcepts, 0);
  const totalConcepts = courseSummaries.reduce((sum, c) => sum + c.totalConcepts, 0);
  const totalMasterySum = Array.from(masteryAgg.masterySumByCourse.values()).reduce((a, b) => a + b, 0);
  const totalMasteryCount = Array.from(masteryAgg.masteryCountByCourse.values()).reduce((a, b) => a + b, 0);
  const overallProgress = totalMasteryCount > 0 ? Math.round((totalMasterySum / totalMasteryCount) * 100) : 0;

  // Weighted average by concept count (only courses with data)
  const coursesWithData = courseSummaries.filter((c) => c.passChance !== null);
  const weightedConceptTotal = coursesWithData.reduce((sum, c) => sum + c.totalConcepts, 0);
  const overallPassProbability =
    weightedConceptTotal > 0
      ? Math.round(coursesWithData.reduce((sum, c) => sum + c.passProbability * c.totalConcepts, 0) / weightedConceptTotal)
      : coursesWithData.length > 0
        ? Math.round(coursesWithData.reduce((sum, c) => sum + c.passProbability, 0) / coursesWithData.length)
        : 0;

  return { totalConceptsMastered, totalConcepts, overallProgress, overallPassProbability };
}

function determineNextStudyItem(
  courseSummaries: CourseSummary[],
  hasActivityByCourse: Map<string, boolean>,
): DashboardData["nextStudyItem"] {
  const inProgressCourse = courseSummaries.find(
    (c) => hasActivityByCourse.get(c.id) && c.totalConcepts > 0 && c.masteredConcepts < c.totalConcepts,
  );
  if (inProgressCourse) {
    return { courseId: inProgressCourse.id, courseTitle: inProgressCourse.title, reason: "continue" };
  }

  const newCourse = courseSummaries.find((c) => !hasActivityByCourse.get(c.id) && c.totalConcepts > 0 && c.documentCount > 0);
  if (newCourse) {
    return { courseId: newCourse.id, courseTitle: newCourse.title, reason: "new" };
  }

  const reviewCourse = courseSummaries.find((c) => c.totalConcepts > 0 && c.masteredConcepts > 0);
  if (reviewCourse) {
    return { courseId: reviewCourse.id, courseTitle: reviewCourse.title, reason: "review" };
  }

  return null;
}

/**
 * Fetch all dashboard data for a user (course-centric).
 *
 * Simple aggregation: courses, document counts, and pass chance per course.
 */
export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  const courses = await fetchCourses(userId);

  if (courses.length === 0) {
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

  const documents = await fetchDocumentsForCourses(courseIds);
  const docAgg = aggregateDocuments(documents);

  const topics = await fetchTopicsForDocuments(docAgg.allDocIds);
  const conceptCountByCourse = aggregateConceptCounts(topics, documents);

  const masteryRows = await fetchMasteryRows(userId, courseIds);
  const masteryAgg = aggregateMastery(masteryRows);

  const courseSummaries = buildCourseSummaries(courses, docAgg, conceptCountByCourse, masteryAgg);
  const overallStats = computeOverallStats(courseSummaries, masteryAgg);
  const nextStudyItem = determineNextStudyItem(courseSummaries, masteryAgg.hasActivityByCourse);

  return {
    courses: courseSummaries,
    totalCourses: courseSummaries.length,
    ...overallStats,
    nextStudyItem,
  };
}
