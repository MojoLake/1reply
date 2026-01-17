"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameMode } from "@/lib/types";
import { formatScore } from "@/lib/scoring";

interface GameOverModalProps {
  score: number;
  rounds: number;
  mode: GameMode;
  reason?: "A" | "B" | "C" | "survived" | "initial_survived";
  highScore?: number;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  onContinue?: () => void; // For initial_survived - continue playing to max rounds
  startMinimized?: boolean;
  customTitle?: string;
}

export default function GameOverModal({
  score,
  rounds,
  mode,
  reason,
  highScore,
  onPlayAgain,
  onMainMenu,
  onContinue,
  startMinimized = false,
  customTitle,
}: GameOverModalProps) {
  const [isMinimized, setIsMinimized] = useState(startMinimized);
  const isNewHighScore = highScore !== undefined && score > highScore;
  const isInitialSurvival = reason === "initial_survived";
  const isFinalSurvival = reason === "survived";
  const isLoss = reason === "A" || reason === "B" || reason === "C";

  const handleShare = () => {
    const gameName = customTitle ? `1Reply: ${customTitle}` : `1Reply ${mode === "daily" ? "Daily" : ""}`;
    const shareUrl = customTitle ? window.location.href : window.location.origin;
    const text = `${gameName}\n\nScore: ${formatScore(score)}\nRounds: ${rounds}\n\nCan you do better? Play at ${shareUrl}`;

    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      alert("Results copied to clipboard!");
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isMinimized ? (
        // Minimized review mode - compact bar at bottom
        <motion.div
          key="minimized"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 font-mono"
        >
          <div className={`max-w-4xl mx-auto bg-black border ${isLoss ? "border-red-600" : "border-gray-600"}`}>
            <div className="flex items-center justify-between p-3 gap-4">
              <div className="flex items-center gap-4 text-sm">
                <span className={isLoss ? "text-red-500" : "text-gray-500"}>
                  {isInitialSurvival ? "CHECKPOINT!" : isFinalSurvival ? "SURVIVED!" : "GAME OVER"}
                </span>
                <span className="text-white font-bold">
                  Score: {formatScore(score)}
                </span>
                <span className="text-gray-500">
                  Rounds: {rounds}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isInitialSurvival && onContinue ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onContinue}
                    className="px-3 py-1.5 text-sm border border-white text-white hover:bg-white hover:text-black transition-all"
                  >
                    CONTINUE
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onPlayAgain}
                    className="px-3 py-1.5 text-sm border border-white text-white hover:bg-white hover:text-black transition-all"
                  >
                    PLAY AGAIN
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsMinimized(false)}
                  className="px-3 py-1.5 text-sm border border-gray-600 text-gray-400 hover:border-white hover:text-white transition-all"
                >
                  ▲ EXPAND
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        // Full modal
        <motion.div
          key="full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 font-mono"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className={`w-full max-w-md bg-black border overflow-hidden ${isLoss ? "border-red-600" : "border-gray-600"}`}
          >
            {/* Header */}
            <div className={`p-6 border-b text-center ${isLoss ? "border-red-900" : "border-gray-700"}`}>
              <motion.pre
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className={`text-xs mb-4 leading-tight ${isLoss ? "text-red-500" : "text-white"}`}
              >
{isInitialSurvival ? `
  +-----------------+
  |   CHECKPOINT!   |
  |      \\o/        |
  +-----------------+
` : isFinalSurvival ? `
  +-----------------+
  |    SURVIVED!    |
  |      :D         |
  +-----------------+
` : reason ? `
  +-----------------+
  |   GAME  OVER    |
  |      >:(        |
  +-----------------+
` : `
  +-----------------+
  |   GAME  OVER    |
  |      X_X        |
  +-----------------+
`}
              </motion.pre>
              {isInitialSurvival ? (
                <p className="text-sm text-gray-500">
                  You survived {rounds} rounds! Keep going?
                </p>
              ) : isFinalSurvival ? (
                <p className="text-sm text-gray-500">
                  You made it through all 30 rounds!
                </p>
              ) : reason && (
                <p className="text-sm text-red-400">
                  Conversation [{reason}] became too confused
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="p-6 space-y-4">
              {isNewHighScore && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.3 }}
                  className="text-center p-3 border border-gray-500"
                >
                  <span className="text-white font-bold">[!!!] NEW HIGH SCORE [!!!]</span>
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-700 p-4 text-center">
                  <div className="text-xs text-gray-600 uppercase tracking-wider mb-1">
                    {isInitialSurvival ? "Current Score" : "Final Score"}
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.4 }}
                    className="text-2xl font-bold text-white"
                  >
                    {formatScore(score)}
                  </motion.div>
                </div>

                <div className="border border-gray-700 p-4 text-center">
                  <div className="text-xs text-gray-600 uppercase tracking-wider mb-1">
                    Rounds
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.5 }}
                    className="text-2xl font-bold text-white"
                  >
                    {rounds}
                  </motion.div>
                </div>
              </div>

              {highScore !== undefined && !isNewHighScore && (
                <div className="text-center text-sm text-gray-600">
                  High Score: {formatScore(highScore)}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 space-y-3">
              {isInitialSurvival && onContinue ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onContinue}
                    className="w-full py-3 border border-white text-white font-semibold hover:bg-white hover:text-black transition-all"
                  >
                    [ CONTINUE PLAYING ]
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsMinimized(true)}
                    className="w-full py-3 border border-gray-500 text-gray-300 font-medium hover:border-white hover:text-white transition-all"
                  >
                    [ REVIEW CHAT ]
                  </motion.button>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleShare}
                      className="flex-1 py-3 border border-gray-600 text-gray-400 font-medium hover:border-white hover:text-white transition-all"
                    >
                      [ SHARE ]
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onMainMenu}
                      className="flex-1 py-3 border border-gray-600 text-gray-500 font-medium hover:border-white hover:text-white transition-all"
                    >
                      [ END GAME ]
                    </motion.button>
                  </div>
                </>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onPlayAgain}
                    className="w-full py-3 border border-white text-white font-semibold hover:bg-white hover:text-black transition-all"
                  >
                    [ PLAY AGAIN ]
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsMinimized(true)}
                    className="w-full py-3 border border-gray-500 text-gray-300 font-medium hover:border-white hover:text-white transition-all"
                  >
                    [ REVIEW CHAT ]
                  </motion.button>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleShare}
                      className="flex-1 py-3 border border-gray-600 text-gray-400 font-medium hover:border-white hover:text-white transition-all"
                    >
                      [ SHARE ]
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onMainMenu}
                      className="flex-1 py-3 border border-gray-600 text-gray-500 font-medium hover:border-white hover:text-white transition-all"
                    >
                      [ MENU ]
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
