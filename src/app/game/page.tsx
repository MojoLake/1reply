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
  Difficulty,
  ContinuationResponse,
} from "@/lib/types";
import { getStoredData, updateHighScore } from "@/lib/storage";
import { CONVERSATION_COMPLETION_BONUS } from "@/lib/scoring";
import GameHeader from "@/components/GameHeader";
import ConversationPanel from "@/components/ConversationPanel";
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
    <div className="min-h-screen bg-black flex items-center justify-center font-mono">
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
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>("easy");
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | undefined>(
    hasTimer ? 30 : undefined
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

  // Fetch initial round
  const fetchRound = useCallback(
    async (roundNumber: number, usedIds: string[]) => {
      try {
        const params = new URLSearchParams({
          round: roundNumber.toString(),
          mode,
          usedIds: usedIds.join(","),
        });

        const res = await fetch(`/api/round?${params}`);
        if (!res.ok) throw new Error("Failed to fetch round");

        const data = await res.json();
        return data as {
          situationA: ConversationSituation;
          situationB: ConversationSituation;
          difficulty: Difficulty;
        };
      } catch (error) {
        console.error("Error fetching round:", error);
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
          round: "1", // doesn't matter, we just need one situation
          mode,
          usedIds: usedIds.join(","),
          single: "true",
        });

        const res = await fetch(`/api/round?${params}`);
        if (!res.ok) return null;

        const data = await res.json();
        // Return situationA from the pair
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
      const roundData = await fetchRound(1, []);
      if (!roundData) {
        router.push("/");
        return;
      }

      setCurrentDifficulty(roundData.difficulty);
      
      // For extreme mode, fetch a third situation
      let situationC: ConversationSituation | null = null;
      const usedIds = [roundData.situationA.id, roundData.situationB.id];
      
      if (isExtremeMode) {
        situationC = await fetchSingleSituation(usedIds);
        if (situationC) {
          usedIds.push(situationC.id);
        }
      }
      
      setGameState({
        mode,
        round: 1,
        score: 0,
        conversationA: createConversation(roundData.situationA),
        conversationB: createConversation(roundData.situationB),
        conversationC: situationC ? createConversation(situationC) : undefined,
        hintsRemaining: 3,
        usedSituationIds: usedIds,
        isGameOver: false,
        completedConversations: 0,
      });
      setPhase("playing");
      if (hasTimer) setTimeRemaining(30);
    };

    initGame();
  }, [fetchRound, fetchSingleSituation, mode, router, hasTimer, isExtremeMode]);

  // Handle reply submission
  const handleSubmitReply = useCallback(
    async (reply: string) => {
      if (!gameState || phase !== "playing" || isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      // Clear any completion status from previous round and ending flags (player chose to continue by replying)
      setCompletedThisRound({ A: false, B: false, C: isExtremeMode ? false : undefined });
      setEndingConversations({ A: false, B: false, C: isExtremeMode ? false : undefined });
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

        // Update game state with new confusion levels and reply
        setGameState((prev) => {
          if (!prev) return prev;

          const newA = {
            ...prev.conversationA,
            confusion: result.newConfusionA,
            transcript: [
              ...prev.conversationA.transcript,
              { role: "player" as const, text: reply },
            ],
          };

          const newB = {
            ...prev.conversationB,
            confusion: result.newConfusionB,
            transcript: [
              ...prev.conversationB.transcript,
              { role: "player" as const, text: reply },
            ],
          };

          const newC = prev.conversationC && result.newConfusionC !== undefined
            ? {
                ...prev.conversationC,
                confusion: result.newConfusionC,
                transcript: [
                  ...prev.conversationC.transcript,
                  { role: "player" as const, text: reply },
                ],
              }
            : prev.conversationC;

          return {
            ...prev,
            conversationA: newA,
            conversationB: newB,
            conversationC: newC,
            score: prev.score + result.scoreGained,
            isGameOver: result.gameOver,
            gameOverReason: result.gameOverReason,
          };
        });

        if (result.gameOver) {
          const finalScore = gameState.score + result.scoreGained;
          updateHighScore(mode, finalScore, gameState.round);
          setPhase("gameover");
        } else {
          // Fetch continuations to detect if conversations are ending
          // We need to create updated conversations with the player's reply
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
        }
      } catch (error) {
        console.error("Error judging reply:", error);
        // Extract error message for user display
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const isRateLimited = errorMessage.toLowerCase().includes("rate limit");
        
        // On error, show feedback with neutral result and the actual error
        const neutralScore = {
          coherence: 5,
          relevance: 5,
          tone_match: 5,
          directness: 5,
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
  const handleContinue = async () => {
    if (!gameState || !pendingContinuations) return;

    setPhase("loading");
    setShowHint(false);
    setCompletedThisRound({ A: false, B: false, C: isExtremeMode ? false : undefined });

    const nextRound = gameState.round + 1;

    // Check if daily mode is complete (5 rounds)
    if (mode === "daily" && nextRound > 5) {
      updateHighScore(mode, gameState.score, gameState.round);
      setGameState((prev) =>
        prev ? { ...prev, isGameOver: true, gameOverReason: undefined } : prev
      );
      setPhase("gameover");
      return;
    }

    const continuations = pendingContinuations;

    // Always fetch round data to update difficulty
    const roundData = await fetchRound(nextRound, gameState.usedSituationIds);

    if (!roundData) {
      // If can't fetch new round, end game
      setGameState((prev) =>
        prev ? { ...prev, isGameOver: true } : prev
      );
      setPhase("gameover");
      return;
    }

    setCurrentDifficulty(roundData.difficulty);
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

      return {
        ...prev,
        round: nextRound,
        conversationA: newConvA,
        conversationB: newConvB,
        conversationC: newConvC,
      };
    });

    // Store ending flags for display in playing phase
    setEndingConversations({
      A: pendingContinuations.endingA,
      B: pendingContinuations.endingB,
      C: isExtremeMode ? pendingContinuations.endingC : undefined,
    });

    // Clear pending continuations
    setPendingContinuations(null);
    
    if (hasTimer) setTimeRemaining(Math.max(20, 35 - nextRound * 2));
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

  // Handle hint
  const handleHint = () => {
    if (!gameState || gameState.hintsRemaining <= 0) return;

    setShowHint(true);
    setGameState((prev) =>
      prev ? { ...prev, hintsRemaining: prev.hintsRemaining - 1 } : prev
    );
  };

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
      <div className="min-h-screen bg-black flex items-center justify-center font-mono">
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
    <div className="min-h-screen bg-black flex flex-col">
      <GameHeader
        round={gameState.round}
        score={gameState.score}
        mode={mode}
        difficulty={currentDifficulty}
        hintsRemaining={gameState.hintsRemaining}
        onHint={handleHint}
        onQuit={handleQuit}
      />

      <main className="flex-1 flex flex-col p-4 max-w-7xl mx-auto w-full">
        {/* Conversations */}
        <div className={`flex-1 grid grid-cols-1 gap-4 mb-4 ${
          isExtremeMode 
            ? "lg:grid-cols-3" 
            : "lg:grid-cols-2"
        }`}>
          <ConversationPanel
            conversation={gameState.conversationA}
            label="A"
            delta={lastResult?.confusionDelta.A}
            showDelta={phase === "feedback"}
            showIntent={showHint}
            isEnding={phase === "playing" && endingConversations.A}
            onStartNew={() => handleStartNewConversation("A")}
          />
          <ConversationPanel
            conversation={gameState.conversationB}
            label="B"
            delta={lastResult?.confusionDelta.B}
            showDelta={phase === "feedback"}
            showIntent={showHint}
            isEnding={phase === "playing" && endingConversations.B}
            onStartNew={() => handleStartNewConversation("B")}
          />
          {isExtremeMode && gameState.conversationC && (
            <ConversationPanel
              conversation={gameState.conversationC}
              label="C"
              delta={lastResult?.confusionDelta.C}
              showDelta={phase === "feedback"}
              showIntent={showHint}
              isEnding={phase === "playing" && endingConversations.C}
              onStartNew={() => handleStartNewConversation("C")}
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}
