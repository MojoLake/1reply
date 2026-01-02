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
  maxLength = 500,
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
      className="w-full"
    >
      {/* Timer display */}
      {timeRemaining !== undefined && (
        <div className="flex justify-center mb-3">
          <motion.div
            className={`px-4 py-1.5 rounded-full font-mono text-sm font-bold ${
              timeRemaining <= 5
                ? "bg-red-500/20 text-red-400 animate-pulse"
                : timeRemaining <= 10
                ? "bg-amber-500/20 text-amber-400"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {timeRemaining}s
          </motion.div>
        </div>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={reply}
          onChange={(e) => setReply(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          placeholder="Type a reply that works for both conversations..."
          className={`w-full px-5 py-4 bg-zinc-900 border-2 rounded-2xl text-white placeholder-zinc-500 resize-none focus:outline-none transition-colors ${
            disabled || isLoading
              ? "border-zinc-800 opacity-60 cursor-not-allowed"
              : "border-zinc-700 focus:border-indigo-500"
          }`}
          rows={3}
        />

        {/* Character count */}
        <div
          className={`absolute bottom-3 right-3 text-xs font-mono ${
            isOverLimit
              ? "text-red-400"
              : isNearLimit
              ? "text-amber-400"
              : "text-zinc-600"
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
          className={`px-8 py-3 rounded-xl font-semibold text-white transition-all ${
            disabled || isLoading || !reply.trim() || isOverLimit
              ? "bg-zinc-700 cursor-not-allowed opacity-60"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25"
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
              Evaluating...
            </span>
          ) : (
            "Send Reply"
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

