"use client";

import { motion } from "framer-motion";
import { GameMode, Difficulty } from "@/lib/types";
import { formatScore } from "@/lib/scoring";

interface GameHeaderProps {
  round: number;
  score: number;
  mode: GameMode;
  difficulty: Difficulty;
  hintsRemaining?: number;
  onHint?: () => void;
  onQuit?: () => void;
}

const modeLabels: Record<GameMode, string> = {
  classic: "Classic",
  timer: "Timer",
  daily: "Daily",
  endless: "Endless",
};

const difficultyColors: Record<Difficulty, string> = {
  easy: "text-emerald-400",
  medium: "text-amber-400",
  hard: "text-red-400",
};

export default function GameHeader({
  round,
  score,
  mode,
  difficulty,
  hintsRemaining = 0,
  onHint,
  onQuit,
}: GameHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full px-4 py-3 bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left: Game title and mode */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            1Reply
          </h1>
          <span className="px-2 py-0.5 text-xs font-medium bg-zinc-800 text-zinc-400 rounded">
            {modeLabels[mode]}
          </span>
        </div>

        {/* Center: Round and difficulty */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Round</div>
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
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Difficulty</div>
            <div className={`text-sm font-medium capitalize ${difficultyColors[difficulty]}`}>
              {difficulty}
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Score</div>
            <motion.div
              key={score}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-xl font-bold text-white font-mono"
            >
              {formatScore(score)}
            </motion.div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {onHint && hintsRemaining > 0 && (
            <button
              onClick={onHint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
            >
              <span>💡</span>
              <span className="font-medium">Hint</span>
              <span className="text-xs opacity-70">({hintsRemaining})</span>
            </button>
          )}

          {onQuit && (
            <button
              onClick={onQuit}
              className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Quit
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
}

