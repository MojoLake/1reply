"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  GameState,
  GameMode,
  Conversation,
  ConversationSituation,
  RoundResult,
  ContinuationResponse,
} from "@/lib/types";
import { getStoredData, updateHighScore } from "@/lib/storage";
import { CONVERSATION_COMPLETION_BONUS } from "@/lib/scoring";
import {
  MAX_ROUNDS,
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
import GameOverModal from "@/components/GameOverModal";

type GamePhase = "loading" | "playing" | "judging" | "feedback" | "gameover";

function createConversation(situation: ConversationSituation): Conversation {
  return {
    situation,
    transcript: [...situation.initialTranscript],
    confusion: 0,
  };
}

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

  const [phase, setPhase] = useState<GamePhase>("loading");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | undefined>(
    hasTimer ? TIMER_INITIAL_SECONDS : undefined
  );
  const [highScore, setHighScore] = useState(0);
  const [completedThisRound, setCompletedThisRound] = useState<{
    A: boolean;
    B: boolean;
    C?: boolean;
  }>({ A: false, B: false });
  const [pendingContinuations, setPendingContinuations] = useState<ContinuationResponse | null>(null);
  const [endingConversations, setEndingConversations] = useState<{
    A: boolean;
    B: boolean;
    C?: boolean;
  }>({ A: false, B: false });
  const [gameOverStartMinimized, setGameOverStartMinimized] = useState(false);

  // Refs for timer handling
  const submitRef = useRef<((reply: string) => Promise<void>) | null>(null);
  const isSubmittingRef = useRef(false);

  // Load high score
  useEffect(() => {
    const data = getStoredData();
    if (mode === "daily") {
      setHighScore(data.highScores.daily.score);
    } else {
      setHighScore(data.highScores[mode]);
    }
  }, [mode]);

  // Fetch initial situations for game start
  const fetchInitialSituations = useCallback(
    async () => {
      try {
        const params = new URLSearchParams({
          mode,
          usedIds: "",
          usedPairIds: "",
        });

        const res = await fetch(`/api/round?${params}`);
        if (!res.ok) throw new Error("Failed to fetch situations");

        const data = await res.json();
        return data as {
          pairId: string;
          situationA: ConversationSituation;
          situationB: ConversationSituation;
          situationC?: ConversationSituation;
        };
      } catch (error) {
        console.error("Error fetching situations:", error);
        return null;
      }
    },
    [mode]
  );

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
        // Return situationA from the response
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

        const data: ContinuationResponse = await res.json();
        return data;
      } catch (error) {
        console.error("Error fetching continuations:", error);
        // Fallback to simple responses
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

      // Collect used situation IDs
      const usedIds = [initialData.situationA.id, initialData.situationB.id];
      
      // For extreme mode: use the trio's situationC if available, otherwise fetch a third
      let situationC: ConversationSituation | null | undefined = initialData.situationC;
      
      if (isExtremeMode && !situationC) {
        situationC = await fetchSingleSituation(usedIds);
      }
      
      if (situationC) {
        usedIds.push(situationC.id);
      }
      
      setGameState({
        mode,
        round: 1,
        score: 0,
        conversationA: createConversation(initialData.situationA),
        conversationB: createConversation(initialData.situationB),
        conversationC: situationC ? createConversation(situationC) : undefined,
        usedSituationIds: usedIds,
        usedPairIds: [initialData.pairId],
        isGameOver: false,
        completedConversations: 0,
      });
      setPhase("playing");
      if (hasTimer) setTimeRemaining(TIMER_INITIAL_SECONDS);
    };

    initGame();
  }, [fetchInitialSituations, fetchSingleSituation, mode, router, hasTimer, isExtremeMode]);

  // Handle reply submission
  const handleSubmitReply = useCallback(
    async (reply: string) => {
      if (!gameState || phase !== "playing" || isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      // Clear any completion status from previous round and ending flags (player chose to continue by replying)
      setCompletedThisRound({ A: false, B: false, C: isExtremeMode ? false : undefined });
      setEndingConversations({ A: false, B: false, C: isExtremeMode ? false : undefined });

      // Immediately add the player's reply to all conversation transcripts for instant UI feedback
      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          conversationA: {
            ...prev.conversationA,
            transcript: [...prev.conversationA.transcript, { role: "player" as const, text: reply }],
          },
          conversationB: {
            ...prev.conversationB,
            transcript: [...prev.conversationB.transcript, { role: "player" as const, text: reply }],
          },
          conversationC: prev.conversationC ? {
            ...prev.conversationC,
            transcript: [...prev.conversationC.transcript, { role: "player" as const, text: reply }],
          } : undefined,
        };
      });

      setPhase("judging");

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
        setLastResult(result);

        // Update game state with new confusion levels (transcript already updated above)
        setGameState((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            conversationA: {
              ...prev.conversationA,
              confusion: result.newConfusionA,
            },
            conversationB: {
              ...prev.conversationB,
              confusion: result.newConfusionB,
            },
            conversationC: prev.conversationC && result.newConfusionC !== undefined
              ? {
                  ...prev.conversationC,
                  confusion: result.newConfusionC,
                }
              : prev.conversationC,
            score: prev.score + result.scoreGained,
            isGameOver: result.gameOver,
            gameOverReason: result.gameOverReason,
          };
        });

        // Update high score immediately if game over
        if (result.gameOver) {
          const finalScore = gameState.score + result.scoreGained;
          updateHighScore(mode, finalScore, gameState.round);
        }

        // Always fetch continuations and show feedback (even on game over)
        // This lets players see the NPC responses and analysis before the game over modal
        const updatedConvA = {
          ...gameState.conversationA,
          confusion: result.newConfusionA,
          transcript: [
            ...gameState.conversationA.transcript,
            { role: "player" as const, text: reply },
          ],
        };
        const updatedConvB = {
          ...gameState.conversationB,
          confusion: result.newConfusionB,
          transcript: [
            ...gameState.conversationB.transcript,
            { role: "player" as const, text: reply },
          ],
        };
        const updatedConvC = gameState.conversationC && result.newConfusionC !== undefined
          ? {
              ...gameState.conversationC,
              confusion: result.newConfusionC,
              transcript: [
                ...gameState.conversationC.transcript,
                { role: "player" as const, text: reply },
              ],
            }
          : undefined;
        const continuations = await fetchContinuations(updatedConvA, updatedConvB, updatedConvC);
        setPendingContinuations(continuations);
        setPhase("feedback");
      } catch (error) {
        console.error("Error judging reply:", error);
        // Extract error message for user display
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const isRateLimited = errorMessage.toLowerCase().includes("rate limit");
        
        // On error, show feedback with neutral result and the actual error
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
        setLastResult({
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
        setPhase("feedback");
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [gameState, phase, mode, isExtremeMode, fetchContinuations]
  );

  // Update ref when handleSubmitReply changes
  useEffect(() => {
    submitRef.current = handleSubmitReply;
  }, [handleSubmitReply]);

  // Timer logic
  useEffect(() => {
    if (!hasTimer || phase !== "playing" || timeRemaining === undefined) return;

    if (timeRemaining <= 0) {
      // Auto-submit when timer expires
      if (submitRef.current && !isSubmittingRef.current) {
        submitRef.current("...");
      }
      return;
    }

    const timer = setTimeout(() => {
      setTimeRemaining((t) => (t !== undefined ? t - 1 : undefined));
    }, 1000);

    return () => clearTimeout(timer);
  }, [hasTimer, phase, timeRemaining]);

  // Handle continue to next round - always continue all conversations
  const handleContinue = () => {
    if (!gameState || !pendingContinuations) return;

    const continuations = pendingContinuations;

    // Apply continuations to show NPC responses in all cases
    setGameState((prev) => {
      if (!prev) return prev;

      // Continue all conversations with the LLM responses
      const newConvA: Conversation = {
        ...prev.conversationA,
        transcript: [
          ...prev.conversationA.transcript,
          { role: "them" as const, text: continuations.responseA },
        ],
      };

      const newConvB: Conversation = {
        ...prev.conversationB,
        transcript: [
          ...prev.conversationB.transcript,
          { role: "them" as const, text: continuations.responseB },
        ],
      };

      let newConvC: Conversation | undefined = prev.conversationC;
      if (isExtremeMode && prev.conversationC && continuations.responseC) {
        newConvC = {
          ...prev.conversationC,
          transcript: [
            ...prev.conversationC.transcript,
            { role: "them" as const, text: continuations.responseC },
          ],
        };
      }

      // If game is over, don't increment round
      if (prev.isGameOver) {
        return {
          ...prev,
          conversationA: newConvA,
          conversationB: newConvB,
          conversationC: newConvC,
        };
      }

      // Otherwise increment round as normal
      return {
        ...prev,
        round: prev.round + 1,
        conversationA: newConvA,
        conversationB: newConvB,
        conversationC: newConvC,
      };
    });

    // Clear pending continuations
    setPendingContinuations(null);

    // If game was over, transition to gameover phase now that NPC responses are visible
    // Start with modal minimized so player can see the final messages in conversations
    if (gameState.isGameOver) {
      setGameOverStartMinimized(true);
      setPhase("gameover");
      return;
    }

    setCompletedThisRound({ A: false, B: false, C: isExtremeMode ? false : undefined });

    const nextRound = gameState.round + 1;

    // Check if max replies reached - survived! Show full modal (not minimized)
    if (nextRound > MAX_ROUNDS) {
      updateHighScore(mode, gameState.score, gameState.round);
      setGameState((prev) =>
        prev ? { ...prev, isGameOver: true, gameOverReason: "survived" } : prev
      );
      setGameOverStartMinimized(false);
      setPhase("gameover");
      return;
    }

    // Store ending flags for display in playing phase
    setEndingConversations({
      A: pendingContinuations.endingA,
      B: pendingContinuations.endingB,
      C: isExtremeMode ? pendingContinuations.endingC : undefined,
    });

    if (hasTimer) setTimeRemaining(Math.max(TIMER_MIN_SECONDS, TIMER_INITIAL_SECONDS + 5 - nextRound * TIMER_DECREMENT_PER_ROUND));
    setPhase("playing");
  };

  // Handle starting a new conversation when user clicks "Start New" on an ending conversation
  const handleStartNewConversation = useCallback(
    async (label: "A" | "B" | "C") => {
      if (!gameState) return;

      // Fetch a new situation
      const newSituation = await fetchSingleSituation(gameState.usedSituationIds);
      if (!newSituation) return;

      // Update game state with new conversation and bonus
      setGameState((prev) => {
        if (!prev) return prev;

        const newUsedIds = [...prev.usedSituationIds, newSituation.id];
        const newConversation = createConversation(newSituation);

        if (label === "A") {
          return {
            ...prev,
            conversationA: newConversation,
            score: prev.score + CONVERSATION_COMPLETION_BONUS,
            usedSituationIds: newUsedIds,
            completedConversations: prev.completedConversations + 1,
          };
        } else if (label === "B") {
          return {
            ...prev,
            conversationB: newConversation,
            score: prev.score + CONVERSATION_COMPLETION_BONUS,
            usedSituationIds: newUsedIds,
            completedConversations: prev.completedConversations + 1,
          };
        } else {
          return {
            ...prev,
            conversationC: newConversation,
            score: prev.score + CONVERSATION_COMPLETION_BONUS,
            usedSituationIds: newUsedIds,
            completedConversations: prev.completedConversations + 1,
          };
        }
      });

      // Clear the ending flag for this conversation
      setEndingConversations((prev) => ({
        ...prev,
        [label]: false,
      }));

      // Track completion for this round
      setCompletedThisRound((prev) => ({
        ...prev,
        [label]: true,
      }));
    },
    [gameState, fetchSingleSituation]
  );

  // Handle continuing current conversation (dismisses the ending prompt)
  const handleContinueCurrent = useCallback(
    (label: "A" | "B" | "C") => {
      // Just clear the ending flag - player chose to continue this conversation
      setEndingConversations((prev) => ({
        ...prev,
        [label]: false,
      }));
    },
    []
  );

  // Handle quit
  const handleQuit = () => {
    if (gameState) {
      updateHighScore(mode, gameState.score, gameState.round);
    }
    router.push("/");
  };

  // Handle play again
  const handlePlayAgain = () => {
    window.location.reload();
  };

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
              },
              {
                label: "B",
                conversation: gameState.conversationB,
                delta: lastResult?.confusionDelta.B,
                isEnding: phase === "playing" && endingConversations.B,
                onStartNew: () => handleStartNewConversation("B"),
                onContinueCurrent: () => handleContinueCurrent("B"),
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
                    },
                  ]
                : []),
            ]}
            showDelta={phase === "feedback"}
          />
        </div>

        {/* Desktop: Grid layout */}
        <div className={`hidden md:grid flex-1 min-h-0 max-h-[60vh] grid-cols-1 gap-4 mb-4 ${
          isExtremeMode 
            ? "lg:grid-cols-3" 
            : "lg:grid-cols-2"
        }`}>
          <ConversationPanel
            conversation={gameState.conversationA}
            label="A"
            delta={lastResult?.confusionDelta.A}
            showDelta={phase === "feedback"}
            isEnding={phase === "playing" && endingConversations.A}
            onStartNew={() => handleStartNewConversation("A")}
            onContinueCurrent={() => handleContinueCurrent("A")}
          />
          <ConversationPanel
            conversation={gameState.conversationB}
            label="B"
            delta={lastResult?.confusionDelta.B}
            showDelta={phase === "feedback"}
            isEnding={phase === "playing" && endingConversations.B}
            onStartNew={() => handleStartNewConversation("B")}
            onContinueCurrent={() => handleContinueCurrent("B")}
          />
          {isExtremeMode && gameState.conversationC && (
            <ConversationPanel
              conversation={gameState.conversationC}
              label="C"
              delta={lastResult?.confusionDelta.C}
              showDelta={phase === "feedback"}
              isEnding={phase === "playing" && endingConversations.C}
              onStartNew={() => handleStartNewConversation("C")}
              onContinueCurrent={() => handleContinueCurrent("C")}
            />
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
            startMinimized={gameOverStartMinimized}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
