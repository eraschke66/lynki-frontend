/**
 * Course CRUD service — thin Supabase client.
 */

import { supabase } from "@/lib/supabase";
import type { Course, CourseGardenData, TopicMastery, ConceptMastery } from "../types";

/**
 * Fetch all courses for a user.
 */
export async function fetchUserCourses(userId: string): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching courses:", error);
    throw error;
  }

  return (data ?? []).map((c) => ({
    id: c.id,
    userId: c.user_id,
    title: c.title,
    description: c.description,
    targetGrade: c.target_grade ?? 1.0,
    testDate: c.test_date ?? null,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));
}

/**
 * Create a new course.
 */
export async function createCourse(
  userId: string,
  title: string,
  description?: string,
  targetGrade?: number,
): Promise<Course> {
  const { data, error } = await supabase
    .from("courses")
    .insert({
      user_id: userId,
      title: title.trim(),
      description: description?.trim() || null,
      target_grade: targetGrade ?? 1.0,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Error creating course:", error);
    throw new Error("Failed to create course");
  }

  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    description: data.description,
    targetGrade: data.target_grade ?? 1.0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Update a course's exam date.
 */
export async function updateCourseTestDate(
  courseId: string,
  testDate: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("courses")
    .update({ test_date: testDate })
    .eq("id", courseId);

  if (error) {
    console.error("Error updating test date:", error);
    throw new Error("Failed to update exam date");
  }
}

/**
 * Update a course title or description.
 */
export async function updateCourse(
  courseId: string,
  updates: { title?: string; description?: string; targetGrade?: number },
): Promise<void> {
  const payload: Record<string, string | number> = {};
  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.description !== undefined)
    payload.description = updates.description.trim();
  if (updates.targetGrade !== undefined)
    payload.target_grade = updates.targetGrade;

  const { error } = await supabase
    .from("courses")
    .update(payload)
    .eq("id", courseId);

  if (error) {
    console.error("Error updating course:", error);
    throw new Error("Failed to update course");
  }
}

/**
 * Delete a course (cascades to documents).
 */
export async function deleteCourse(courseId: string): Promise<void> {
  const { error } = await supabase.from("courses").delete().eq("id", courseId);

  if (error) {
    console.error("Error deleting course:", error);
    throw new Error("Failed to delete course");
  }
}

/**
 * Fetch the full knowledge garden for a course.
 * Mirrors the Python get_course_progress() logic directly in the client
 * so we avoid an unnecessary FastAPI round-trip.
 */
export async function fetchCourseGardenData(
  userId: string,
  courseId: string,
): Promise<CourseGardenData> {
  const MASTERY_THRESHOLD = 0.85;
  const DEFAULT_P_MASTERY = 0.2;

  // 1. Course title
  const { data: course, error: courseErr } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", courseId)
    .single();
  if (courseErr || !course) throw new Error("Course not found");

  // 2. Document IDs
  const { data: docs } = await supabase
    .from("documents")
    .select("id")
    .eq("course_id", courseId);
  const docIds = (docs ?? []).map((d) => d.id);
  if (docIds.length === 0) {
    return { course_id: courseId, course_title: course.title, topics: [],
             total_concepts: 0, mastered_concepts: 0, overall_progress: 0,
             mastery_threshold: MASTERY_THRESHOLD };
  }

  // 3. Topics
  const { data: topics } = await supabase
    .from("topics")
    .select("id, name")
    .in("document_id", docIds);
  const topicIds = (topics ?? []).map((t) => t.id);
  if (topicIds.length === 0) {
    return { course_id: courseId, course_title: course.title, topics: [],
             total_concepts: 0, mastered_concepts: 0, overall_progress: 0,
             mastery_threshold: MASTERY_THRESHOLD };
  }

  // 4. Concepts
  const { data: concepts } = await supabase
    .from("concepts")
    .select("id, name, explanation, topic_id")
    .in("topic_id", topicIds);
  const conceptIds = (concepts ?? []).map((c) => c.id);

  // 5. BKT mastery rows for this user + course
  const { data: masteryRows } = await supabase
    .from("bkt_mastery")
    .select("knowledge_component_id, p_mastery, n_attempts, n_correct")
    .eq("user_id", userId)
    .eq("course_id", courseId);
  const masteryMap = new Map(
    (masteryRows ?? []).map((m) => [m.knowledge_component_id, m]),
  );

  // 6. Question counts per concept
  const questionCountMap = new Map<string, number>();
  if (conceptIds.length > 0) {
    const { data: questionRows } = await supabase
      .from("questions")
      .select("concept_id")
      .in("concept_id", conceptIds);
    (questionRows ?? []).forEach((q) => {
      if (q.concept_id)
        questionCountMap.set(q.concept_id, (questionCountMap.get(q.concept_id) ?? 0) + 1);
    });
  }

  // 7. Group concepts by topic
  const conceptsByTopic = new Map<string, NonNullable<typeof concepts>>();
  (concepts ?? []).forEach((c) => {
    const arr = conceptsByTopic.get(c.topic_id) ?? [];
    arr.push(c);
    conceptsByTopic.set(c.topic_id, arr);
  });

  // 8. Build aggregated topic list
  let totalConcepts = 0;
  let masteredConcepts = 0;

  const topicList: TopicMastery[] = (topics ?? []).map((topic) => {
    const topicConcepts: ConceptMastery[] = (conceptsByTopic.get(topic.id) ?? []).map((c) => {
      const row = masteryMap.get(c.id);
      const p_mastery = row ? (row.p_mastery as number) : DEFAULT_P_MASTERY;
      const n_attempts = (row?.n_attempts as number) ?? 0;
      const n_correct = (row?.n_correct as number) ?? 0;
      const is_mastered = p_mastery >= MASTERY_THRESHOLD;
      const status: ConceptMastery["status"] = is_mastered
        ? "mastered"
        : n_attempts > 0
        ? "in_progress"
        : "not_started";
      return {
        concept_id: c.id,
        concept_name: c.name,
        explanation: c.explanation ?? "",
        p_mastery,
        n_attempts,
        n_correct,
        status,
        is_mastered,
        question_count: questionCountMap.get(c.id) ?? 0,
      };
    });

    const mastered = topicConcepts.filter((c) => c.is_mastered).length;
    const total = topicConcepts.length;
    totalConcepts += total;
    masteredConcepts += mastered;

    const topic_status: TopicMastery["status"] =
      mastered === total && total > 0
        ? "mastered"
        : topicConcepts.some((c) => c.status !== "not_started")
        ? "in_progress"
        : "not_started";

    return {
      topic_id: topic.id,
      topic_name: topic.name,
      status: topic_status,
      concepts: topicConcepts,
      total_concepts: total,
      mastered_concepts: mastered,
      overall_progress: total > 0 ? Math.round((mastered / total) * 100) : 0,
    };
  });

  return {
    course_id: courseId,
    course_title: course.title,
    topics: topicList,
    total_concepts: totalConcepts,
    mastered_concepts: masteredConcepts,
    overall_progress:
      totalConcepts > 0 ? Math.round((masteredConcepts / totalConcepts) * 100) : 0,
    mastery_threshold: MASTERY_THRESHOLD,
  };
}
