"use client";

import { motion } from "framer-motion";
import { GameMode } from "@/lib/types";
import { formatScore } from "@/lib/scoring";

interface GameOverModalProps {
  score: number;
  rounds: number;
  mode: GameMode;
  reason?: "A" | "B" | "C" | "survived";
  highScore?: number;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export default function GameOverModal({
  score,
  rounds,
  mode,
  reason,
  highScore,
  onPlayAgain,
  onMainMenu,
}: GameOverModalProps) {
  const isNewHighScore = highScore !== undefined && score > highScore;

  const handleShare = () => {
    const text = `1Reply ${mode === "daily" ? "Daily" : ""}\n\nScore: ${formatScore(score)}\nRounds: ${rounds}\n\nCan you do better? Play at ${window.location.origin}`;

    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      alert("Results copied to clipboard!");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 font-mono"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="w-full max-w-md bg-black border border-gray-600 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700 text-center">
          <motion.pre
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="text-white text-xs mb-4 leading-tight"
          >
{reason === "survived" ? `
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
          {reason === "survived" ? (
            <p className="text-sm text-gray-500">
              You made it through all 30 rounds!
            </p>
          ) : reason && (
            <p className="text-sm text-gray-500">
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
                Final Score
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
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPlayAgain}
            className="w-full py-3 border border-white text-white font-semibold hover:bg-white hover:text-black transition-all"
          >
            [ PLAY AGAIN ]
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
        </div>
      </motion.div>
    </motion.div>
  );
}
