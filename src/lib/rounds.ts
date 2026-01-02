import { ConversationSituation, Difficulty, RoundData } from "./types";
import situations from "@/data/situations";

/**
 * Get difficulty for a given round number
 */
export function getDifficultyForRound(round: number): Difficulty {
  if (round <= 2) return "easy";
  if (round <= 5) return "medium";
  return "hard";
}

/**
 * Select a pair of situations for a round
 */
export function selectSituationPair(
  difficulty: Difficulty,
  usedSituationIds: string[]
): RoundData {
  // Filter available situations
  const available = situations.filter(
    (s) =>
      !usedSituationIds.includes(s.id) &&
      s.difficultyTags.includes(difficulty)
  );

  // If not enough situations at this difficulty, include lower difficulties
  let pool = [...available];
  if (pool.length < 2) {
    const fallbackDifficulties: Difficulty[] =
      difficulty === "hard"
        ? ["medium", "easy"]
        : difficulty === "medium"
        ? ["easy", "hard"]
        : ["medium", "hard"];

    for (const d of fallbackDifficulties) {
      const more = situations.filter(
        (s) =>
          !usedSituationIds.includes(s.id) &&
          s.difficultyTags.includes(d) &&
          !pool.includes(s)
      );
      pool = [...pool, ...more];
      if (pool.length >= 2) break;
    }
  }

  // If still not enough, reset and use all situations
  if (pool.length < 2) {
    pool = situations.filter((s) => s.difficultyTags.includes(difficulty));
    if (pool.length < 2) {
      pool = [...situations];
    }
  }

  // Shuffle and pick two
  const shuffled = pool.sort(() => Math.random() - 0.5);

  // Try to pick situations with different intents for more challenge
  let situationA = shuffled[0];
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
    difficulty,
  };
}

/**
 * Select a single situation (for conversation swapping when one completes)
 */
export function selectSingleSituation(
  difficulty: Difficulty,
  usedSituationIds: string[]
): ConversationSituation | null {
  // Filter available situations
  const available = situations.filter(
    (s) =>
      !usedSituationIds.includes(s.id) &&
      s.difficultyTags.includes(difficulty)
  );

  // If no situations at this difficulty, include other difficulties
  let pool = [...available];
  if (pool.length === 0) {
    const fallbackDifficulties: Difficulty[] =
      difficulty === "hard"
        ? ["medium", "easy"]
        : difficulty === "medium"
        ? ["easy", "hard"]
        : ["medium", "hard"];

    for (const d of fallbackDifficulties) {
      const more = situations.filter(
        (s) =>
          !usedSituationIds.includes(s.id) &&
          s.difficultyTags.includes(d) &&
          !pool.includes(s)
      );
      pool = [...pool, ...more];
      if (pool.length > 0) break;
    }
  }

  // If still empty, recycle from all situations
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
 * Get situation pairs for daily mode (fixed 5 rounds)
 */
export function getDailySituations(): RoundData[] {
  const seed = getDailySeed();
  const random = seededRandom(seed);

  const allSituations = [...situations].sort(() => random() - 0.5);

  const rounds: RoundData[] = [];
  const used: string[] = [];

  const difficulties: Difficulty[] = ["easy", "easy", "medium", "medium", "hard"];

  for (let i = 0; i < 5; i++) {
    const difficulty = difficulties[i];
    const available = allSituations.filter(
      (s) =>
        !used.includes(s.id) &&
        (s.difficultyTags.includes(difficulty) || i >= 3) // Allow any difficulty for later rounds
    );

    if (available.length >= 2) {
      const situationA = available[0];
      const situationB = available[1];
      used.push(situationA.id, situationB.id);
      rounds.push({ situationA, situationB, difficulty });
    }
  }

  return rounds;
}

