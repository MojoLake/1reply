"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CONVERSATION_COMPLETION_BONUS } from "@/lib/scoring";

interface FeedbackSummaryBarProps {
  scoreGained: number;
  onContinue: () => void;
  completedConversations?: { A: boolean; B: boolean; C?: boolean };
  isGameOver?: boolean;
  gameOverReason?: "A" | "B" | "C";
}

export default function FeedbackSummaryBar({
  scoreGained,
  onContinue,
  completedConversations,
  isGameOver,
  gameOverReason,
}: FeedbackSummaryBarProps) {
  const hasCompletions =
    completedConversations?.A ||
    completedConversations?.B ||
    completedConversations?.C;
  const completionCount =
    (completedConversations?.A ? 1 : 0) +
    (completedConversations?.B ? 1 : 0) +
    (completedConversations?.C ? 1 : 0);
  const completionBonus = completionCount * CONVERSATION_COMPLETION_BONUS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-black border border-gray-600 p-4 font-mono"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Score info */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Round status */}
          <div className="text-sm text-gray-400">
            {isGameOver ? "FINAL ROUND" : "ROUND COMPLETE"}
            {isGameOver && gameOverReason && (
              <span className="text-gray-600 ml-2">
                [{gameOverReason}] maxed confusion
              </span>
            )}
          </div>

          {/* Score gained */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="px-3 py-1 border border-gray-600"
          >
            <span className="text-white font-bold">+{scoreGained}</span>
            <span className="text-gray-500 ml-1">pts</span>
          </motion.div>

          {/* Completion bonus */}
          <AnimatePresence>
            {hasCompletions && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2"
              >
                <span className="text-gray-400 text-sm">[+++]</span>
                <span className="text-white font-bold">+{completionBonus}</span>
                <span className="text-gray-500 text-sm">completion</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Continue button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onContinue}
          className="px-6 py-2 font-semibold transition-all border border-white text-white hover:bg-white hover:text-black whitespace-nowrap"
        >
          {isGameOver ? "[ VIEW FINAL ]" : "[ PROCEED ]"}
        </motion.button>
      </div>
    </motion.div>
  );
}
