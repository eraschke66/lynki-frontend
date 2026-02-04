/**
 * Types for the Dashboard feature
 */

export interface MaterialSummary {
  id: string;
  title: string;
  fileType: string;
  status: "pending" | "processing" | "completed" | "error";
  createdAt: string;
  totalConcepts: number;
  masteredConcepts: number;
  progressPercent: number;
  conceptsDueForReview: number;
  hasQuiz: boolean;
}

export interface ReviewItem {
  conceptId: string;
  conceptName: string;
  documentId: string;
  documentTitle: string;
  dueAt: string;
  reviewCount: number;
}

export interface DashboardData {
  materials: MaterialSummary[];
  reviewsDue: ReviewItem[];
  totalMaterials: number;
  totalConceptsMastered: number;
  totalConcepts: number;
  overallProgress: number;
  nextStudyItem: {
    documentId: string;
    documentTitle: string;
    conceptId: string | null;
    conceptName: string | null;
    reason: "continue" | "new" | "review";
  } | null;
}
