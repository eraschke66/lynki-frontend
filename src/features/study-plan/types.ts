import type { TopicMastery } from "@/features/courses/types";

// ── Version 2: markdown growth guide ────────────────────────────────────────

export interface MarkdownPlan {
  markdown: string;
  version: 2;
}

// ── Version 1: legacy JSON sessions (pre-overhaul) ──────────────────────────

export interface LegacyPlan {
  overview?: string;
  sessions?: unknown[];
  tip?: string;
}

// ── Union stored in plan_json JSONB column ───────────────────────────────────

export type PlanJson = MarkdownPlan | LegacyPlan;

export function isMarkdownPlan(p: PlanJson): p is MarkdownPlan {
  return (p as MarkdownPlan).version === 2 && typeof (p as MarkdownPlan).markdown === "string";
}

// ── Row from study_plans table ───────────────────────────────────────────────

export interface AiStudyPlan {
  id: string;
  user_id: string;
  course_id: string;
  plan_json: PlanJson;
  generated_at: string;
}

// ── Legacy types kept to avoid breaking existing imports ─────────────────────

export type StructuredPlan = LegacyPlan;

export interface SessionActivity {
  concept_name: string;
  topic_name: string;
  concept_id: string;
  topic_id: string;
  guidance: string;
}

export interface StudySession {
  label: string;
  theme: string;
  activities: SessionActivity[];
}

export interface StudyPlan {
  courseId: string;
  courseTitle: string;
  testDate: string;
  daysRemaining: number;
  topics: TopicMastery[];
}
