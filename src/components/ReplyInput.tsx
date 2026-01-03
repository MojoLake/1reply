"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface ReplyInputProps {
  onSubmit: (reply: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  maxLength?: number;
  timeRemaining?: number;
}

export default function ReplyInput({
  onSubmit,
  disabled = false,
  isLoading = false,
  maxLength = 280,
  timeRemaining,
}: ReplyInputProps) {
  const [reply, setReply] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled && !isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled, isLoading]);

  const handleSubmit = () => {
    const trimmed = reply.trim();
    if (trimmed && !disabled && !isLoading) {
      onSubmit(trimmed);
      setReply("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const charCount = reply.length;
  const isNearLimit = charCount > maxLength * 0.8;
  const isOverLimit = charCount > maxLength;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full font-mono"
    >
      {/* Timer display */}
      {timeRemaining !== undefined && (
        <div className="flex justify-center mb-3">
          <motion.div
            className={`px-4 py-1.5 text-sm font-bold border ${
              timeRemaining <= 5
                ? "border-white text-white animate-pulse"
                : timeRemaining <= 10
                ? "border-gray-500 text-gray-400"
                : "border-gray-700 text-gray-500"
            }`}
          >
            [{timeRemaining}s]
          </motion.div>
        </div>
      )}

      <div className="relative">
        {/* Terminal prompt indicator */}
        <div className="absolute left-3 top-4 text-gray-500 select-none">&gt;</div>
        <textarea
          ref={textareaRef}
          value={reply}
          onChange={(e) => setReply(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          placeholder="Type a reply that works for both conversations..."
          className={`w-full pl-8 pr-5 py-4 bg-black border text-white placeholder-gray-600 resize-none focus:outline-none transition-colors ${
            disabled || isLoading
              ? "border-gray-800 opacity-60 cursor-not-allowed"
              : "border-gray-700 focus:border-white"
          }`}
          rows={3}
        />

        {/* Character count */}
        <div
          className={`absolute bottom-3 right-3 text-xs ${
            isOverLimit
              ? "text-white"
              : isNearLimit
              ? "text-gray-400"
              : "text-gray-600"
          }`}
        >
          {charCount}/{maxLength}
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <motion.button
          whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
          whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
          onClick={handleSubmit}
          disabled={disabled || isLoading || !reply.trim() || isOverLimit}
          className={`px-8 py-3 font-semibold text-sm transition-all border ${
            disabled || isLoading || !reply.trim() || isOverLimit
              ? "border-gray-700 text-gray-600 cursor-not-allowed"
              : "border-white text-white hover:bg-white hover:text-black"
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              >
                [...]
              </motion.span>
              EVALUATING
            </span>
          ) : (
            "[ SEND REPLY ]"
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
