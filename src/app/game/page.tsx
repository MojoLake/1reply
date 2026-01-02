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
import JudgeFeedback, { ConversationChoice } from "@/components/JudgeFeedback";
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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full"
      />
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
  }>({ A: false, B: false });
  const [pendingContinuations, setPendingContinuations] = useState<ContinuationResponse | null>(null);

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

  // Initialize game
  useEffect(() => {
    const initGame = async () => {
      const roundData = await fetchRound(1, []);
      if (!roundData) {
        router.push("/");
        return;
      }

      setCurrentDifficulty(roundData.difficulty);
      setGameState({
        mode,
        round: 1,
        score: 0,
        conversationA: createConversation(roundData.situationA),
        conversationB: createConversation(roundData.situationB),
        hintsRemaining: 3,
        usedSituationIds: [roundData.situationA.id, roundData.situationB.id],
        isGameOver: false,
        completedConversations: 0,
      });
      setPhase("playing");
      if (hasTimer) setTimeRemaining(30);
    };

    initGame();
  }, [fetchRound, mode, router, hasTimer]);

  // Handle reply submission
  const handleSubmitReply = useCallback(
    async (reply: string) => {
      if (!gameState || phase !== "playing" || isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      // Clear any completion status from previous round
      setCompletedThisRound({ A: false, B: false });
      setPhase("judging");

      try {
        const res = await fetch("/api/judge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationA: gameState.conversationA,
            conversationB: gameState.conversationB,
            playerReply: reply,
            currentConfusionA: gameState.conversationA.confusion,
            currentConfusionB: gameState.conversationB.confusion,
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

          return {
            ...prev,
            conversationA: newA,
            conversationB: newB,
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
          const continuations = await fetchContinuations(updatedConvA, updatedConvB);
          setPendingContinuations(continuations);
          setPhase("feedback");
        }
      } catch (error) {
        console.error("Error judging reply:", error);
        // On error, show feedback with neutral result
        setLastResult({
          evaluation: {
            A: {
              coherence: 5,
              relevance: 5,
              tone_match: 5,
              directness: 5,
              contradiction: false,
              unsafe: false,
              notes: ["Evaluation error - neutral score applied"],
            },
            B: {
              coherence: 5,
              relevance: 5,
              tone_match: 5,
              directness: 5,
              contradiction: false,
              unsafe: false,
              notes: ["Evaluation error - neutral score applied"],
            },
          },
          confusionDelta: { A: 0, B: 0 },
          scoreGained: 0,
          newConfusionA: gameState.conversationA.confusion,
          newConfusionB: gameState.conversationB.confusion,
          gameOver: false,
        });
        setPhase("feedback");
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [gameState, phase, mode]
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

  // Fetch a single new situation for conversation swapping
  const fetchSingleSituation = useCallback(
    async (usedIds: string[], difficulty: Difficulty): Promise<ConversationSituation | null> => {
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
    async (convA: Conversation, convB: Conversation): Promise<ContinuationResponse> => {
      try {
        const res = await fetch("/api/continue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationA: convA,
            conversationB: convB,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to fetch continuations");
        }

        const data: ContinuationResponse = await res.json();
        return data;
      } catch (error) {
        console.error("Error fetching continuations:", error);
        // Fallback to simple responses
        return {
          responseA: "Okay",
          responseB: "Okay",
          endingA: false,
          endingB: false,
        };
      }
    },
    []
  );

  // Handle continue to next round with user choices for ending conversations
  const handleContinue = async (choices: { A: ConversationChoice; B: ConversationChoice }) => {
    if (!gameState || !pendingContinuations) return;

    setPhase("loading");
    setShowHint(false);
    setCompletedThisRound({ A: false, B: false });

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
    
    // User chose to start new conversations - only award bonus if they chose "new"
    const shouldSwapA = pendingContinuations.endingA && choices.A === "new";
    const shouldSwapB = pendingContinuations.endingB && choices.B === "new";

    // Calculate completion bonus based on user choices
    let completionBonus = 0;
    let newCompletions = 0;
    if (shouldSwapA) {
      completionBonus += CONVERSATION_COMPLETION_BONUS;
      newCompletions++;
    }
    if (shouldSwapB) {
      completionBonus += CONVERSATION_COMPLETION_BONUS;
      newCompletions++;
    }

    // Track which conversations completed for UI feedback
    setCompletedThisRound({
      A: shouldSwapA,
      B: shouldSwapB,
    });

    // Fetch new situations for conversations that user chose to swap
    let newSituationA: ConversationSituation | null = null;
    let newSituationB: ConversationSituation | null = null;

    if (shouldSwapA || shouldSwapB) {
      const fetchPromises: Promise<ConversationSituation | null>[] = [];
      
      if (shouldSwapA) {
        fetchPromises.push(
          fetchSingleSituation(gameState.usedSituationIds, currentDifficulty)
        );
      }
      if (shouldSwapB) {
        fetchPromises.push(
          fetchSingleSituation(
            [
              ...gameState.usedSituationIds,
              ...(shouldSwapA ? [] : []), // Will add A's new ID if fetched
            ],
            currentDifficulty
          )
        );
      }

      const newSituations = await Promise.all(fetchPromises);
      
      if (shouldSwapA) {
        newSituationA = newSituations[0];
      }
      if (shouldSwapB) {
        newSituationB = shouldSwapA ? newSituations[1] : newSituations[0];
      }
    }

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

      // Build new conversation A
      let newConvA: Conversation;
      if (newSituationA) {
        // Swap to new conversation
        newConvA = createConversation(newSituationA);
      } else {
        // Continue existing conversation with the LLM response
        newConvA = {
          ...prev.conversationA,
          transcript: [
            ...prev.conversationA.transcript,
            { role: "them" as const, text: continuations.responseA },
          ],
        };
      }

      // Build new conversation B
      let newConvB: Conversation;
      if (newSituationB) {
        // Swap to new conversation
        newConvB = createConversation(newSituationB);
      } else {
        // Continue existing conversation with the LLM response
        newConvB = {
          ...prev.conversationB,
          transcript: [
            ...prev.conversationB.transcript,
            { role: "them" as const, text: continuations.responseB },
          ],
        };
      }

      // Collect new situation IDs
      const newUsedIds = [...prev.usedSituationIds];
      if (newSituationA) newUsedIds.push(newSituationA.id);
      if (newSituationB) newUsedIds.push(newSituationB.id);

      return {
        ...prev,
        round: nextRound,
        score: prev.score + completionBonus,
        conversationA: newConvA,
        conversationB: newConvB,
        usedSituationIds: newUsedIds,
        completedConversations: prev.completedConversations + newCompletions,
      };
    });

    // Clear pending continuations
    setPendingContinuations(null);
    
    if (hasTimer) setTimeRemaining(Math.max(20, 35 - nextRound * 2));
    setPhase("playing");
  };

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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
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
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <ConversationPanel
            conversation={gameState.conversationA}
            label="A"
            delta={lastResult?.confusionDelta.A}
            showDelta={phase === "feedback"}
            showIntent={showHint}
          />
          <ConversationPanel
            conversation={gameState.conversationB}
            label="B"
            delta={lastResult?.confusionDelta.B}
            showDelta={phase === "feedback"}
            showIntent={showHint}
          />
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
              className="flex flex-col items-center justify-center py-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full mb-4"
              />
              <p className="text-zinc-400">Evaluating your reply...</p>
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
                endingConversations={{
                  A: pendingContinuations.endingA,
                  B: pendingContinuations.endingB,
                }}
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
