"use client";

import { motion } from "framer-motion";
import { GameMode, Difficulty } from "@/lib/types";
import { formatScore } from "@/lib/scoring";

interface GameHeaderProps {
  round: number;
  score: number;
  mode: GameMode;
  difficulty: Difficulty;
  onQuit?: () => void;
}

const modeLabels: Record<GameMode, string> = {
  classic: "CLASSIC",
  timer: "TIMER",
  daily: "DAILY",
  extreme: "EXTREME",
};

const difficultyLabels: Record<Difficulty, string> = {
  easy: "[E]",
  medium: "[M]",
  hard: "[H]",
};

export default function GameHeader({
  round,
  score,
  mode,
  difficulty,
  onQuit,
}: GameHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full px-4 py-3 bg-black border-b border-gray-700 font-mono"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left: Game title and mode */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-white">
            1Reply
          </h1>
          <span className="px-2 py-0.5 text-xs font-medium border border-gray-600 text-gray-400">
            {modeLabels[mode]}
          </span>
        </div>

        {/* Center: Round and difficulty */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-xs text-gray-600 uppercase tracking-wider">Round</div>
            <motion.div
              key={round}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-xl font-bold text-white"
            >
              {round}
            </motion.div>
          </div>

          <div className="text-center">
            <div className="text-xs text-gray-600 uppercase tracking-wider">Diff</div>
            <div className="text-sm font-medium text-white">
              {difficultyLabels[difficulty]}
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs text-gray-600 uppercase tracking-wider">Score</div>
            <motion.div
              key={score}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-xl font-bold text-white"
            >
              {formatScore(score)}
            </motion.div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {onQuit && (
            <button
              onClick={onQuit}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-white transition-colors"
            >
              [Quit]
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
