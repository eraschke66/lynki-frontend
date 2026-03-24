import type { TopicMastery } from "@/features/courses/types";

// ── AI-generated plan (stored as plan_json in Supabase) ──────────────────────

export interface SessionActivity {
  concept_name: string;
  topic_name: string;
  concept_id: string;  // enriched by backend after name-matching
  topic_id: string;    // enriched by backend after name-matching
  guidance: string;
}

export interface StudySession {
  label: string;   // e.g. "Day 1", "Week 1"
  theme: string;   // e.g. "Laser Fundamentals"
  activities: SessionActivity[];
}

export interface StructuredPlan {
  overview: string;
  sessions: StudySession[];
  tip: string;
}

// Row from study_plans table
export interface AiStudyPlan {
  id: string;
  user_id: string;
  course_id: string;
  plan_json: StructuredPlan;
  generated_at: string;
}

// Legacy — kept to avoid breaking imports
export interface StudyPlan {
  courseId: string;
  courseTitle: string;
  testDate: string;
  daysRemaining: number;
  topics: TopicMastery[];
}
