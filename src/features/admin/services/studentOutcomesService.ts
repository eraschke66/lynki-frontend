import { supabase } from "@/lib/supabase";
import { computePassProbability } from "@/lib/passProbability";

// Admin per-student outcomes data layer.
//
// All reads go through two SECURITY DEFINER RPCs (admin_student_cohort /
// admin_student_detail) defined in
// supabase/migrations/admin_student_outcomes_rpcs.sql. The RPCs gate on the
// caller's email server-side and bypass the self-only RLS so an admin can read
// the cohort; the frontend never sees other users' rows except through them.
//
// Pass probability is computed here with computePassProbability -- the exact
// lib the dashboard (dashboardService) uses -- from the raw per-course mastery
// values the RPC returns, so the number matches the dashboard. Pass probability
// and mastery are CURRENT values (no history table); only quiz scores, which are
// timestamped, are charted over time.
//
// The RPCs are not in the generated Database types, so we cast through `any` --
// the same pattern testService uses for the un-typed quiz tables.

export interface CohortStudent {
  user_id: string;
  email: string | null;
  last_active: string | null; // derived server-side; null if no activity
  quizzes: number;
  documents: number;
}

export interface CourseOutcome {
  id: string;
  title: string;
  passProbability: number | null; // 0-100, current; null when the course has no activity
  masteryPercent: number; // current mastery (avg p_mastery), not a trend
  documentCount: number;
}

export interface QuizPoint {
  id: string;
  source: "course" | "topic";
  label: string;
  topic: string | null;
  scorePct: number;
  ts: string; // ISO timestamp
}

export interface TopicMasteryRow {
  concept: string | null;
  topic: string | null;
  course: string | null;
  masteryPercent: number; // current p_mastery * 100
}

export interface StudentDetail {
  user_id: string;
  email: string | null;
  lastActive: string | null;
  documentCount: number;
  quizCount: number;
  courses: CourseOutcome[];
  quizHistory: QuizPoint[]; // ascending by ts
  topicMastery: TopicMasteryRow[];
}

export async function fetchCohort(): Promise<CohortStudent[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("admin_student_cohort");
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => ({
    user_id: r.user_id,
    email: r.email ?? null,
    last_active: r.last_active ?? null,
    quizzes: Number(r.quizzes ?? 0),
    documents: Number(r.documents ?? 0),
  }));
}

export async function fetchStudentDetail(userId: string): Promise<StudentDetail> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("admin_student_detail", {
    target_user_id: userId,
  });
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = (data ?? {}) as any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const courses: CourseOutcome[] = ((d.courses ?? []) as any[]).map((c) => {
    const vals: number[] = Array.isArray(c.mastery_values)
      ? c.mastery_values.map(Number)
      : [];
    // Mirror dashboardService: pass chance is computed only when the course has
    // activity and at least one mastery value; otherwise it is null (unknown).
    const pass =
      c.has_activity && vals.length > 0
        ? computePassProbability(vals, Number(c.target_grade ?? 1.0))
        : null;
    return {
      id: c.id,
      title: c.title,
      passProbability: pass !== null ? Math.round(pass * 100) : null,
      masteryPercent: Number(c.progress_percent ?? 0),
      documentCount: Number(c.document_count ?? 0),
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quizHistory: QuizPoint[] = ((d.quiz_history ?? []) as any[]).map((q) => ({
    id: String(q.id),
    source: q.source === "topic" ? "topic" : "course",
    label: q.label ?? "Quiz",
    topic: q.topic ?? null,
    scorePct: Number(q.score_pct ?? 0),
    ts: q.ts,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topicMastery: TopicMasteryRow[] = ((d.topic_mastery ?? []) as any[]).map((m) => ({
    concept: m.concept ?? null,
    topic: m.topic ?? null,
    course: m.course ?? null,
    masteryPercent: Math.round(Number(m.p_mastery ?? 0) * 100),
  }));

  const activity = d.activity ?? {};
  return {
    user_id: d.user_id ?? userId,
    email: d.email ?? null,
    lastActive: activity.last_active ?? null,
    documentCount: Number(activity.document_count ?? 0),
    quizCount: Number(activity.quiz_count ?? 0),
    courses,
    quizHistory,
    topicMastery,
  };
}
