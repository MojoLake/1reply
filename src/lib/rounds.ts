import { ConversationSituation, RoundData } from "./types";
import situations from "@/data/situations";

/**
 * Select a pair of situations for the game start
 */
export function selectSituationPair(usedSituationIds: string[]): RoundData {
  // Filter available situations (exclude already used ones)
  let pool = situations.filter((s) => !usedSituationIds.includes(s.id));

  // If not enough situations, recycle from all
  if (pool.length < 2) {
    pool = [...situations];
  }

  // Shuffle and pick two
  const shuffled = pool.sort(() => Math.random() - 0.5);

  // Try to pick situations with different intents for more challenge
  const situationA = shuffled[0];
  let situationB = shuffled.find(
    (s) => s.id !== situationA.id && s.intent !== situationA.intent
  );

  // If can't find different intent, just pick the next one
  if (!situationB) {
    situationB = shuffled.find((s) => s.id !== situationA.id) || shuffled[1];
  }

  return {
    situationA,
    situationB,
  };
}

/**
 * Select a single situation (for conversation swapping when one completes)
 */
export function selectSingleSituation(
  usedSituationIds: string[]
): ConversationSituation | null {
  // Filter available situations (exclude already used ones)
  let pool = situations.filter((s) => !usedSituationIds.includes(s.id));

  // If empty, recycle from all situations
  if (pool.length === 0) {
    pool = [...situations];
  }

  if (pool.length === 0) return null;

  // Shuffle and pick one
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled[0];
}

/**
 * Get a daily seed based on date
 */
export function getDailySeed(): number {
  const today = new Date();
  return (
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate()
  );
}

/**
 * Seeded random for daily mode
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * Get initial situation pair for daily mode (seeded for consistency)
 */
export function getDailyInitialPair(): RoundData {
  const seed = getDailySeed();
  const random = seededRandom(seed);

  const allSituations = [...situations].sort(() => random() - 0.5);

  // Pick first two situations from shuffled list
  const situationA = allSituations[0];
  const situationB = allSituations[1];

  return { situationA, situationB };
}
