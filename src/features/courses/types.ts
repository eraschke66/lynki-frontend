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
  targetGrade: number;
  testDate: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CourseWithStats extends Course {
  documentCount: number;
  totalConcepts: number;
  masteredConcepts: number;
  progressPercent: number;
}

// ---------------------------------------------------------------------------
// Knowledge Garden — mirrors BKTProgressResponse from the backend
// ---------------------------------------------------------------------------

export interface ConceptMastery {
  concept_id: string;
  concept_name: string;
  explanation: string;
  p_mastery: number;
  n_attempts: number;
  n_correct: number;
  status: "not_started" | "in_progress" | "mastered";
  is_mastered: boolean;
  question_count: number;
}

export interface TopicMastery {
  topic_id: string;
  topic_name: string;
  status: "not_started" | "in_progress" | "mastered";
  concepts: ConceptMastery[];
  total_concepts: number;
  mastered_concepts: number;
  overall_progress: number;
}

export interface CourseGardenData {
  course_id: string;
  course_title: string;
  topics: TopicMastery[];
  total_concepts: number;
  mastered_concepts: number;
  overall_progress: number;
  mastery_threshold: number;
}
