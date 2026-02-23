/**
 * Types for the Dashboard feature (course-centric).
 */

export interface CourseSummary {
  id: string;
  title: string;
  description: string | null;
  documentCount: number;
  totalConcepts: number;
  masteredConcepts: number;
  progressPercent: number;
  /** Whether at least one document is still processing */
  hasProcessing: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  courses: CourseSummary[];
  totalCourses: number;
  totalConceptsMastered: number;
  totalConcepts: number;
  overallProgress: number;
  nextStudyItem: {
    courseId: string;
    courseTitle: string;
    reason: "continue" | "new" | "review";
  } | null;
}
