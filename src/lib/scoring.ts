import { JudgeResult } from "./types";
import {
  COHERENCE_SCORE_MULTIPLIER,
  RELEVANCE_SCORE_MULTIPLIER,
  TONE_SCORE_MULTIPLIER,
  DIRECTNESS_BONUS,
  DIRECTNESS_BONUS_THRESHOLD,
  SURVIVAL_BONUS_PER_ROUND,
} from "./constants";

/**
 * Bonus points awarded for successfully completing a conversation
 * (navigating it to a natural conclusion)
 */
export const CONVERSATION_COMPLETION_BONUS = 200;

/**
 * Calculate score gained from a round based on judge results.
 * 
 * score += COHERENCE_MULTIPLIER * min(coherenceA, coherenceB)
 * score += RELEVANCE_MULTIPLIER * min(relevanceA, relevanceB)
 * score += TONE_MULTIPLIER * min(tone_matchA, tone_matchB)
 * if directnessA >= threshold && directnessB >= threshold: score += DIRECTNESS_BONUS
 * score += roundNumber * SURVIVAL_BONUS
 */
export function calculateRoundScore(result: JudgeResult, roundNumber: number): number {
  let score = 0;

  // Base scores from minimum of both conversations
  score += COHERENCE_SCORE_MULTIPLIER * Math.min(result.A.coherence, result.B.coherence);
  score += RELEVANCE_SCORE_MULTIPLIER * Math.min(result.A.relevance, result.B.relevance);
  score += TONE_SCORE_MULTIPLIER * Math.min(result.A.tone_match, result.B.tone_match);

  // Bonus for being direct in both
  if (result.A.directness >= DIRECTNESS_BONUS_THRESHOLD && result.B.directness >= DIRECTNESS_BONUS_THRESHOLD) {
    score += DIRECTNESS_BONUS;
  }

  // Survival bonus
  score += roundNumber * SURVIVAL_BONUS_PER_ROUND;

  return score;
}

/**
 * Format score for display
 */
export function formatScore(score: number): string {
  return score.toLocaleString();
}
