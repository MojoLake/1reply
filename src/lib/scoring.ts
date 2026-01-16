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
 * score += COHERENCE_MULTIPLIER * min(coherence across all conversations)
 * score += RELEVANCE_MULTIPLIER * min(relevance across all conversations)
 * score += TONE_MULTIPLIER * min(tone_match across all conversations)
 * if all conversations meet directness threshold: score += DIRECTNESS_BONUS
 * score += roundNumber * SURVIVAL_BONUS
 */
export function calculateRoundScore(result: JudgeResult, roundNumber: number): number {
  let score = 0;

  // Collect all conversation scores (including C for extreme mode)
  const scores = [result.A, result.B];
  if (result.C) scores.push(result.C);

  // Base scores from minimum across all conversations
  score += COHERENCE_SCORE_MULTIPLIER * Math.min(...scores.map(s => s.coherence));
  score += RELEVANCE_SCORE_MULTIPLIER * Math.min(...scores.map(s => s.relevance));
  score += TONE_SCORE_MULTIPLIER * Math.min(...scores.map(s => s.tone_match));

  // Bonus for being direct in all conversations
  const allMeetDirectness = scores.every(s => s.directness >= DIRECTNESS_BONUS_THRESHOLD);
  if (allMeetDirectness) {
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
