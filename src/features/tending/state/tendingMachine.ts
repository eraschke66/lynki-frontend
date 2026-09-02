import { useCallback, useMemo, useReducer } from "react";
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

export function nextStage(current: Stage): Stage {
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
  hydrate: (session: TendingSession) => void;
  advance: () => void;
  skip: () => void;
  recordRecall: (r: RecallResult[]) => void;
  recordActiveRecall: (r: ActiveRecallResult) => void;
  recordMnemonics: (r: MnemonicResult[]) => void;
  recordConnections: (r: ConnectionResult[]) => void;
  recordQuiz: (r: QuizResult) => void;
  recordMastery: (r: MasteryDelta) => void;
  setMasterySnapshot: (s: CourseMasterySnapshot) => void;
}

/**
 * Drives the linear Tending Flow stage progression. Purely in-memory —
 * durability lives in `topic_tending_sessions` (written per-stage via
 * tendingProgressApi.ts as the page calls advance()/skip()), not in this
 * hook. TendingFlowPage is responsible for calling `hydrate()` with a
 * DB-loaded session when resuming, and `init()` when starting fresh.
 *
 * Every action creator is wrapped in useCallback, and the returned object in
 * useMemo, so the whole `TendingMachine` identity (and each individual
 * method) only changes when `state` actually changes — never on an
 * unrelated re-render. This matters: several effects in TendingFlowPage
 * depend on `machine` or its methods (e.g. `init`), and if those weren't
 * stable, any unrelated re-render (a sibling query refetching, a resume
 * check resolving, React StrictMode's dev double-invoke) would look like a
 * "changed dependency" and re-fire those effects — including the one that
 * calls /topic-tending/generate, where a spurious re-fire is a real,
 * uncancelable, duplicate Claude generation + DB insert, not just a harmless
 * re-render. Stable identities are the first line of defence; the in-flight
 * promise ref in useResumeOrGenerateSession is the backstop.
 */
export function useTendingMachine(courseId: string, topicId: string): TendingMachine {
  const [state, dispatch] = useReducer(reducer, emptyState);

  const init = useCallback(
    (sessionPayload: TendingSessionPayload) =>
      dispatch({ type: "init", payload: { courseId, topicId, sessionPayload } }),
    [courseId, topicId],
  );
  const hydrate = useCallback(
    (session: TendingSession) => dispatch({ type: "hydrate", payload: session }),
    [],
  );
  const advance = useCallback(() => dispatch({ type: "advance" }), []);
  const skip = useCallback(() => dispatch({ type: "skip" }), []);
  const recordRecall = useCallback(
    (r: RecallResult[]) => dispatch({ type: "recordRecall", payload: r }),
    [],
  );
  const recordActiveRecall = useCallback(
    (r: ActiveRecallResult) => dispatch({ type: "recordActiveRecall", payload: r }),
    [],
  );
  const recordMnemonics = useCallback(
    (r: MnemonicResult[]) => dispatch({ type: "recordMnemonics", payload: r }),
    [],
  );
  const recordConnections = useCallback(
    (r: ConnectionResult[]) => dispatch({ type: "recordConnections", payload: r }),
    [],
  );
  const recordQuiz = useCallback(
    (r: QuizResult) => dispatch({ type: "recordQuiz", payload: r }),
    [],
  );
  const recordMastery = useCallback(
    (r: MasteryDelta) => dispatch({ type: "recordMastery", payload: r }),
    [],
  );
  const setMasterySnapshot = useCallback(
    (s: CourseMasterySnapshot) => dispatch({ type: "setMasterySnapshot", payload: s }),
    [],
  );

  return useMemo(
    () => ({
      state,
      isInitialized: !!state.sessionId,
      init,
      hydrate,
      advance,
      skip,
      recordRecall,
      recordActiveRecall,
      recordMnemonics,
      recordConnections,
      recordQuiz,
      recordMastery,
      setMasterySnapshot,
    }),
    [
      state,
      init,
      hydrate,
      advance,
      skip,
      recordRecall,
      recordActiveRecall,
      recordMnemonics,
      recordConnections,
      recordQuiz,
      recordMastery,
      setMasterySnapshot,
    ],
  );
}
