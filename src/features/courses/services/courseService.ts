/**
 * Course CRUD service — thin Supabase client.
 */

import { supabase } from "@/lib/supabase";
import type { Course } from "../types";

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
