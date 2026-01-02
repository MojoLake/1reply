import { JudgeScores } from "./types";

/**
 * Calculate confusion delta based on judge scores.
 * 
 * pass = coherence >= 6 && relevance >= 6 && !contradiction && !unsafe
 * 
 * Delta mapping:
 * - If unsafe → +2
 * - Else if contradiction → +2
 * - Else if pass && directness >= 7 → -1 (reduce confusion!)
 * - Else if pass → 0
 * - Else if coherence >= 4 && relevance >= 4 → +1
 * - Else → +2
 */
export function calculateConfusionDelta(scores: JudgeScores): number {
  const pass =
    scores.coherence >= 6 &&
    scores.relevance >= 6 &&
    !scores.contradiction &&
    !scores.unsafe;

  if (scores.unsafe) {
    return 2;
  }

  if (scores.contradiction) {
    return 2;
  }

  if (pass && scores.directness >= 7) {
    return -1; // Great reply reduces confusion
  }

  if (pass) {
    return 0;
  }

  if (scores.coherence >= 4 && scores.relevance >= 4) {
    return 1;
  }

  return 2;
}

/**
 * Clamp confusion value between 0 and 5
 */
export function clampConfusion(value: number): number {
  return Math.max(0, Math.min(5, value));
}

/**
 * Get ASCII face for confusion level
 */
export function getConfusionFace(confusion: number): string {
  const faces: Record<number, string> = {
    0: ":D",
    1: ":)",
    2: ":|",
    3: ":(",
    4: ":'(",
    5: ">:(",
  };
  return faces[Math.min(5, Math.max(0, confusion))] || ":|";
}

/**
 * Get confusion bar display
 */
export function getConfusionBar(confusion: number): string {
  const filled = "■";
  const empty = "□";
  const total = 5;
  const filledCount = Math.min(total, Math.max(0, confusion));
  return "[" + filled.repeat(filledCount) + empty.repeat(total - filledCount) + "]";
}

/**
 * Get color class for confusion level
 */
export function getConfusionColor(confusion: number): string {
  if (confusion <= 1) return "text-emerald-400";
  if (confusion <= 2) return "text-yellow-400";
  if (confusion <= 3) return "text-orange-400";
  return "text-red-400";
}

/**
 * Get meaning text for confusion level
 */
export function getConfusionMeaning(confusion: number): string {
  const meanings: Record<number, string> = {
    0: "Crystal clear",
    1: "Makes sense",
    2: "Slightly off",
    3: "Getting confused",
    4: "Very confused",
    5: "Total confusion",
  };
  return meanings[Math.min(5, Math.max(0, confusion))] || "Unknown";
}

