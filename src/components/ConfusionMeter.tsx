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
}

export default function ConfusionMeter({
  confusion,
  delta,
  showDelta = false,
}: ConfusionMeterProps) {
  const face = getConfusionFace(confusion);
  const bar = getConfusionBar(confusion);
  const colorClass = getConfusionColor(confusion);
  const meaning = getConfusionMeaning(confusion);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-3">
        {/* ASCII Face */}
        <motion.div
          key={confusion}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`font-mono text-3xl font-bold ${colorClass}`}
        >
          {face}
        </motion.div>

        {/* Confusion Bar */}
        <div className="flex flex-col items-start">
          <motion.div
            key={confusion}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className={`font-mono text-lg tracking-wider ${colorClass}`}
          >
            {bar}
          </motion.div>
          <span className="text-xs text-zinc-500 mt-0.5">{meaning}</span>
        </div>

        {/* Delta indicator */}
        <AnimatePresence>
          {showDelta && delta !== undefined && delta !== 0 && (
            <motion.div
              initial={{ opacity: 0, x: -10, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10 }}
              className={`font-mono text-lg font-bold ${
                delta > 0 ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {delta > 0 ? `+${delta}` : delta}
              {delta > 0 ? " ↑" : " ↓"}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

