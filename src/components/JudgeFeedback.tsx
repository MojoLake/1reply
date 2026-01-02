"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { JudgeResult, ConfusionDelta } from "@/lib/types";

interface JudgeFeedbackProps {
  result: JudgeResult;
  confusionDelta: ConfusionDelta;
  scoreGained: number;
  onContinue: () => void;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const percentage = (value / 10) * 100;
  const color =
    value >= 7
      ? "bg-emerald-500"
      : value >= 5
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-400 w-20">{label}</span>
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full ${color}`}
        />
      </div>
      <span className="text-xs font-mono text-zinc-300 w-6 text-right">{value}</span>
    </div>
  );
}

function ConversationScores({
  label,
  scores,
  delta,
}: {
  label: "A" | "B";
  scores: JudgeResult["A"];
  delta: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const overallGood = scores.coherence >= 6 && scores.relevance >= 6 && !scores.contradiction;
  const statusEmoji = scores.unsafe
    ? "🚫"
    : scores.contradiction
    ? "❌"
    : overallGood
    ? "✅"
    : "⚠️";

  return (
    <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{statusEmoji}</span>
          <span className="font-medium text-zinc-200">Conversation {label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-mono font-bold ${
              delta > 0 ? "text-red-400" : delta < 0 ? "text-emerald-400" : "text-zinc-400"
            }`}
          >
            {delta > 0 ? `+${delta}` : delta === 0 ? "±0" : delta} confusion
          </span>
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            className="text-zinc-500"
          >
            ▼
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
              <ScoreBar label="Tone Match" value={scores.tone_match} />
              <ScoreBar label="Directness" value={scores.directness} />

              {(scores.contradiction || scores.unsafe) && (
                <div className="flex gap-2 pt-2">
                  {scores.contradiction && (
                    <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                      Contradiction
                    </span>
                  )}
                  {scores.unsafe && (
                    <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                      Unsafe
                    </span>
                  )}
                </div>
              )}

              {scores.notes.length > 0 && (
                <div className="pt-2 border-t border-zinc-800">
                  {scores.notes.map((note, i) => (
                    <p key={i} className="text-xs text-zinc-500 italic">
                      {note}
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
}: JudgeFeedbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto p-6 bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-zinc-700"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Round Complete!</h2>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="inline-block px-4 py-2 bg-indigo-500/20 rounded-lg"
        >
          <span className="text-indigo-400 font-mono font-bold">+{scoreGained}</span>
          <span className="text-zinc-400 ml-2">points</span>
        </motion.div>
      </div>

      <div className="space-y-3 mb-6">
        <ConversationScores label="A" scores={result.A} delta={confusionDelta.A} />
        <ConversationScores label="B" scores={result.B} delta={confusionDelta.B} />
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onContinue}
        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25"
      >
        Continue to Next Round
      </motion.button>
    </motion.div>
  );
}

