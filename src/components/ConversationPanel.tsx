"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Conversation } from "@/lib/types";
import { CONVERSATION_COMPLETION_BONUS } from "@/lib/scoring";
import ConfusionMeter from "./ConfusionMeter";

interface ConversationPanelProps {
  conversation: Conversation;
  label: "A" | "B" | "C";
  delta?: number;
  showDelta?: boolean;
  isEnding?: boolean;
  onStartNew?: () => void;
  onContinueCurrent?: () => void;
  hideHeader?: boolean;
  isGameOverCause?: boolean;
}

export default function ConversationPanel({
  conversation,
  label,
  delta,
  showDelta = false,
  isEnding = false,
  onStartNew,
  onContinueCurrent,
  hideHeader = false,
  isGameOverCause = false,
}: ConversationPanelProps) {
  const { situation, transcript, confusion } = conversation;
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when transcript changes (only within container, not viewport)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [transcript]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: label === "A" ? 0 : label === "B" ? 0.1 : 0.2 }}
      className={`relative flex flex-col h-full bg-black border overflow-hidden font-mono ${
        isGameOverCause ? "border-red-600" : "border-gray-700"
      }`}
    >
      {/* Header with confusion meter - hidden when used in tabbed view */}
      {!hideHeader && (
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
      )}

      {/* Context - always visible */}
      <div className="px-3 py-2 border-b border-gray-800 bg-black">
        <p className="text-xs text-gray-500">&gt; {situation.personContext}</p>
        {/* Show confusion meter when header is hidden (tabbed view) */}
        {hideHeader && (
          <div className="mt-2 flex justify-center">
            <ConfusionMeter
              confusion={confusion}
              delta={delta}
              showDelta={showDelta}
            />
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
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

      {/* Wrapping up message */}
      {isEnding && onStartNew && onContinueCurrent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3 border-t border-gray-700 bg-gray-900/50"
        >
          <p className="text-xs text-gray-400 mb-2">
            This conversation seems to be wrapping up.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onStartNew}
              className="flex-1 px-3 py-2 text-sm border border-white text-white hover:bg-white hover:text-black transition-all"
            >
              START NEW +{CONVERSATION_COMPLETION_BONUS}
            </button>
            <button
              onClick={onContinueCurrent}
              className="flex-1 px-3 py-2 text-sm border border-white text-white hover:bg-white hover:text-black transition-all"
            >
              CONTINUE
            </button>
          </div>
        </motion.div>
      )}

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 text-gray-700 text-xs select-none">+</div>
      <div className="absolute top-0 right-0 text-gray-700 text-xs select-none">+</div>
      <div className="absolute bottom-0 left-0 text-gray-700 text-xs select-none">+</div>
      <div className="absolute bottom-0 right-0 text-gray-700 text-xs select-none">+</div>
    </motion.div>
  );
}
