import { useReducer, useCallback, useMemo } from "react";
import {
  GameState,
  GameMode,
  Conversation,
  ConversationSituation,
  RoundResult,
  ContinuationResponse,
} from "@/lib/types";
import { addPlayerReplyToConversations } from "@/lib/conversation";
import {
  MAX_ROUNDS,
  INITIAL_SURVIVAL_ROUNDS,
  MAX_CONFUSION,
} from "@/lib/constants";
import { CONVERSATION_COMPLETION_BONUS } from "@/lib/scoring";

// ============================================================================
// Types
// ============================================================================

export type GamePhase = "loading" | "playing" | "judging" | "feedback" | "gameover";

export interface InitialSituations {
  pairId: string;
  situationA: ConversationSituation;
  situationB: ConversationSituation;
  situationC?: ConversationSituation;
}

export interface FullGameState {
  phase: GamePhase;
  gameState: GameState | null;
  lastResult: RoundResult | null;
  timeRemaining: number | undefined;
  highScore: number;
  completedThisRound: { A: boolean; B: boolean; C?: boolean };
  pendingContinuations: ContinuationResponse | null;
  endingConversations: { A: boolean; B: boolean; C?: boolean };
  gameOverStartMinimized: boolean;
  initialSurvivalAchieved: boolean;
  isExtremeMode: boolean;
  hasTimer: boolean;
}

export type GameAction =
  | { type: "INIT_GAME"; payload: { situations: InitialSituations; mode: GameMode; isExtremeMode: boolean; hasTimer: boolean; initialTime: number } }
  | { type: "SET_HIGH_SCORE"; payload: number }
  | { type: "SUBMIT_REPLY"; payload: string }
  | { type: "RECEIVE_JUDGMENT"; payload: RoundResult }
  | { type: "SET_PENDING_CONTINUATIONS"; payload: ContinuationResponse }
  | { type: "APPLY_CONTINUATIONS" }
  | { type: "START_NEW_CONVERSATION"; payload: { label: "A" | "B" | "C"; situation: ConversationSituation } }
  | { type: "DISMISS_ENDING"; payload: "A" | "B" | "C" }
  | { type: "CONTINUE_PAST_CHECKPOINT"; payload: { nextTime: number } }
  | { type: "SET_PHASE"; payload: GamePhase }
  | { type: "TICK_TIMER" }
  | { type: "RESET_TIMER"; payload: number }
  | { type: "SET_ERROR"; payload: { result: RoundResult } };

// ============================================================================
// Helper functions
// ============================================================================

function createConversation(situation: ConversationSituation): Conversation {
  return {
    situation,
    transcript: [...situation.initialTranscript],
    confusion: 0,
  };
}

// ============================================================================
// Initial state factory
// ============================================================================

export function createInitialState(hasTimer: boolean, isExtremeMode: boolean): FullGameState {
  return {
    phase: "loading",
    gameState: null,
    lastResult: null,
    timeRemaining: undefined,
    highScore: 0,
    completedThisRound: { A: false, B: false, C: isExtremeMode ? false : undefined },
    pendingContinuations: null,
    endingConversations: { A: false, B: false, C: isExtremeMode ? false : undefined },
    gameOverStartMinimized: false,
    initialSurvivalAchieved: false,
    isExtremeMode,
    hasTimer,
  };
}

// ============================================================================
// Reducer
// ============================================================================

export function gameReducer(state: FullGameState, action: GameAction): FullGameState {
  switch (action.type) {
    case "INIT_GAME": {
      const { situations, mode, isExtremeMode, hasTimer, initialTime } = action.payload;
      const usedIds = [situations.situationA.id, situations.situationB.id];
      if (situations.situationC) {
        usedIds.push(situations.situationC.id);
      }

      return {
        ...state,
        phase: "playing",
        isExtremeMode,
        hasTimer,
        timeRemaining: hasTimer ? initialTime : undefined,
        gameState: {
          mode,
          round: 1,
          score: 0,
          conversationA: createConversation(situations.situationA),
          conversationB: createConversation(situations.situationB),
          conversationC: situations.situationC
            ? createConversation(situations.situationC)
            : undefined,
          usedSituationIds: usedIds,
          usedPairIds: [situations.pairId],
          isGameOver: false,
          completedConversations: 0,
        },
      };
    }

    case "SET_HIGH_SCORE":
      return { ...state, highScore: action.payload };

    case "SUBMIT_REPLY": {
      if (!state.gameState || state.phase !== "playing") return state;

      const reply = action.payload;
      const updatedConversations = addPlayerReplyToConversations(state.gameState, reply);

      return {
        ...state,
        phase: "judging",
        completedThisRound: { A: false, B: false, C: state.isExtremeMode ? false : undefined },
        endingConversations: { A: false, B: false, C: state.isExtremeMode ? false : undefined },
        gameState: {
          ...state.gameState,
          ...updatedConversations,
        },
      };
    }

    case "RECEIVE_JUDGMENT": {
      if (!state.gameState) return state;

      const result = action.payload;

      return {
        ...state,
        lastResult: result,
        gameState: {
          ...state.gameState,
          conversationA: {
            ...state.gameState.conversationA,
            confusion: result.newConfusionA,
          },
          conversationB: {
            ...state.gameState.conversationB,
            confusion: result.newConfusionB,
          },
          conversationC:
            state.gameState.conversationC && result.newConfusionC !== undefined
              ? {
                  ...state.gameState.conversationC,
                  confusion: result.newConfusionC,
                }
              : state.gameState.conversationC,
          score: state.gameState.score + result.scoreGained,
          isGameOver: result.gameOver,
          gameOverReason: result.gameOverReason,
        },
      };
    }

    case "SET_PENDING_CONTINUATIONS":
      return {
        ...state,
        pendingContinuations: action.payload,
        phase: "feedback",
      };

    case "APPLY_CONTINUATIONS": {
      if (!state.gameState || !state.pendingContinuations) return state;

      const continuations = state.pendingContinuations;
      const nextRound = state.gameState.round + 1;

      // Determine checkpoint states
      const isAtInitialCheckpoint =
        nextRound > INITIAL_SURVIVAL_ROUNDS && !state.initialSurvivalAchieved;
      const isAtFinalSurvival = nextRound > MAX_ROUNDS;

      // Build new conversations with NPC responses
      const newConvA: Conversation = {
        ...state.gameState.conversationA,
        transcript: [
          ...state.gameState.conversationA.transcript,
          { role: "them" as const, text: continuations.responseA },
        ],
      };

      const newConvB: Conversation = {
        ...state.gameState.conversationB,
        transcript: [
          ...state.gameState.conversationB.transcript,
          { role: "them" as const, text: continuations.responseB },
        ],
      };

      let newConvC: Conversation | undefined = state.gameState.conversationC;
      if (state.isExtremeMode && state.gameState.conversationC && continuations.responseC) {
        newConvC = {
          ...state.gameState.conversationC,
          transcript: [
            ...state.gameState.conversationC.transcript,
            { role: "them" as const, text: continuations.responseC },
          ],
        };
      }

      // Handle various end states
      if (isAtInitialCheckpoint) {
        return {
          ...state,
          pendingContinuations: null,
          completedThisRound: { A: false, B: false, C: state.isExtremeMode ? false : undefined },
          gameOverStartMinimized: false,
          phase: "gameover",
          gameState: {
            ...state.gameState,
            conversationA: newConvA,
            conversationB: newConvB,
            conversationC: newConvC,
            isGameOver: true,
            gameOverReason: "initial_survived",
          },
        };
      }

      if (isAtFinalSurvival) {
        return {
          ...state,
          pendingContinuations: null,
          completedThisRound: { A: false, B: false, C: state.isExtremeMode ? false : undefined },
          gameOverStartMinimized: false,
          phase: "gameover",
          gameState: {
            ...state.gameState,
            conversationA: newConvA,
            conversationB: newConvB,
            conversationC: newConvC,
            isGameOver: true,
            gameOverReason: "survived",
          },
        };
      }

      // If game was over from confusion, show gameover with minimized modal
      if (state.gameState.isGameOver) {
        return {
          ...state,
          pendingContinuations: null,
          gameOverStartMinimized: true,
          phase: "gameover",
          gameState: {
            ...state.gameState,
            conversationA: newConvA,
            conversationB: newConvB,
            conversationC: newConvC,
          },
        };
      }

      // Normal continuation - advance to next round
      return {
        ...state,
        pendingContinuations: null,
        completedThisRound: { A: false, B: false, C: state.isExtremeMode ? false : undefined },
        endingConversations: {
          A: continuations.endingA,
          B: continuations.endingB,
          C: state.isExtremeMode ? continuations.endingC : undefined,
        },
        phase: "playing",
        gameState: {
          ...state.gameState,
          round: state.gameState.round + 1,
          conversationA: newConvA,
          conversationB: newConvB,
          conversationC: newConvC,
        },
      };
    }

    case "START_NEW_CONVERSATION": {
      if (!state.gameState) return state;

      const { label, situation } = action.payload;
      const newConversation = createConversation(situation);
      const newUsedIds = [...state.gameState.usedSituationIds, situation.id];

      const baseUpdate = {
        score: state.gameState.score + CONVERSATION_COMPLETION_BONUS,
        usedSituationIds: newUsedIds,
        completedConversations: state.gameState.completedConversations + 1,
      };

      let gameStateUpdate: Partial<GameState>;
      if (label === "A") {
        gameStateUpdate = { ...baseUpdate, conversationA: newConversation };
      } else if (label === "B") {
        gameStateUpdate = { ...baseUpdate, conversationB: newConversation };
      } else {
        gameStateUpdate = { ...baseUpdate, conversationC: newConversation };
      }

      return {
        ...state,
        gameState: { ...state.gameState, ...gameStateUpdate },
        endingConversations: { ...state.endingConversations, [label]: false },
        completedThisRound: { ...state.completedThisRound, [label]: true },
      };
    }

    case "DISMISS_ENDING":
      return {
        ...state,
        endingConversations: { ...state.endingConversations, [action.payload]: false },
      };

    case "CONTINUE_PAST_CHECKPOINT":
      if (!state.gameState) return state;
      return {
        ...state,
        initialSurvivalAchieved: true,
        phase: "playing",
        timeRemaining: state.hasTimer ? action.payload.nextTime : undefined,
        gameState: {
          ...state.gameState,
          isGameOver: false,
          gameOverReason: undefined,
        },
      };

    case "SET_PHASE":
      return { ...state, phase: action.payload };

    case "TICK_TIMER":
      if (state.timeRemaining === undefined || state.timeRemaining <= 0) return state;
      return { ...state, timeRemaining: state.timeRemaining - 1 };

    case "RESET_TIMER":
      return { ...state, timeRemaining: action.payload };

    case "SET_ERROR":
      return {
        ...state,
        lastResult: action.payload.result,
        phase: "feedback",
      };

    default:
      return state;
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useGameReducer(hasTimer: boolean, isExtremeMode: boolean) {
  const [state, dispatch] = useReducer(
    gameReducer,
    { hasTimer, isExtremeMode },
    ({ hasTimer, isExtremeMode }) => createInitialState(hasTimer, isExtremeMode)
  );

  // Action creators for convenience
  const initGame = useCallback(
    (situations: InitialSituations, mode: GameMode, initialTime: number) => {
      dispatch({
        type: "INIT_GAME",
        payload: { situations, mode, isExtremeMode, hasTimer, initialTime },
      });
    },
    [isExtremeMode, hasTimer]
  );

  const setHighScore = useCallback((score: number) => {
    dispatch({ type: "SET_HIGH_SCORE", payload: score });
  }, []);

  const submitReply = useCallback((reply: string) => {
    dispatch({ type: "SUBMIT_REPLY", payload: reply });
  }, []);

  const receiveJudgment = useCallback((result: RoundResult) => {
    dispatch({ type: "RECEIVE_JUDGMENT", payload: result });
  }, []);

  const setPendingContinuations = useCallback((continuations: ContinuationResponse) => {
    dispatch({ type: "SET_PENDING_CONTINUATIONS", payload: continuations });
  }, []);

  const applyContinuations = useCallback(() => {
    dispatch({ type: "APPLY_CONTINUATIONS" });
  }, []);

  const startNewConversation = useCallback(
    (label: "A" | "B" | "C", situation: ConversationSituation) => {
      dispatch({ type: "START_NEW_CONVERSATION", payload: { label, situation } });
    },
    []
  );

  const dismissEnding = useCallback((label: "A" | "B" | "C") => {
    dispatch({ type: "DISMISS_ENDING", payload: label });
  }, []);

  const continuePastCheckpoint = useCallback((nextTime: number) => {
    dispatch({ type: "CONTINUE_PAST_CHECKPOINT", payload: { nextTime } });
  }, []);

  const setPhase = useCallback((phase: GamePhase) => {
    dispatch({ type: "SET_PHASE", payload: phase });
  }, []);

  const tickTimer = useCallback(() => {
    dispatch({ type: "TICK_TIMER" });
  }, []);

  const resetTimer = useCallback((time: number) => {
    dispatch({ type: "RESET_TIMER", payload: time });
  }, []);

  const setError = useCallback((result: RoundResult) => {
    dispatch({ type: "SET_ERROR", payload: { result } });
  }, []);

  const actions = useMemo(() => ({
    initGame,
    setHighScore,
    submitReply,
    receiveJudgment,
    setPendingContinuations,
    applyContinuations,
    startNewConversation,
    dismissEnding,
    continuePastCheckpoint,
    setPhase,
    tickTimer,
    resetTimer,
    setError,
  }), [
    initGame,
    setHighScore,
    submitReply,
    receiveJudgment,
    setPendingContinuations,
    applyContinuations,
    startNewConversation,
    dismissEnding,
    continuePastCheckpoint,
    setPhase,
    tickTimer,
    resetTimer,
    setError,
  ]);

  return {
    state,
    dispatch,
    actions,
  };
}
