/**
 * Types for the Dashboard feature (course-centric).
 */

export interface CourseSummary {
  id: string;
  title: string;
  description: string | null;
  documentCount: number;
  /** Estimated passing chance from BKT (0.0–1.0), null if not yet tested */
  passChance: number | null;
  /** Pass probability as integer 0–100 (derived from passChance) */
  passProbability: number;
  /** Normalized target grade (0–1) */
  targetGrade: number;
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
  /** Weighted average pass probability across all courses (0–100) */
  overallPassProbability: number;
  nextStudyItem: {
    courseId: string;
    courseTitle: string;
    reason: "continue" | "new" | "review";
  } | null;
}
