/**
 * Types for the courses feature.
 * A Course is the top-level organizational unit (e.g. "Biology 101").
 * Documents (uploaded PDFs) belong to courses.
 */

export interface Course {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CourseWithStats extends Course {
  documentCount: number;
  totalConcepts: number;
  masteredConcepts: number;
  progressPercent: number;
}
