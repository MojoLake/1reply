"use client";

import { motion } from "framer-motion";
import { Conversation } from "@/lib/types";
import ConfusionMeter from "./ConfusionMeter";

interface ConversationPanelProps {
  conversation: Conversation;
  label: "A" | "B";
  delta?: number;
  showDelta?: boolean;
  showIntent?: boolean;
}

export default function ConversationPanel({
  conversation,
  label,
  delta,
  showDelta = false,
  showIntent = false,
}: ConversationPanelProps) {
  const { situation, transcript, confusion } = conversation;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: label === "A" ? 0 : 0.1 }}
      className="flex flex-col h-full bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden"
    >
      {/* Header with confusion meter */}
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
              Conv {label}
            </span>
            <span className="text-sm font-medium text-zinc-300">
              {situation.personName}
            </span>
          </div>
        </div>
        <ConfusionMeter
          confusion={confusion}
          delta={delta}
          showDelta={showDelta}
        />
      </div>

      {/* Context */}
      <div className="px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/30">
        <p className="text-xs text-zinc-500">{situation.personContext}</p>
        {showIntent && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-amber-400/80 mt-1"
          >
            Intent: {situation.intent.replace(/_/g, " ")}
          </motion.p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {transcript.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`flex ${msg.role === "player" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                msg.role === "player"
                  ? "bg-indigo-600 text-white rounded-br-md"
                  : "bg-zinc-800 text-zinc-100 rounded-bl-md"
              }`}
            >
              {msg.role === "them" && (
                <span className="text-xs font-medium text-zinc-400 block mb-1">
                  {situation.personName}
                </span>
              )}
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

