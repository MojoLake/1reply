import { JudgeScores } from "./types";
import {
  MAX_CONFUSION,
  PASS_COHERENCE_THRESHOLD,
  PASS_RELEVANCE_THRESHOLD,
  DIRECTNESS_BONUS_THRESHOLD,
  PARTIAL_PASS_THRESHOLD,
} from "./constants";

/**
 * Calculate confusion delta based on judge scores.
 * 
 * pass = coherence >= threshold && relevance >= threshold && !contradiction && !unsafe
 * 
 * Delta mapping:
 * - If unsafe → +2
 * - Else if contradiction → +2
 * - Else if pass && directness >= bonus threshold → -1 (reduce confusion!)
 * - Else if pass → 0
 * - Else if coherence >= partial && relevance >= partial → +1
 * - Else → +2
 */
export function calculateConfusionDelta(scores: JudgeScores): number {
  const pass =
    scores.coherence >= PASS_COHERENCE_THRESHOLD &&
    scores.relevance >= PASS_RELEVANCE_THRESHOLD &&
    !scores.contradiction &&
    !scores.unsafe;

  if (scores.unsafe) {
    return 2;
  }

  if (scores.contradiction) {
    return 2;
  }

  if (pass && scores.directness >= DIRECTNESS_BONUS_THRESHOLD) {
    return -1; // Great reply reduces confusion
  }

  if (pass) {
    return 0;
  }

  if (scores.coherence >= PARTIAL_PASS_THRESHOLD && scores.relevance >= PARTIAL_PASS_THRESHOLD) {
    return 1;
  }

  return 2;
}

/**
 * Clamp confusion value between 0 and MAX_CONFUSION
 */
export function clampConfusion(value: number): number {
  return Math.max(0, Math.min(MAX_CONFUSION, value));
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
  return faces[Math.min(MAX_CONFUSION, Math.max(0, confusion))] || ":|";
}

/**
 * Get confusion bar display
 */
export function getConfusionBar(confusion: number): string {
  const filled = "■";
  const empty = "□";
  const filledCount = Math.min(MAX_CONFUSION, Math.max(0, confusion));
  return "[" + filled.repeat(filledCount) + empty.repeat(MAX_CONFUSION - filledCount) + "]";
}

/**
 * Get color class for confusion level (grayscale for terminal aesthetic)
 */
export function getConfusionColor(confusion: number): string {
  if (confusion <= 1) return "text-white";
  if (confusion <= 2) return "text-gray-300";
  if (confusion <= 3) return "text-gray-400";
  return "text-gray-500";
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
  return meanings[Math.min(MAX_CONFUSION, Math.max(0, confusion))] || "Unknown";
}
