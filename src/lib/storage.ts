import { GameMode } from "./types";

const STORAGE_KEY = "1reply_game_data";

export interface StoredGameData {
  highScores: {
    classic: number;
    timer: number;
    daily: { score: number; date: string };
    extreme: number;
  };
  bestRounds: {
    classic: number;
    timer: number;
    extreme: number;
  };
  totalGamesPlayed: number;
  lastPlayed: string;
}

const defaultData: StoredGameData = {
  highScores: {
    classic: 0,
    timer: 0,
    daily: { score: 0, date: "" },
    extreme: 0,
  },
  bestRounds: {
    classic: 0,
    timer: 0,
    extreme: 0,
  },
  totalGamesPlayed: 0,
  lastPlayed: "",
};

/**
 * Get stored game data from localStorage
 */
export function getStoredData(): StoredGameData {
  if (typeof window === "undefined") return defaultData;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultData;
    return { ...defaultData, ...JSON.parse(stored) };
  } catch {
    return defaultData;
  }
}

/**
 * Save game data to localStorage
 */
export function saveStoredData(data: StoredGameData): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.error("Failed to save game data");
  }
}

/**
 * Update high score if current score is higher
 */
export function updateHighScore(mode: GameMode, score: number, rounds: number): void {
  const data = getStoredData();

  if (mode === "daily") {
    const today = new Date().toISOString().split("T")[0];
    if (data.highScores.daily.date !== today || score > data.highScores.daily.score) {
      data.highScores.daily = { score, date: today };
    }
  } else {
    if (score > data.highScores[mode]) {
      data.highScores[mode] = score;
    }
    if (rounds > data.bestRounds[mode]) {
      data.bestRounds[mode] = rounds;
    }
  }

  data.totalGamesPlayed++;
  data.lastPlayed = new Date().toISOString();

  saveStoredData(data);
}

/**
 * Check if daily challenge has been played today
 */
export function hasDailyBeenPlayed(): boolean {
  const data = getStoredData();
  const today = new Date().toISOString().split("T")[0];
  return data.highScores.daily.date === today;
}

