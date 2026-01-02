"use client";

import { motion } from "framer-motion";
import { Conversation } from "@/lib/types";
import ConfusionMeter from "./ConfusionMeter";

interface ConversationPanelProps {
  conversation: Conversation;
  label: "A" | "B" | "C";
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
      transition={{ delay: label === "A" ? 0 : label === "B" ? 0.1 : 0.2 }}
      className="flex flex-col h-full bg-black border border-gray-700 overflow-hidden font-mono"
    >
      {/* Header with confusion meter */}
      <div className="px-4 py-3 border-b border-gray-700 bg-black">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              [{label}]
            </span>
            <span className="text-sm font-medium text-white">
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
      <div className="px-4 py-2 border-b border-gray-800 bg-black">
        <p className="text-xs text-gray-500">&gt; {situation.personContext}</p>
        {showIntent && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-gray-400 mt-1"
          >
            &gt; Intent: {situation.intent.replace(/_/g, " ")}
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
              className={`max-w-[85%] px-3 py-2 ${
                msg.role === "player"
                  ? "bg-white text-black"
                  : "bg-gray-900 text-gray-300 border border-gray-700"
              }`}
            >
              {msg.role === "them" && (
                <span className="text-xs font-medium text-gray-500 block mb-1">
                  {situation.personName}:
                </span>
              )}
              {msg.role === "player" && (
                <span className="text-xs font-medium text-gray-600 block mb-1">
                  You:
                </span>
              )}
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 text-gray-700 text-xs select-none">+</div>
      <div className="absolute top-0 right-0 text-gray-700 text-xs select-none">+</div>
      <div className="absolute bottom-0 left-0 text-gray-700 text-xs select-none">+</div>
      <div className="absolute bottom-0 right-0 text-gray-700 text-xs select-none">+</div>
    </motion.div>
  );
}
