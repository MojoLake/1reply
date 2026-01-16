import { useEffect, useRef } from "react";
import { GamePhase } from "./useGameReducer";

interface UseGameTimerParams {
  hasTimer: boolean;
  phase: GamePhase;
  timeRemaining: number | undefined;
  onTick: () => void;
  onExpire: () => void;
}

/**
 * Manages the game timer countdown.
 * - Ticks every second when in "playing" phase
 * - Calls onExpire when timer reaches 0
 */
export function useGameTimer({
  hasTimer,
  phase,
  timeRemaining,
  onTick,
  onExpire,
}: UseGameTimerParams) {
  // Track if we're currently submitting to prevent double-submission
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (!hasTimer || phase !== "playing" || timeRemaining === undefined) {
      return;
    }

    if (timeRemaining <= 0) {
      // Auto-submit when timer expires
      if (!isSubmittingRef.current) {
        isSubmittingRef.current = true;
        onExpire();
        // Reset after a short delay to allow new submissions
        setTimeout(() => {
          isSubmittingRef.current = false;
        }, 100);
      }
      return;
    }

    const timer = setTimeout(() => {
      onTick();
    }, 1000);

    return () => clearTimeout(timer);
  }, [hasTimer, phase, timeRemaining, onTick, onExpire]);

  return {
    isSubmittingRef,
  };
}

/**
 * Calculate the timer value for the next round.
 * Timer decreases by a fixed amount per round, with a minimum cap.
 */
export function calculateNextRoundTime(
  currentRound: number,
  initialTime: number,
  decrementPerRound: number,
  minTime: number
): number {
  // Add 5 to initial time as a buffer, then subtract based on next round
  const nextRound = currentRound + 1;
  return Math.max(minTime, initialTime + 5 - nextRound * decrementPerRound);
}
