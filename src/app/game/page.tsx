"use client";

import { Suspense, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  GameMode,
  Conversation,
  ConversationSituation,
  RoundResult,
  ContinuationResponse,
} from "@/lib/types";
import { addReplyToConversation } from "@/lib/conversation";
import { getStoredData, updateHighScore } from "@/lib/storage";
import { saveScore } from "@/lib/useAuth";
import {
  MAX_ROUNDS,
  INITIAL_SURVIVAL_ROUNDS,
  TIMER_INITIAL_SECONDS,
  TIMER_MIN_SECONDS,
  TIMER_DECREMENT_PER_ROUND,
  NEUTRAL_SCORE,
} from "@/lib/constants";
import GameHeader from "@/components/GameHeader";
import ConversationPanel from "@/components/ConversationPanel";
import MobileConversationTabs from "@/components/MobileConversationTabs";
import ReplyInput from "@/components/ReplyInput";
import JudgeFeedback from "@/components/JudgeFeedback";
import ConversationFeedback from "@/components/ConversationFeedback";
import FeedbackSummaryBar from "@/components/FeedbackSummaryBar";
import GameOverModal from "@/components/GameOverModal";
import { useGameReducer, InitialSituations } from "./useGameReducer";
import { useGameTimer, calculateNextRoundTime } from "./useGameTimer";

function LoadingSpinner() {
  return (
    <div className="min-h-dvh bg-black flex items-center justify-center font-mono">
      <motion.div
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="text-white text-2xl"
      >
        [LOADING...]
      </motion.div>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <GamePageContent />
    </Suspense>
  );
}

function GamePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const mode = (searchParams.get("mode") as GameMode) || "classic";
  const hasTimer = mode === "timer";
  const isExtremeMode = mode === "extreme";

  // Use the game reducer for all state management
  const { state, actions } = useGameReducer(hasTimer, isExtremeMode);
  const {
    phase,
    gameState,
    lastResult,
    timeRemaining,
    highScore,
    completedThisRound,
    pendingContinuations,
    endingConversations,
    gameOverStartMinimized,
    initialSurvivalAchieved,
  } = state;

  // Refs for timer handling
  const submitRef = useRef<((reply: string) => Promise<void>) | null>(null);

  // Load high score on mount
  useEffect(() => {
    const data = getStoredData();
    if (mode === "daily") {
      actions.setHighScore(data.highScores.daily.score);
    } else if (mode === "custom") {
      // Custom mode high scores are stored server-side, not in localStorage
      actions.setHighScore(0);
    } else {
      actions.setHighScore(data.highScores[mode]);
    }
  }, [mode, actions]);

  // Fetch initial situations for game start
  const fetchInitialSituations = useCallback(async (): Promise<InitialSituations | null> => {
    try {
      const params = new URLSearchParams({
        mode,
        usedIds: "",
        usedPairIds: "",
      });

      const res = await fetch(`/api/round?${params}`);
      if (!res.ok) throw new Error("Failed to fetch situations");

      return await res.json();
    } catch (error) {
      console.error("Error fetching situations:", error);
      return null;
    }
  }, [mode]);

  // Fetch a single new situation for conversation swapping
  const fetchSingleSituation = useCallback(
    async (usedIds: string[]): Promise<ConversationSituation | null> => {
      try {
        const params = new URLSearchParams({
          mode,
          usedIds: usedIds.join(","),
          single: "true",
        });

        const res = await fetch(`/api/round?${params}`);
        if (!res.ok) return null;

        const data = await res.json();
        return data.situationA as ConversationSituation;
      } catch (error) {
        console.error("Error fetching single situation:", error);
        return null;
      }
    },
    [mode]
  );

  // Fetch conversation continuations from LLM
  const fetchContinuations = useCallback(
    async (convA: Conversation, convB: Conversation, convC?: Conversation): Promise<ContinuationResponse> => {
      try {
        const res = await fetch("/api/continue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationA: convA,
            conversationB: convB,
            conversationC: convC,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch continuations");
        }

        return await res.json();
      } catch (error) {
        console.error("Error fetching continuations:", error);
        return {
          responseA: "Okay",
          responseB: "Okay",
          responseC: convC ? "Okay" : undefined,
          endingA: false,
          endingB: false,
          endingC: convC ? false : undefined,
        };
      }
    },
    []
  );

  // Initialize game
  useEffect(() => {
    const initGame = async () => {
      const initialData = await fetchInitialSituations();
      if (!initialData) {
        router.push("/");
        return;
      }

      // For extreme mode: fetch a third situation if not provided
      let situationC = initialData.situationC;
      if (isExtremeMode && !situationC) {
        const usedIds = [initialData.situationA.id, initialData.situationB.id];
        situationC = await fetchSingleSituation(usedIds) ?? undefined;
      }

      actions.initGame(
        { ...initialData, situationC },
        mode,
        TIMER_INITIAL_SECONDS
      );
    };

    initGame();
  }, [fetchInitialSituations, fetchSingleSituation, mode, router, isExtremeMode, actions]);

  // Handle reply submission
  const handleSubmitReply = useCallback(
    async (reply: string) => {
      if (!gameState || phase !== "playing") return;

      // Update state to show reply and transition to judging
      actions.submitReply(reply);

      try {
        const res = await fetch("/api/judge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationA: gameState.conversationA,
            conversationB: gameState.conversationB,
            conversationC: gameState.conversationC,
            playerReply: reply,
            currentConfusionA: gameState.conversationA.confusion,
            currentConfusionB: gameState.conversationB.confusion,
            currentConfusionC: gameState.conversationC?.confusion,
            roundNumber: gameState.round,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Judge failed");
        }

        const result: RoundResult = await res.json();
        actions.receiveJudgment(result);

        // Update high score immediately if game over
        if (result.gameOver) {
          const finalScore = gameState.score + result.scoreGained;
          updateHighScore(mode, finalScore, gameState.round);
          saveScore(mode, finalScore, gameState.round);
        }

        // Fetch continuations to show NPC responses
        const updatedConvA: Conversation = {
          ...addReplyToConversation(gameState.conversationA, reply),
          confusion: result.newConfusionA,
        };
        const updatedConvB: Conversation = {
          ...addReplyToConversation(gameState.conversationB, reply),
          confusion: result.newConfusionB,
        };
        const updatedConvC: Conversation | undefined =
          gameState.conversationC && result.newConfusionC !== undefined
            ? {
                ...addReplyToConversation(gameState.conversationC, reply),
                confusion: result.newConfusionC,
              }
            : undefined;

        const continuations = await fetchContinuations(updatedConvA, updatedConvB, updatedConvC);
        actions.setPendingContinuations(continuations);
      } catch (error) {
        console.error("Error judging reply:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const isRateLimited = errorMessage.toLowerCase().includes("rate limit");

        const neutralScore = {
          coherence: NEUTRAL_SCORE,
          relevance: NEUTRAL_SCORE,
          tone_match: NEUTRAL_SCORE,
          directness: NEUTRAL_SCORE,
          contradiction: false,
          unsafe: false,
          notes: isRateLimited
            ? ["⚠️ " + errorMessage, "Neutral score applied - try again shortly"]
            : ["⚠️ Error: " + errorMessage, "Neutral score applied"],
        };

        actions.setError({
          evaluation: {
            A: neutralScore,
            B: neutralScore,
            C: isExtremeMode ? neutralScore : undefined,
          },
          confusionDelta: { A: 0, B: 0, C: isExtremeMode ? 0 : undefined },
          scoreGained: 0,
          newConfusionA: gameState.conversationA.confusion,
          newConfusionB: gameState.conversationB.confusion,
          newConfusionC: gameState.conversationC?.confusion,
          gameOver: false,
        });
      }
    },
    [gameState, phase, mode, isExtremeMode, fetchContinuations, actions]
  );

  // Update ref when handleSubmitReply changes
  useEffect(() => {
    submitRef.current = handleSubmitReply;
  }, [handleSubmitReply]);

  // Timer logic
  useGameTimer({
    hasTimer,
    phase,
    timeRemaining,
    onTick: actions.tickTimer,
    onExpire: useCallback(() => {
      if (submitRef.current) {
        submitRef.current("...");
      }
    }, []),
  });

  // Handle continue to next round
  const handleContinue = useCallback(() => {
    if (!gameState || !pendingContinuations) return;

    // Check if we're at final survival (before applying continuations)
    const nextRound = gameState.round + 1;
    const isAtFinalSurvival = nextRound > MAX_ROUNDS && !gameState.isGameOver;

    if (isAtFinalSurvival) {
      updateHighScore(mode, gameState.score, gameState.round);
      saveScore(mode, gameState.score, gameState.round);
    }

    // Apply continuations (reducer handles all the state transitions)
    actions.applyContinuations();

    // Reset timer for next round if continuing to play
    if (hasTimer && !gameState.isGameOver && nextRound <= MAX_ROUNDS) {
      const nextTime = calculateNextRoundTime(
        gameState.round,
        TIMER_INITIAL_SECONDS,
        TIMER_DECREMENT_PER_ROUND,
        TIMER_MIN_SECONDS
      );
      actions.resetTimer(nextTime);
    }
  }, [gameState, pendingContinuations, mode, hasTimer, actions]);

  // Handle starting a new conversation
  const handleStartNewConversation = useCallback(
    async (label: "A" | "B" | "C") => {
      if (!gameState) return;

      const newSituation = await fetchSingleSituation(gameState.usedSituationIds);
      if (!newSituation) return;

      actions.startNewConversation(label, newSituation);
    },
    [gameState, fetchSingleSituation, actions]
  );

  // Handle continuing current conversation (dismisses the ending prompt)
  const handleContinueCurrent = useCallback(
    (label: "A" | "B" | "C") => {
      actions.dismissEnding(label);
    },
    [actions]
  );

  // Handle continuing past initial survival checkpoint
  const handleContinuePastCheckpoint = useCallback(() => {
    if (!gameState) return;

    const nextTime = calculateNextRoundTime(
      gameState.round,
      TIMER_INITIAL_SECONDS,
      TIMER_DECREMENT_PER_ROUND,
      TIMER_MIN_SECONDS
    );
    actions.continuePastCheckpoint(nextTime);
  }, [gameState, actions]);

  // Handle quit
  const handleQuit = useCallback(() => {
    if (gameState) {
      updateHighScore(mode, gameState.score, gameState.round);
      saveScore(mode, gameState.score, gameState.round);
    }
    router.push("/");
  }, [gameState, mode, router]);

  // Handle play again
  const handlePlayAgain = useCallback(() => {
    window.location.reload();
  }, []);

  // Loading state
  if (phase === "loading" || !gameState) {
    return (
      <div className="min-h-dvh bg-black flex items-center justify-center font-mono">
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="text-white text-xl"
        >
          [LOADING...]
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-black flex flex-col overflow-hidden">
      <GameHeader
        round={gameState.round}
        score={gameState.score}
        mode={mode}
        onQuit={handleQuit}
        targetRound={initialSurvivalAchieved ? MAX_ROUNDS : INITIAL_SURVIVAL_ROUNDS}
      />

      <main className="flex-1 min-h-0 flex flex-col p-2 md:p-4 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Mobile: Tabbed conversations */}
        <div className="md:hidden flex-1 min-h-0 pb-28 overflow-hidden">
          <MobileConversationTabs
            conversations={[
              {
                label: "A",
                conversation: gameState.conversationA,
                delta: lastResult?.confusionDelta.A,
                isEnding: phase === "playing" && endingConversations.A,
                onStartNew: () => handleStartNewConversation("A"),
                onContinueCurrent: () => handleContinueCurrent("A"),
                isGameOverCause: gameState.isGameOver && gameState.gameOverReason === "A",
              },
              {
                label: "B",
                conversation: gameState.conversationB,
                delta: lastResult?.confusionDelta.B,
                isEnding: phase === "playing" && endingConversations.B,
                onStartNew: () => handleStartNewConversation("B"),
                onContinueCurrent: () => handleContinueCurrent("B"),
                isGameOverCause: gameState.isGameOver && gameState.gameOverReason === "B",
              },
              ...(isExtremeMode && gameState.conversationC
                ? [
                    {
                      label: "C" as const,
                      conversation: gameState.conversationC,
                      delta: lastResult?.confusionDelta.C,
                      isEnding: phase === "playing" && endingConversations.C,
                      onStartNew: () => handleStartNewConversation("C"),
                      onContinueCurrent: () => handleContinueCurrent("C"),
                      isGameOverCause: gameState.isGameOver && gameState.gameOverReason === "C",
                    },
                  ]
                : []),
            ]}
            showDelta={phase === "feedback"}
          />
        </div>

        {/* Desktop: Grid layout */}
        <div
          className={`hidden md:grid flex-1 min-h-0 grid-cols-1 gap-4 mb-4 ${
            isExtremeMode ? "lg:grid-cols-3" : "lg:grid-cols-2"
          } ${phase === "feedback" ? "max-h-[70vh]" : "max-h-[60vh]"}`}
        >
          {/* Conversation A with inline feedback */}
          <div className="flex flex-col min-h-0 overflow-hidden">
            <ConversationPanel
              conversation={gameState.conversationA}
              label="A"
              delta={lastResult?.confusionDelta.A}
              showDelta={phase === "feedback"}
              isEnding={phase === "playing" && endingConversations.A}
              onStartNew={() => handleStartNewConversation("A")}
              onContinueCurrent={() => handleContinueCurrent("A")}
              isGameOverCause={gameState.isGameOver && gameState.gameOverReason === "A"}
            />
            {phase === "feedback" && lastResult && (
              <ConversationFeedback
                label="A"
                scores={lastResult.evaluation.A}
                delta={lastResult.confusionDelta.A}
              />
            )}
          </div>

          {/* Conversation B with inline feedback */}
          <div className="flex flex-col min-h-0 overflow-hidden">
            <ConversationPanel
              conversation={gameState.conversationB}
              label="B"
              delta={lastResult?.confusionDelta.B}
              showDelta={phase === "feedback"}
              isEnding={phase === "playing" && endingConversations.B}
              onStartNew={() => handleStartNewConversation("B")}
              onContinueCurrent={() => handleContinueCurrent("B")}
              isGameOverCause={gameState.isGameOver && gameState.gameOverReason === "B"}
            />
            {phase === "feedback" && lastResult && (
              <ConversationFeedback
                label="B"
                scores={lastResult.evaluation.B}
                delta={lastResult.confusionDelta.B}
              />
            )}
          </div>

          {/* Conversation C with inline feedback (extreme mode only) */}
          {isExtremeMode && gameState.conversationC && (
            <div className="flex flex-col min-h-0 overflow-hidden">
              <ConversationPanel
                conversation={gameState.conversationC}
                label="C"
                delta={lastResult?.confusionDelta.C}
                showDelta={phase === "feedback"}
                isEnding={phase === "playing" && endingConversations.C}
                onStartNew={() => handleStartNewConversation("C")}
                onContinueCurrent={() => handleContinueCurrent("C")}
                isGameOverCause={gameState.isGameOver && gameState.gameOverReason === "C"}
              />
              {phase === "feedback" && lastResult?.evaluation.C && lastResult.confusionDelta.C !== undefined && (
                <ConversationFeedback
                  label="C"
                  scores={lastResult.evaluation.C}
                  delta={lastResult.confusionDelta.C}
                />
              )}
            </div>
          )}
        </div>

        {/* Input or Feedback */}
        <AnimatePresence mode="wait">
          {phase === "playing" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ReplyInput
                onSubmit={handleSubmitReply}
                disabled={false}
                isLoading={false}
                timeRemaining={timeRemaining}
              />
            </motion.div>
          )}

          {phase === "judging" && (
            <motion.div
              key="judging"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 font-mono"
            >
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="text-white text-xl mb-4"
              >
                [EVALUATING...]
              </motion.div>
              <p className="text-gray-500">Processing your reply...</p>
            </motion.div>
          )}

          {phase === "feedback" && lastResult && pendingContinuations && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Desktop: Summary bar only (feedback is inline above) */}
              <div className="hidden md:block">
                <FeedbackSummaryBar
                  scoreGained={lastResult.scoreGained}
                  onContinue={handleContinue}
                  completedConversations={completedThisRound}
                  isGameOver={gameState.isGameOver}
                  gameOverReason={gameState.gameOverReason as "A" | "B" | "C" | undefined}
                />
              </div>
              {/* Mobile: Full feedback modal */}
              <div className="md:hidden">
                <JudgeFeedback
                  result={lastResult.evaluation}
                  confusionDelta={lastResult.confusionDelta}
                  scoreGained={lastResult.scoreGained}
                  onContinue={handleContinue}
                  completedConversations={completedThisRound}
                  isExtremeMode={isExtremeMode}
                  isGameOver={gameState.isGameOver}
                  gameOverReason={gameState.gameOverReason as "A" | "B" | "C" | undefined}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Game Over Modal */}
      <AnimatePresence>
        {phase === "gameover" && (
          <GameOverModal
            score={gameState.score}
            rounds={gameState.round}
            mode={mode}
            reason={gameState.gameOverReason}
            highScore={highScore}
            onPlayAgain={handlePlayAgain}
            onMainMenu={() => router.push("/")}
            onContinue={
              gameState.gameOverReason === "initial_survived" ? handleContinuePastCheckpoint : undefined
            }
            startMinimized={gameOverStartMinimized}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
