"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  getConfusionFace,
  getConfusionBar,
  getConfusionColor,
  getConfusionMeaning,
} from "@/lib/confusion";

interface ConfusionMeterProps {
  confusion: number;
  delta?: number;
  showDelta?: boolean;
  barOnly?: boolean;
}

export default function ConfusionMeter({
  confusion,
  delta,
  showDelta = false,
  barOnly = false,
}: ConfusionMeterProps) {
  const face = getConfusionFace(confusion);
  const bar = getConfusionBar(confusion);
  const colorClass = getConfusionColor(confusion);
  const meaning = getConfusionMeaning(confusion);

  // Bar only mode - just the bar and meaning, no face
  if (barOnly) {
    return (
      <div className="flex items-center gap-2 font-mono">
        <motion.div
          key={confusion}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          className={`text-xs tracking-wider ${colorClass}`}
        >
          {bar}
        </motion.div>
        <span className="text-xs text-gray-600">{meaning}</span>
        <AnimatePresence>
          {showDelta && delta !== undefined && delta !== 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`text-xs font-bold ${
                delta > 0 ? "text-white" : "text-gray-500"
              }`}
            >
              {delta > 0 ? `+${delta}` : delta}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 font-mono">
      <div className="flex items-center gap-3">
        {/* ASCII Face */}
        <motion.div
          key={confusion}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-2xl font-bold ${colorClass}`}
        >
          {face}
        </motion.div>

        {/* Confusion Bar */}
        <div className="flex flex-col items-start">
          <motion.div
            key={confusion}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className={`text-sm tracking-wider ${colorClass}`}
          >
            {bar}
          </motion.div>
          <span className="text-xs text-gray-600 mt-0.5">{meaning}</span>
        </div>

        {/* Delta indicator */}
        <AnimatePresence>
          {showDelta && delta !== undefined && delta !== 0 && (
            <motion.div
              initial={{ opacity: 0, x: -10, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10 }}
              className={`text-sm font-bold ${
                delta > 0 ? "text-white" : "text-gray-500"
              }`}
            >
              {delta > 0 ? `+${delta}` : delta}
              {delta > 0 ? " ^" : " v"}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
