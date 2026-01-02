import { JudgeResult } from "./types";

/**
 * Bonus points awarded for successfully completing a conversation
 * (navigating it to a natural conclusion)
 */
export const CONVERSATION_COMPLETION_BONUS = 200;

/**
 * Calculate score gained from a round based on judge results.
 * 
 * score += 10 * min(coherenceA, coherenceB)
 * score += 10 * min(relevanceA, relevanceB)
 * score += 5 * min(tone_matchA, tone_matchB)
 * if directnessA >= 7 && directnessB >= 7: score += 30
 */
export function calculateRoundScore(result: JudgeResult, roundNumber: number): number {
  let score = 0;

  // Base scores from minimum of both conversations
  score += 10 * Math.min(result.A.coherence, result.B.coherence);
  score += 10 * Math.min(result.A.relevance, result.B.relevance);
  score += 5 * Math.min(result.A.tone_match, result.B.tone_match);

  // Bonus for being direct in both
  if (result.A.directness >= 7 && result.B.directness >= 7) {
    score += 30;
  }

  // Survival bonus
  score += roundNumber * 50;

  return score;
}

/**
 * Format score for display
 */
export function formatScore(score: number): string {
  return score.toLocaleString();
}

