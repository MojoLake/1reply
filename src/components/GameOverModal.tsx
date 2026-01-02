"use client";

import { motion } from "framer-motion";
import { GameMode } from "@/lib/types";
import { formatScore } from "@/lib/scoring";

interface GameOverModalProps {
  score: number;
  rounds: number;
  mode: GameMode;
  reason?: "A" | "B";
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
    const text = `🎮 1Reply ${mode === "daily" ? "Daily" : ""}\n\n🏆 Score: ${formatScore(score)}\n📍 Rounds: ${rounds}\n\nCan you do better? Play at ${window.location.origin}`;

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-700 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-b from-red-900/30 to-transparent text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="text-6xl mb-4"
          >
            {reason ? ">:(" : "😵"}
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-1">Game Over!</h2>
          {reason && (
            <p className="text-sm text-red-400">
              Conversation {reason} became too confused
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
              className="text-center p-3 bg-amber-500/20 rounded-xl border border-amber-500/30"
            >
              <span className="text-2xl">🏆</span>
              <span className="ml-2 text-amber-400 font-bold">NEW HIGH SCORE!</span>
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                Final Score
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.4 }}
                className="text-3xl font-bold font-mono text-white"
              >
                {formatScore(score)}
              </motion.div>
            </div>

            <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                Rounds Survived
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.5 }}
                className="text-3xl font-bold font-mono text-white"
              >
                {rounds}
              </motion.div>
            </div>
          </div>

          {highScore !== undefined && !isNewHighScore && (
            <div className="text-center text-sm text-zinc-500">
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
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25"
          >
            Play Again
          </motion.button>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShare}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
            >
              📤 Share
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onMainMenu}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-medium rounded-xl transition-colors"
            >
              Main Menu
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

