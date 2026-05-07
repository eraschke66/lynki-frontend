export type Stage =
  | "loading"
  | "recall_cards"
  | "active_recall"
  | "mnemonics"
  | "connections"
  | "quiz"
  | "mastery_delta"
  | "done";

export const STAGE_ORDER: Stage[] = [
  "loading",
  "recall_cards",
  "active_recall",
  "mnemonics",
  "connections",
  "quiz",
  "mastery_delta",
  "done",
];

export const VISIBLE_STAGES: Stage[] = [
  "recall_cards",
  "active_recall",
  "mnemonics",
  "connections",
  "quiz",
  "mastery_delta",
];

export const STAGE_LABEL: Record<Stage, string> = {
  loading: "Loading",
  recall_cards: "Recall Cards",
  active_recall: "Active Recall",
  mnemonics: "Mnemonics",
  connections: "Connections",
  quiz: "Quiz",
  mastery_delta: "Mastery Delta",
  done: "Done",
};

// ── Per-stage payloads from backend ────────────────────────────────

export interface RecallCard {
  id: string;
  front: string;
  back: string;
}

export interface MnemonicCard {
  id: string;
  hook: string;
  explanation: string;
}

export type ConnectionType =
  | "term_to_definition"
  | "cause_to_effect"
  | "person_to_contribution"
  | "event_to_year";

export interface ConnectionPair {
  id: string;
  left: string;
  right: string;
}

export interface TendingSessionPayload {
  session_id: string;
  course_id: string;
  topic_id: string;
  topic_title: string;
  recall_cards: { stage: "recall_cards"; cards: RecallCard[] };
  active_recall: { stage: "active_recall"; prompt: string; source_paragraph: string };
  mnemonics: { stage: "mnemonics"; mnemonics: MnemonicCard[] };
  connections: { stage: "connections"; pairs: ConnectionPair[]; type: ConnectionType };
}

export interface RecallEvaluation {
  got_right: string[];
  missed: string[];
  source_paragraph: string;
}

export interface KCDelta {
  kc_id: string;
  name: string;
  before: number;
  after: number;
}

export interface MasteryDelta {
  stage: "mastery_delta";
  topic_title: string;
  mastery_before: number;
  mastery_after: number;
  kc_breakdown: KCDelta[];
  tended_today: boolean;
}

// ── Per-stage results captured by the frontend ─────────────────────

export interface RecallResult {
  id: string;
  rating: "got_it" | "again";
}

export interface ActiveRecallResult {
  student_response: string;
  evaluation: RecallEvaluation | null;
}

export interface MnemonicResult {
  id: string;
  lockedIn: boolean;
}

export interface ConnectionResult {
  id: string;
  attempts: number;
  matched: boolean;
}

export interface QuizResult {
  correct: number;
  total: number;
  question_ids: string[];
}

export interface AllStageResults {
  recall: RecallResult[] | null;
  active_recall: ActiveRecallResult | null;
  mnemonics: MnemonicResult[] | null;
  connections: ConnectionResult[] | null;
  quiz: QuizResult | null;
  stages_skipped: Stage[];
}

// ── Top-level session state held by the machine ────────────────────

export interface TendingSession {
  sessionId: string;
  courseId: string;
  topicId: string;
  topicTitle: string;
  startedAt: number; // epoch ms — used to compute "X minutes" on Mastery Delta
  currentStage: Stage;
  stagesSkipped: Stage[];
  payload: TendingSessionPayload | null;
  recallResults: RecallResult[] | null;
  activeRecallResult: ActiveRecallResult | null;
  mnemonicResults: MnemonicResult[] | null;
  connectionResults: ConnectionResult[] | null;
  quizResults: QuizResult | null;
  masteryDelta: MasteryDelta | null;
}
