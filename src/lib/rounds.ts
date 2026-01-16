import { ConversationSituation, GameMode, GamePair, RoundData } from "./types";
import pairs from "@/data/pairs";

/**
 * Extract all unique situations from pairs for single selection
 */
function getAllSituations(): ConversationSituation[] {
  const situationMap = new Map<string, ConversationSituation>();
  
  for (const pair of pairs) {
    situationMap.set(pair.situationA.id, pair.situationA);
    situationMap.set(pair.situationB.id, pair.situationB);
    if (pair.situationC) {
      situationMap.set(pair.situationC.id, pair.situationC);
    }
  }
  
  return Array.from(situationMap.values());
}

/**
 * Filter pairs by mode (exclude trios for non-extreme modes)
 */
function filterPairsByMode(allPairs: GamePair[], mode: GameMode): GamePair[] {
  if (mode === "extreme") {
    return allPairs; // Include trios
  }
  // For non-extreme modes, only include pairs (2 situations, no situationC)
  return allPairs.filter((p) => !p.situationC);
}

/**
 * Convert a GamePair to RoundData (direct extraction, no lookup needed)
 */
function pairToRoundData(pair: GamePair): RoundData {
  return {
    pairId: pair.id,
    situationA: pair.situationA,
    situationB: pair.situationB,
    situationC: pair.situationC,
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

  return pairToRoundData(selectedPair);
}

/**
 * Select a single situation (for conversation swapping when one completes)
 */
export function selectSingleSituation(
  usedSituationIds: string[]
): ConversationSituation | null {
  const allSituations = getAllSituations();
  
  // Filter available situations (exclude already used ones)
  let pool = allSituations.filter((s) => !usedSituationIds.includes(s.id));

  // If empty, recycle from all situations
  if (pool.length === 0) {
    pool = [...allSituations];
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

  return pairToRoundData(selectedPair);
}
