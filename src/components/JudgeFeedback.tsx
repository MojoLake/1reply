"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { JudgeResult, ConfusionDelta } from "@/lib/types";
import { CONVERSATION_COMPLETION_BONUS } from "@/lib/scoring";

export type ConversationChoice = "continue" | "new";

interface JudgeFeedbackProps {
  result: JudgeResult;
  confusionDelta: ConfusionDelta;
  scoreGained: number;
  onContinue: (choices: { A: ConversationChoice; B: ConversationChoice }) => void;
  completedConversations?: { A: boolean; B: boolean };
  endingConversations: { A: boolean; B: boolean };
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

function ConversationChoiceSelector({
  label,
  choice,
  onChoose,
}: {
  label: "A" | "B";
  choice: ConversationChoice | null;
  onChoose: (choice: ConversationChoice) => void;
}) {
  return (
    <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-300">Conversation {label}</span>
        <div className="flex gap-2">
          <button
            onClick={() => onChoose("new")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
              choice === "new"
                ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-emerald-500/30 hover:text-emerald-400"
            }`}
          >
            Start New (+{CONVERSATION_COMPLETION_BONUS})
          </button>
          <button
            onClick={() => onChoose("continue")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
              choice === "continue"
                ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/50"
                : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-indigo-500/30 hover:text-indigo-400"
            }`}
          >
            Keep Going
          </button>
        </div>
      </div>
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
  completedConversations,
  endingConversations,
}: JudgeFeedbackProps) {
  const [choiceA, setChoiceA] = useState<ConversationChoice | null>(null);
  const [choiceB, setChoiceB] = useState<ConversationChoice | null>(null);
  
  const hasCompletions =
    completedConversations?.A || completedConversations?.B;
  const completionCount =
    (completedConversations?.A ? 1 : 0) + (completedConversations?.B ? 1 : 0);
  const completionBonus = completionCount * CONVERSATION_COMPLETION_BONUS;
  
  const hasAnyEnding = endingConversations.A || endingConversations.B;
  
  // Calculate potential bonus from current choices
  const potentialBonus = 
    (choiceA === "new" ? CONVERSATION_COMPLETION_BONUS : 0) +
    (choiceB === "new" ? CONVERSATION_COMPLETION_BONUS : 0);
  
  // Check if user can proceed
  const canProceed = 
    (!endingConversations.A || choiceA !== null) &&
    (!endingConversations.B || choiceB !== null);
  
  const handleProceed = () => {
    onContinue({
      A: endingConversations.A ? (choiceA || "continue") : "continue",
      B: endingConversations.B ? (choiceB || "continue") : "continue",
    });
  };

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

      {/* Conversation Ending Choice UI */}
      <AnimatePresence>
        {hasAnyEnding && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", delay: 0.3 }}
            className="mb-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-xl">💬</span>
              <span className="text-lg font-bold text-amber-400">
                Conversation{endingConversations.A && endingConversations.B ? "s" : ""} Reaching Conclusion
              </span>
            </div>
            <p className="text-sm text-zinc-300 text-center mb-4">
              {endingConversations.A && endingConversations.B
                ? "Both conversations are wrapping up naturally."
                : endingConversations.A
                ? "Conversation A is wrapping up naturally."
                : "Conversation B is wrapping up naturally."}{" "}
              Choose what to do next:
            </p>
            
            <div className="space-y-3">
              {endingConversations.A && (
                <ConversationChoiceSelector
                  label="A"
                  choice={choiceA}
                  onChoose={setChoiceA}
                />
              )}
              {endingConversations.B && (
                <ConversationChoiceSelector
                  label="B"
                  choice={choiceB}
                  onChoose={setChoiceB}
                />
              )}
            </div>
            
            {potentialBonus > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.5 }}
                className="mt-4 text-center"
              >
                <span className="inline-block px-3 py-1 bg-emerald-500/30 rounded-lg">
                  <span className="text-emerald-300 font-mono font-bold">
                    +{potentialBonus}
                  </span>
                  <span className="text-emerald-400/70 ml-2 text-sm">
                    completion bonus
                  </span>
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Previous Conversation Completion Celebration (for already completed) */}
      <AnimatePresence>
        {hasCompletions && !hasAnyEnding && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", delay: 0.3 }}
            className="mb-6 p-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">🎉</span>
              <span className="text-lg font-bold text-emerald-400">
                Conversation{completionCount > 1 ? "s" : ""} Completed!
              </span>
              <span className="text-2xl">🎉</span>
            </div>
            <p className="text-sm text-zinc-300 mb-2">
              You successfully navigated{" "}
              {completedConversations?.A && completedConversations?.B
                ? "both conversations"
                : completedConversations?.A
                ? "Conversation A"
                : "Conversation B"}{" "}
              to a natural conclusion!
            </p>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.5 }}
              className="inline-block px-3 py-1 bg-emerald-500/30 rounded-lg"
            >
              <span className="text-emerald-300 font-mono font-bold">
                +{completionBonus}
              </span>
              <span className="text-emerald-400/70 ml-2 text-sm">
                completion bonus
              </span>
            </motion.div>
            <p className="text-xs text-zinc-500 mt-2">
              A new conversation will begin next round
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3 mb-6">
        <ConversationScores label="A" scores={result.A} delta={confusionDelta.A} />
        <ConversationScores label="B" scores={result.B} delta={confusionDelta.B} />
      </div>

      <motion.button
        whileHover={canProceed ? { scale: 1.02 } : {}}
        whileTap={canProceed ? { scale: 0.98 } : {}}
        onClick={handleProceed}
        disabled={!canProceed}
        className={`w-full py-3 font-semibold rounded-xl transition-all ${
          canProceed
            ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25"
            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
        }`}
      >
        {hasAnyEnding && !canProceed
          ? "Choose what to do with ending conversation" + (endingConversations.A && endingConversations.B ? "s" : "")
          : "Continue to Next Round"}
      </motion.button>
    </motion.div>
  );
}

