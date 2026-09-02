import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";
import type {
  ActiveRecallResult,
  ConnectionResult,
  MnemonicResult,
  QuizResult,
  RecallEvaluation,
  RecallResult,
  Stage,
  TendingSession,
  TendingSessionPayload,
} from "../types";

/**
 * Plain-CRUD persistence for the Tending Flow, written directly against
 * Supabase from the frontend (RLS-scoped to the authenticated user) — kept
 * separate from tendingApi.ts, which wraps the three FastAPI endpoints that
 * do real work (Claude generation/evaluation, BKT math). Per this repo's
 * architecture rule, anything that's "just a query" belongs here, not in a
 * FastAPI route.
 */

export type TendingSessionRow = Database["public"]["Tables"]["topic_tending_sessions"]["Row"];

const TABLE = "topic_tending_sessions";

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Look up an in-flight (not completed, not abandoned) session for a single
 * topic. `.is("completed_at", null).is("abandoned_at", null)` is the
 * enforcement point that a finished or discarded session can never be
 * resumed — stronger than the old sessionStorage-era guard in
 * tendingMachine.ts, which once let a stale completed delta resurface (the
 * "+15% in 276 minutes" bug).
 */
export async function findIncompleteSessionForTopic(
  userId: string,
  courseId: string,
  topicId: string,
): Promise<TendingSessionRow | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("topic_id", topicId)
    .is("completed_at", null)
    .is("abandoned_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Same lookup, scoped to a course, for the Garden page's recommendation priority. */
export async function findIncompleteSessionForCourse(
  userId: string,
  courseId: string,
): Promise<TendingSessionRow | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .is("completed_at", null)
    .is("abandoned_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Converts a DB row back into the machine's in-memory session shape. */
export function mapRowToTendingSession(row: TendingSessionRow): TendingSession {
  const content = (row.generated_content ?? {}) as Record<string, unknown>;
  const topicTitle = typeof content.topic_title === "string" ? content.topic_title : "";
  const payload: TendingSessionPayload = {
    session_id: row.id,
    course_id: row.course_id,
    topic_id: row.topic_id,
    topic_title: topicTitle,
    recall_cards: content.recall_cards as TendingSessionPayload["recall_cards"],
    active_recall: content.active_recall as TendingSessionPayload["active_recall"],
    mnemonics: content.mnemonics as TendingSessionPayload["mnemonics"],
    connections: content.connections as TendingSessionPayload["connections"],
  };

  const recallRows = (row.recall_card_results ?? []) as Array<{ id: string; got_it: boolean }>;
  const recallResults: RecallResult[] | null =
    recallRows.length > 0
      ? recallRows.map((r) => ({ id: r.id, rating: r.got_it ? "got_it" : "again" }))
      : null;

  const activeRecallResult: ActiveRecallResult | null =
    row.active_recall_input != null
      ? {
          student_response: row.active_recall_input,
          evaluation: (row.active_recall_evaluation as RecallEvaluation | null) ?? null,
        }
      : null;

  const mnemonicRows = (row.mnemonic_results ?? []) as Array<{ id: string; locked_in: boolean }>;
  const mnemonicResults: MnemonicResult[] | null =
    mnemonicRows.length > 0
      ? mnemonicRows.map((m) => ({ id: m.id, lockedIn: m.locked_in }))
      : null;

  const connectionRows = row.concept_pair_results;
  const connectionResults: ConnectionResult[] | null = Array.isArray(connectionRows)
    ? (connectionRows as ConnectionResult[])
    : null;

  const quizResults = (row.quiz_results as QuizResult | null) ?? null;

  const currentStage = (row.current_step as Stage | null) ?? "recall_cards";

  return {
    sessionId: row.id,
    courseId: row.course_id,
    topicId: row.topic_id,
    topicTitle,
    startedAt: new Date(row.started_at).getTime(),
    currentStage,
    stagesSkipped: (row.stages_skipped as Stage[] | null) ?? [],
    payload,
    recallResults,
    activeRecallResult,
    mnemonicResults,
    connectionResults,
    quizResults,
    masteryDelta: null,
    masterySnapshot: null,
  };
}

export async function markSessionAbandoned(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ abandoned_at: nowIso(), updated_at: nowIso() })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function persistRecallStage(sessionId: string, results: RecallResult[]): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({
      recall_card_results: results.map((r) => ({ id: r.id, got_it: r.rating === "got_it" })),
      current_step: "active_recall",
      updated_at: nowIso(),
    })
    .eq("id", sessionId);
  if (error) throw error;
}

/**
 * Active recall's own content columns (active_recall_input/evaluation) are
 * already written by /topic-tending/evaluate-recall — this call only
 * advances current_step so a resume lands on the right stage.
 */
export async function persistActiveRecallStage(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ current_step: "mnemonics", updated_at: nowIso() })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function persistMnemonicStage(sessionId: string, results: MnemonicResult[]): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({
      mnemonic_results: results.map((m) => ({ id: m.id, locked_in: m.lockedIn })),
      current_step: "connections",
      updated_at: nowIso(),
    })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function persistConnectionStage(sessionId: string, results: ConnectionResult[]): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({
      concept_pair_results: results,
      current_step: "quiz",
      updated_at: nowIso(),
    })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function persistQuizStage(sessionId: string, result: QuizResult): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({
      quiz_results: result,
      current_step: "mastery_delta",
      updated_at: nowIso(),
    })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function persistSkipStage(
  sessionId: string,
  next: Stage,
  stagesSkipped: Stage[],
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({
      current_step: next,
      stages_skipped: stagesSkipped,
      updated_at: nowIso(),
    })
    .eq("id", sessionId);
  if (error) throw error;
}
