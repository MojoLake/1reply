"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { JudgeResult, ConfusionDelta } from "@/lib/types";
import { CONVERSATION_COMPLETION_BONUS } from "@/lib/scoring";

interface JudgeFeedbackProps {
  result: JudgeResult;
  confusionDelta: ConfusionDelta;
  scoreGained: number;
  onContinue: () => void;
  completedConversations?: { A: boolean; B: boolean; C?: boolean };
  isExtremeMode?: boolean;
  isGameOver?: boolean;
  gameOverReason?: "A" | "B" | "C";
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const filled = Math.round((value / 10) * 10);
  const empty = 10 - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);

  return (
    <div className="flex items-center gap-2 font-mono">
      <span className="text-xs text-gray-500 w-20">{label}</span>
      <span className="text-gray-400 text-sm">[{bar}]</span>
      <span className="text-xs text-gray-300 w-6 text-right">{value}</span>
    </div>
  );
}

function ConversationScores({
  label,
  scores,
  delta,
}: {
  label: "A" | "B" | "C";
  scores: JudgeResult["A"];
  delta: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const overallGood = scores.coherence >= 6 && scores.relevance >= 6 && !scores.contradiction;
  const statusSymbol = scores.unsafe
    ? "[!]"
    : scores.contradiction
    ? "[X]"
    : overallGood
    ? "[OK]"
    : "[?]";

  return (
    <div className="bg-black border border-gray-700 p-4 font-mono">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{statusSymbol}</span>
          <span className="font-medium text-white">[{label}]</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-bold ${
              delta > 0 ? "text-white" : delta < 0 ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {delta > 0 ? `+${delta}` : delta === 0 ? "±0" : delta} confusion
          </span>
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            className="text-gray-500"
          >
            v
          </motion.span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-2">
              <ScoreBar label="Coherence" value={scores.coherence} />
              <ScoreBar label="Relevance" value={scores.relevance} />
              <ScoreBar label="Tone" value={scores.tone_match} />
              <ScoreBar label="Direct" value={scores.directness} />

              {(scores.contradiction || scores.unsafe) && (
                <div className="flex gap-2 pt-2">
                  {scores.contradiction && (
                    <span className="px-2 py-0.5 text-xs border border-gray-600 text-gray-400">
                      [CONTRADICTION]
                    </span>
                  )}
                  {scores.unsafe && (
                    <span className="px-2 py-0.5 text-xs border border-gray-600 text-gray-400">
                      [UNSAFE]
                    </span>
                  )}
                </div>
              )}

              {scores.notes.length > 0 && (
                <div className="pt-2 border-t border-gray-800">
                  {scores.notes.map((note, i) => (
                    <p key={i} className="text-xs text-gray-600 italic">
                      &gt; {note}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function JudgeFeedback({
  result,
  confusionDelta,
  scoreGained,
  onContinue,
  completedConversations,
  isExtremeMode,
  isGameOver,
  gameOverReason,
}: JudgeFeedbackProps) {
  const hasCompletions =
    completedConversations?.A || completedConversations?.B || completedConversations?.C;
  const completionCount =
    (completedConversations?.A ? 1 : 0) + 
    (completedConversations?.B ? 1 : 0) + 
    (completedConversations?.C ? 1 : 0);
  const completionBonus = completionCount * CONVERSATION_COMPLETION_BONUS;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto p-6 bg-black border border-gray-600 font-mono"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-2">
          {isGameOver ? "FINAL ROUND" : "ROUND COMPLETE"}
        </h2>
        {isGameOver && gameOverReason && (
          <p className="text-sm text-gray-500 mb-2">
            Conversation [{gameOverReason}] became too confused
          </p>
        )}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="inline-block px-4 py-2 border border-gray-600"
        >
          <span className="text-white font-bold">+{scoreGained}</span>
          <span className="text-gray-500 ml-2">points</span>
        </motion.div>
      </div>

      {/* Conversation Completion Celebration (for already completed) */}
      <AnimatePresence>
        {hasCompletions && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", delay: 0.3 }}
            className="mb-6 p-4 border border-gray-500 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-lg font-bold text-white">
                [+++] COMPLETED [+++]
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-2">
              You successfully navigated{" "}
              {completionCount === 3
                ? "all three conversations"
                : completionCount === 2
                ? "two conversations"
                : completedConversations?.A
                ? "Conversation A"
                : completedConversations?.B
                ? "Conversation B"
                : "Conversation C"}{" "}
              to conclusion!
            </p>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.5 }}
              className="inline-block px-3 py-1 border border-gray-500"
            >
              <span className="text-white font-bold">
                +{completionBonus}
              </span>
              <span className="text-gray-500 ml-2 text-sm">
                completion bonus
              </span>
            </motion.div>
            <p className="text-xs text-gray-600 mt-2">
              New conversation{completionCount > 1 ? "s" : ""} start{completionCount === 1 ? "s" : ""} next round
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3 mb-6">
        <ConversationScores label="A" scores={result.A} delta={confusionDelta.A} />
        <ConversationScores label="B" scores={result.B} delta={confusionDelta.B} />
        {isExtremeMode && result.C && confusionDelta.C !== undefined && (
          <ConversationScores label="C" scores={result.C} delta={confusionDelta.C} />
        )}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onContinue}
        className="w-full py-3 font-semibold transition-all border border-white text-white hover:bg-white hover:text-black"
      >
        {isGameOver ? "[ VIEW FINAL MESSAGES ]" : "[ PROCEED ]"}
      </motion.button>
    </motion.div>
  );
}
