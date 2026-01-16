"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  GameState,
  Conversation,
  ConversationSituation,
  RoundResult,
  ContinuationResponse,
} from "@/lib/types";
import {
  MAX_ROUNDS,
  INITIAL_SURVIVAL_ROUNDS,
  NEUTRAL_SCORE,
} from "@/lib/constants";
import { saveScore } from "@/lib/useAuth";
import GameHeader from "@/components/GameHeader";
import ConversationPanel from "@/components/ConversationPanel";
import MobileConversationTabs from "@/components/MobileConversationTabs";
import ReplyInput from "@/components/ReplyInput";
import JudgeFeedback from "@/components/JudgeFeedback";
import GameOverModal from "@/components/GameOverModal";
import { AuthButton } from "@/components/AuthButton";

type GamePhase = "loading" | "error" | "ready" | "playing" | "judging" | "feedback" | "gameover";

interface ScenarioData {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  situation_a: ConversationSituation;
  situation_b: ConversationSituation;
  situation_c?: ConversationSituation;
  play_count: number;
}

function createConversation(situation: ConversationSituation): Conversation {
  return {
    situation,
    transcript: [...situation.initialTranscript],
    confusion: 0,
  };
}

export default function PlayScenarioPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();

  const [phase, setPhase] = useState<GamePhase>("loading");
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [pendingContinuations, setPendingContinuations] = useState<ContinuationResponse | null>(null);
  const [gameOverStartMinimized, setGameOverStartMinimized] = useState(false);
  const [initialSurvivalAchieved, setInitialSurvivalAchieved] = useState(false);
  
  const isExtremeMode = scenario?.situation_c != null;
  const isSubmittingRef = useRef(false);
  const submitRef = useRef<((reply: string) => Promise<void>) | null>(null);

  // Fetch scenario data
  useEffect(() => {
    const fetchScenario = async () => {
      try {
        const res = await fetch(`/api/scenarios?code=${code}`);
        if (!res.ok) {
          if (res.status === 404) {
            setErrorMessage("Scenario not found");
          } else {
            setErrorMessage("Failed to load scenario");
          }
          setPhase("error");
          return;
        }

        const data = await res.json();
        setScenario(data);
        setPhase("ready");
      } catch {
        setErrorMessage("Failed to load scenario");
        setPhase("error");
      }
    };

    fetchScenario();
  }, [code]);

  // Start the game
  const startGame = useCallback(() => {
    if (!scenario) return;

    const situationA = scenario.situation_a;
    const situationB = scenario.situation_b;
    const situationC = scenario.situation_c;

    const usedIds = [situationA.id, situationB.id];
    if (situationC) usedIds.push(situationC.id);

    setGameState({
      mode: "classic", // Custom scenarios use classic mode
      round: 1,
      score: 0,
      conversationA: createConversation(situationA),
      conversationB: createConversation(situationB),
      conversationC: situationC ? createConversation(situationC) : undefined,
      usedSituationIds: usedIds,
      usedPairIds: [scenario.id],
      isGameOver: false,
      completedConversations: 0,
    });
    setPhase("playing");
  }, [scenario]);

  // Fetch conversation continuations
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

  // Handle reply submission
  const handleSubmitReply = useCallback(
    async (reply: string) => {
      if (!gameState || phase !== "playing" || isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      // Add player's reply to transcripts
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

        // Update confusion levels
        setGameState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            conversationA: { ...prev.conversationA, confusion: result.newConfusionA },
            conversationB: { ...prev.conversationB, confusion: result.newConfusionB },
            conversationC: prev.conversationC && result.newConfusionC !== undefined
              ? { ...prev.conversationC, confusion: result.newConfusionC }
              : prev.conversationC,
            score: prev.score + result.scoreGained,
            isGameOver: result.gameOver,
            gameOverReason: result.gameOverReason,
          };
        });

        // Save score on game over
        if (result.gameOver) {
          const finalScore = gameState.score + result.scoreGained;
          saveScore("custom", finalScore, gameState.round, scenario?.id);
        }

        // Fetch continuations
        const updatedConvA = {
          ...gameState.conversationA,
          confusion: result.newConfusionA,
          transcript: [...gameState.conversationA.transcript, { role: "player" as const, text: reply }],
        };
        const updatedConvB = {
          ...gameState.conversationB,
          confusion: result.newConfusionB,
          transcript: [...gameState.conversationB.transcript, { role: "player" as const, text: reply }],
        };
        const updatedConvC = gameState.conversationC && result.newConfusionC !== undefined
          ? {
              ...gameState.conversationC,
              confusion: result.newConfusionC,
              transcript: [...gameState.conversationC.transcript, { role: "player" as const, text: reply }],
            }
          : undefined;

        const continuations = await fetchContinuations(updatedConvA, updatedConvB, updatedConvC);
        setPendingContinuations(continuations);
        setPhase("feedback");
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
    [gameState, phase, isExtremeMode, fetchContinuations]
  );

  useEffect(() => {
    submitRef.current = handleSubmitReply;
  }, [handleSubmitReply]);

  // Handle continue to next round
  const handleContinue = () => {
    if (!gameState || !pendingContinuations) return;

    const continuations = pendingContinuations;
    const nextRound = gameState.round + 1;

    // Determine what happens after this round BEFORE updating state
    const isAtInitialCheckpoint = nextRound > INITIAL_SURVIVAL_ROUNDS && !initialSurvivalAchieved;
    const isAtFinalSurvival = nextRound > MAX_ROUNDS;

    setGameState((prev) => {
      if (!prev) return prev;

      const newConvA: Conversation = {
        ...prev.conversationA,
        transcript: [...prev.conversationA.transcript, { role: "them" as const, text: continuations.responseA }],
      };

      const newConvB: Conversation = {
        ...prev.conversationB,
        transcript: [...prev.conversationB.transcript, { role: "them" as const, text: continuations.responseB }],
      };

      let newConvC: Conversation | undefined = prev.conversationC;
      if (isExtremeMode && prev.conversationC && continuations.responseC) {
        newConvC = {
          ...prev.conversationC,
          transcript: [...prev.conversationC.transcript, { role: "them" as const, text: continuations.responseC }],
        };
      }

      // Handle checkpoint/survival states
      if (isAtInitialCheckpoint) {
        return {
          ...prev,
          conversationA: newConvA,
          conversationB: newConvB,
          conversationC: newConvC,
          isGameOver: true,
          gameOverReason: "initial_survived",
        };
      }

      if (isAtFinalSurvival) {
        return {
          ...prev,
          conversationA: newConvA,
          conversationB: newConvB,
          conversationC: newConvC,
          isGameOver: true,
          gameOverReason: "survived",
        };
      }

      // If game is over (from confusion), don't increment round
      if (prev.isGameOver) {
        return { ...prev, conversationA: newConvA, conversationB: newConvB, conversationC: newConvC };
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

    setPendingContinuations(null);

    // If game was over (from confusion), transition to gameover phase
    if (gameState.isGameOver) {
      setGameOverStartMinimized(true);
      setPhase("gameover");
      return;
    }

    // Check if initial survival threshold reached (first checkpoint)
    if (isAtInitialCheckpoint) {
      setGameOverStartMinimized(false);
      setPhase("gameover");
      return;
    }

    // Check if max replies reached - survived!
    if (isAtFinalSurvival) {
      saveScore("custom", gameState.score, gameState.round, scenario?.id);
      setGameOverStartMinimized(false);
      setPhase("gameover");
      return;
    }

    setPhase("playing");
  };

  // Handle continuing past initial survival checkpoint
  const handleContinuePastCheckpoint = () => {
    if (!gameState) return;
    
    // Mark initial survival as achieved so we don't show the checkpoint again
    setInitialSurvivalAchieved(true);
    
    // Reset game over state and continue playing
    setGameState((prev) =>
      prev ? { ...prev, isGameOver: false, gameOverReason: undefined } : prev
    );
    
    // Resume the game
    setPhase("playing");
  };

  // Handle quit
  const handleQuit = () => {
    router.push("/");
  };

  // Handle play again
  const handlePlayAgain = () => {
    window.location.reload();
  };

  // Loading state
  if (phase === "loading") {
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

  // Error state
  if (phase === "error") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="text-red-500 font-mono text-4xl mb-6">[!]</div>
          <h1 className="text-xl font-mono text-white mb-4">{errorMessage}</h1>
          <p className="text-gray-400 font-mono text-sm mb-8">
            The scenario you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-colors font-mono"
          >
            [← RETURN HOME]
          </Link>
        </motion.div>
      </div>
    );
  }

  // Ready state - show scenario info before starting
  if (phase === "ready" && scenario) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-gray-800">
          <Link href="/" className="text-white font-mono hover:text-gray-300">
            [← HOME]
          </Link>
          <AuthButton />
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-lg"
          >
            <h1 className="text-2xl font-mono text-white mb-2">{scenario.title}</h1>
            <p className="text-gray-500 font-mono text-sm mb-6">
              Custom scenario · {scenario.difficulty.toUpperCase()} difficulty
              {scenario.play_count > 0 && ` · ${scenario.play_count} plays`}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8 text-left">
              <div className="border border-gray-700 p-4">
                <div className="text-xs text-gray-500 font-mono mb-2">SITUATION A</div>
                <div className="text-white font-mono">{scenario.situation_a.personName}</div>
                <div className="text-sm text-gray-400 font-mono">
                  {scenario.situation_a.personContext}
                </div>
              </div>
              <div className="border border-gray-700 p-4">
                <div className="text-xs text-gray-500 font-mono mb-2">SITUATION B</div>
                <div className="text-white font-mono">{scenario.situation_b.personName}</div>
                <div className="text-sm text-gray-400 font-mono">
                  {scenario.situation_b.personContext}
                </div>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 bg-white text-black font-mono text-lg hover:bg-gray-200 transition-colors"
            >
              [START GAME]
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  // Game in progress
  if (!gameState) return null;

  return (
    <div className="h-dvh bg-black flex flex-col overflow-hidden">
      <GameHeader
        round={gameState.round}
        score={gameState.score}
        mode="classic"
        onQuit={handleQuit}
        customTitle={scenario?.title}
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
              },
              {
                label: "B",
                conversation: gameState.conversationB,
                delta: lastResult?.confusionDelta.B,
              },
              ...(isExtremeMode && gameState.conversationC
                ? [
                    {
                      label: "C" as const,
                      conversation: gameState.conversationC,
                      delta: lastResult?.confusionDelta.C,
                    },
                  ]
                : []),
            ]}
            showDelta={phase === "feedback"}
          />
        </div>

        {/* Desktop: Grid layout */}
        <div className={`hidden md:grid flex-1 min-h-0 max-h-[60vh] grid-cols-1 gap-4 mb-4 ${
          isExtremeMode ? "lg:grid-cols-3" : "lg:grid-cols-2"
        }`}>
          <ConversationPanel
            conversation={gameState.conversationA}
            label="A"
            delta={lastResult?.confusionDelta.A}
            showDelta={phase === "feedback"}
          />
          <ConversationPanel
            conversation={gameState.conversationB}
            label="B"
            delta={lastResult?.confusionDelta.B}
            showDelta={phase === "feedback"}
          />
          {isExtremeMode && gameState.conversationC && (
            <ConversationPanel
              conversation={gameState.conversationC}
              label="C"
              delta={lastResult?.confusionDelta.C}
              showDelta={phase === "feedback"}
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
            mode="classic"
            reason={gameState.gameOverReason}
            highScore={0}
            onPlayAgain={handlePlayAgain}
            onMainMenu={() => router.push("/")}
            onContinue={gameState.gameOverReason === "initial_survived" ? handleContinuePastCheckpoint : undefined}
            startMinimized={gameOverStartMinimized}
            customTitle={scenario?.title}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
