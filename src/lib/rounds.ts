import { ConversationSituation, GameMode, RoundData, SituationPair } from "./types";
import situations from "@/data/situations";
import pairs from "@/data/pairs";

/**
 * Create a map of situation IDs to situations for fast lookup
 */
const situationMap = new Map<string, ConversationSituation>(
  situations.map((s) => [s.id, s])
);

/**
 * Filter pairs by mode (exclude trios for non-extreme modes)
 */
function filterPairsByMode(allPairs: SituationPair[], mode: GameMode): SituationPair[] {
  if (mode === "extreme") {
    return allPairs; // Include trios
  }
  // For non-extreme modes, only include pairs (2 situations)
  return allPairs.filter((p) => p.situationIds.length === 2);
}

/**
 * Convert a SituationPair to RoundData by looking up the actual situations
 */
function pairToRoundData(pair: SituationPair): RoundData | null {
  const situationA = situationMap.get(pair.situationIds[0]);
  const situationB = situationMap.get(pair.situationIds[1]);
  const situationC = pair.situationIds.length === 3
    ? situationMap.get(pair.situationIds[2])
    : undefined;

  if (!situationA || !situationB) {
    console.warn(`Pair ${pair.id} references missing situations`);
    return null;
  }

  if (pair.situationIds.length === 3 && !situationC) {
    console.warn(`Trio ${pair.id} references missing third situation`);
    return null;
  }

  return {
    pairId: pair.id,
    situationA,
    situationB,
    situationC,
  };
}

/**
 * Select a curated pair of situations for the game
 */
export function selectSituationPair(
  usedPairIds: string[],
  mode: GameMode = "classic"
): RoundData {
  // Filter pairs by mode and exclude already used ones
  const availablePairs = filterPairsByMode(pairs, mode).filter(
    (p) => !usedPairIds.includes(p.id)
  );

  // If no pairs left, recycle from all pairs for this mode
  const pool = availablePairs.length > 0
    ? availablePairs
    : filterPairsByMode(pairs, mode);

  // Shuffle and pick one
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selectedPair = shuffled[0];

  const roundData = pairToRoundData(selectedPair);
  if (roundData) {
    return roundData;
  }

  // Fallback: try other pairs
  for (const pair of shuffled.slice(1)) {
    const data = pairToRoundData(pair);
    if (data) return data;
  }

  // Ultimate fallback: random selection from situations (shouldn't happen)
  console.error("No valid pairs found, falling back to random selection");
  return selectRandomFallback();
}

/**
 * Fallback random selection (only used if all curated pairs are invalid)
 */
function selectRandomFallback(): RoundData {
  const shuffled = [...situations].sort(() => Math.random() - 0.5);
  return {
    pairId: "fallback-random",
    situationA: shuffled[0],
    situationB: shuffled[1],
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

  // Filter to pairs only (daily mode doesn't use trios)
  const dailyPairs = filterPairsByMode(pairs, "daily");
  const shuffled = [...dailyPairs].sort(() => random() - 0.5);
  const selectedPair = shuffled[0];

  const roundData = pairToRoundData(selectedPair);
  if (roundData) {
    return roundData;
  }

  // Fallback to random situations
  const allSituations = [...situations].sort(() => random() - 0.5);
  return {
    pairId: "daily-fallback",
    situationA: allSituations[0],
    situationB: allSituations[1],
  };
}
