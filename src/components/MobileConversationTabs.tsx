"use client";

import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Conversation } from "@/lib/types";
import ConversationPanel from "./ConversationPanel";

interface TabConversation {
  label: "A" | "B" | "C";
  conversation: Conversation;
  delta?: number;
  isEnding?: boolean;
  onStartNew?: () => void;
  onContinueCurrent?: () => void;
}

interface MobileConversationTabsProps {
  conversations: TabConversation[];
  showDelta?: boolean;
}

export default function MobileConversationTabs({
  conversations,
  showDelta = false,
}: MobileConversationTabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold && activeTab > 0) {
      setActiveTab(activeTab - 1);
    } else if (info.offset.x < -threshold && activeTab < conversations.length - 1) {
      setActiveTab(activeTab + 1);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-gray-700 bg-black shrink-0">
        {conversations.map((conv, index) => {
          const isActive = activeTab === index;
          
          return (
            <button
              key={conv.label}
              onClick={() => setActiveTab(index)}
              className={`flex-1 px-2 py-2.5 text-sm font-mono transition-colors relative ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-300 hover:bg-gray-900/50"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-xs text-gray-600">[{conv.label}]</span>
                <span className="truncate max-w-[80px]">
                  {conv.conversation.situation.personName}
                </span>
                {/* Delta indicator on inactive tabs */}
                {!isActive && showDelta && conv.delta !== undefined && conv.delta !== 0 && (
                  <span
                    className={`text-xs font-bold ${
                      conv.delta > 0 ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {conv.delta > 0 ? `+${conv.delta}` : conv.delta}
                  </span>
                )}
              </div>
              {/* Active indicator line */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Swipeable content area */}
      <motion.div
        className="flex-1 min-h-0 overflow-hidden"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="h-full"
          >
            <ConversationPanel
              conversation={conversations[activeTab].conversation}
              label={conversations[activeTab].label}
              delta={conversations[activeTab].delta}
              showDelta={showDelta}
              isEnding={conversations[activeTab].isEnding}
              onStartNew={conversations[activeTab].onStartNew}
              onContinueCurrent={conversations[activeTab].onContinueCurrent}
              hideHeader
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Swipe hint */}
      <div className="flex justify-center gap-1.5 py-1.5 bg-black border-t border-gray-800">
        {conversations.map((_, index) => (
          <div
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              activeTab === index ? "bg-white" : "bg-gray-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

