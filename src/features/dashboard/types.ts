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
  /** Whether at least one document is still processing */
  hasProcessing: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  courses: CourseSummary[];
  totalCourses: number;
}
