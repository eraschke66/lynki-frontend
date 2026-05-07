import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  STAGE_ORDER,
  type ActiveRecallResult,
  type ConnectionResult,
  type CourseMasterySnapshot,
  type MasteryDelta,
  type MnemonicResult,
  type QuizResult,
  type RecallResult,
  type Stage,
  type TendingSession,
  type TendingSessionPayload,
} from "../types";

const STORAGE_PREFIX = "tending:v1:";
const storageKey = (courseId: string, topicId: string) => `${STORAGE_PREFIX}${courseId}:${topicId}`;

type Action =
  | {
      type: "init";
      payload: { courseId: string; topicId: string; sessionPayload: TendingSessionPayload };
    }
  | { type: "hydrate"; payload: TendingSession }
  | { type: "advance" }
  | { type: "skip" }
  | { type: "recordRecall"; payload: RecallResult[] }
  | { type: "recordActiveRecall"; payload: ActiveRecallResult }
  | { type: "recordMnemonics"; payload: MnemonicResult[] }
  | { type: "recordConnections"; payload: ConnectionResult[] }
  | { type: "recordQuiz"; payload: QuizResult }
  | { type: "recordMastery"; payload: MasteryDelta }
  | { type: "setMasterySnapshot"; payload: CourseMasterySnapshot }
  | { type: "reset" };

const emptyState: TendingSession = {
  sessionId: "",
  courseId: "",
  topicId: "",
  topicTitle: "",
  startedAt: 0,
  currentStage: "loading",
  stagesSkipped: [],
  payload: null,
  recallResults: null,
  activeRecallResult: null,
  mnemonicResults: null,
  connectionResults: null,
  quizResults: null,
  masteryDelta: null,
  masterySnapshot: null,
};

function nextStage(current: Stage): Stage {
  const idx = STAGE_ORDER.indexOf(current);
  return STAGE_ORDER[idx + 1] ?? "done";
}

function reducer(state: TendingSession, action: Action): TendingSession {
  switch (action.type) {
    case "init":
      return {
        ...emptyState,
        sessionId: action.payload.sessionPayload.session_id,
        courseId: action.payload.courseId,
        topicId: action.payload.topicId,
        topicTitle: action.payload.sessionPayload.topic_title,
        startedAt: Date.now(),
        currentStage: "recall_cards",
        payload: action.payload.sessionPayload,
      };
    case "hydrate":
      return action.payload;
    case "advance":
      return { ...state, currentStage: nextStage(state.currentStage) };
    case "skip":
      return {
        ...state,
        currentStage: nextStage(state.currentStage),
        stagesSkipped: [...state.stagesSkipped, state.currentStage],
      };
    case "recordRecall":
      return { ...state, recallResults: action.payload };
    case "recordActiveRecall":
      return { ...state, activeRecallResult: action.payload };
    case "recordMnemonics":
      return { ...state, mnemonicResults: action.payload };
    case "recordConnections":
      return { ...state, connectionResults: action.payload };
    case "recordQuiz":
      return { ...state, quizResults: action.payload };
    case "recordMastery":
      return { ...state, masteryDelta: action.payload, currentStage: "mastery_delta" };
    case "setMasterySnapshot":
      return { ...state, masterySnapshot: action.payload };
    case "reset":
      return emptyState;
    default:
      return state;
  }
}

export interface TendingMachine {
  state: TendingSession;
  isInitialized: boolean;
  init: (sessionPayload: TendingSessionPayload) => void;
  advance: () => void;
  skip: () => void;
  recordRecall: (r: RecallResult[]) => void;
  recordActiveRecall: (r: ActiveRecallResult) => void;
  recordMnemonics: (r: MnemonicResult[]) => void;
  recordConnections: (r: ConnectionResult[]) => void;
  recordQuiz: (r: QuizResult) => void;
  recordMastery: (r: MasteryDelta) => void;
  setMasterySnapshot: (s: CourseMasterySnapshot) => void;
  clearPersisted: () => void;
}

/**
 * Drives the linear Tending Flow stage progression and mirrors state to
 * sessionStorage so a refresh mid-flow doesn't nuke the session.
 *
 * Storage is keyed by course+topic — one in-flight session per topic is
 * allowed; starting a new session for the same topic discards the prior one.
 */
export function useTendingMachine(courseId: string, topicId: string): TendingMachine {
  const [state, dispatch] = useReducer(reducer, emptyState);
  const hydratedRef = useRef(false);

  // Hydrate from sessionStorage on mount if a matching session is parked there.
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(storageKey(courseId, topicId));
      if (!raw) return;
      const parsed = JSON.parse(raw) as TendingSession;
      if (parsed.courseId === courseId && parsed.topicId === topicId && parsed.sessionId) {
        dispatch({ type: "hydrate", payload: parsed });
      }
    } catch {
      // Bad JSON in storage — ignore and start fresh.
    }
  }, [courseId, topicId]);

  // Persist whenever state changes, except for empty initial state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!state.sessionId) return;
    if (state.currentStage === "done") {
      window.sessionStorage.removeItem(storageKey(state.courseId, state.topicId));
      return;
    }
    window.sessionStorage.setItem(storageKey(state.courseId, state.topicId), JSON.stringify(state));
  }, [state]);

  const clearPersisted = useCallback(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(storageKey(courseId, topicId));
  }, [courseId, topicId]);

  return {
    state,
    isInitialized: !!state.sessionId,
    init: (sessionPayload) =>
      dispatch({ type: "init", payload: { courseId, topicId, sessionPayload } }),
    advance: () => dispatch({ type: "advance" }),
    skip: () => dispatch({ type: "skip" }),
    recordRecall: (r) => dispatch({ type: "recordRecall", payload: r }),
    recordActiveRecall: (r) => dispatch({ type: "recordActiveRecall", payload: r }),
    recordMnemonics: (r) => dispatch({ type: "recordMnemonics", payload: r }),
    recordConnections: (r) => dispatch({ type: "recordConnections", payload: r }),
    recordQuiz: (r) => dispatch({ type: "recordQuiz", payload: r }),
    recordMastery: (r) => dispatch({ type: "recordMastery", payload: r }),
    setMasterySnapshot: (s) => dispatch({ type: "setMasterySnapshot", payload: s }),
    clearPersisted,
  };
}
