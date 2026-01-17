"use client";

import { motion } from "framer-motion";
import { JudgeScores } from "@/lib/types";

interface ConversationFeedbackProps {
  label: "A" | "B" | "C";
  scores: JudgeScores;
  delta: number;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const filled = Math.round((value / 10) * 10);
  const empty = 10 - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);

  return (
    <div className="flex items-center gap-2 font-mono">
      <span className="text-xs text-gray-500 w-16">{label}</span>
      <span className="text-gray-400 text-xs">[{bar}]</span>
      <span className="text-xs text-gray-300 w-4 text-right">{value}</span>
    </div>
  );
}

export default function ConversationFeedback({
  label,
  scores,
  delta,
}: ConversationFeedbackProps) {
  const overallGood =
    scores.coherence >= 6 && scores.relevance >= 6 && !scores.contradiction;
  const statusSymbol = scores.unsafe
    ? "[!]"
    : scores.contradiction
    ? "[X]"
    : overallGood
    ? "[OK]"
    : "[?]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: label === "A" ? 0.1 : label === "B" ? 0.2 : 0.3 }}
      className="bg-gray-950 border border-gray-700 border-t-0 p-3 font-mono"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{statusSymbol}</span>
          <span className="text-xs font-medium text-gray-400">FEEDBACK</span>
        </div>
        <span
          className={`text-xs font-bold ${
            delta > 0 ? "text-white" : delta < 0 ? "text-gray-500" : "text-gray-600"
          }`}
        >
          {delta > 0 ? `+${delta}` : delta === 0 ? "±0" : delta} confusion
        </span>
      </div>

      {/* Score bars */}
      <div className="space-y-1">
        <ScoreBar label="Coherence" value={scores.coherence} />
        <ScoreBar label="Relevance" value={scores.relevance} />
        <ScoreBar label="Tone" value={scores.tone_match} />
        <ScoreBar label="Direct" value={scores.directness} />
      </div>

      {/* Flags */}
      {(scores.contradiction || scores.unsafe) && (
        <div className="flex gap-2 mt-2">
          {scores.contradiction && (
            <span className="px-1.5 py-0.5 text-xs border border-gray-600 text-gray-400">
              [CONTRADICTION]
            </span>
          )}
          {scores.unsafe && (
            <span className="px-1.5 py-0.5 text-xs border border-gray-600 text-gray-400">
              [UNSAFE]
            </span>
          )}
        </div>
      )}

      {/* Notes */}
      {scores.notes.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-800">
          {scores.notes.map((note, i) => (
            <p key={i} className="text-xs text-gray-600 italic">
              &gt; {note}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  );
}
