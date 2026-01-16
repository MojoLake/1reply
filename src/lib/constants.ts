// Game limits
export const MAX_REPLY_LENGTH = 280;
export const MAX_ROUNDS = 30;
export const INITIAL_SURVIVAL_ROUNDS = 5; // First "win" checkpoint - player can choose to continue
export const MAX_CONFUSION = 5;

// Timer mode
export const TIMER_INITIAL_SECONDS = 30;
export const TIMER_MIN_SECONDS = 20;
export const TIMER_DECREMENT_PER_ROUND = 2;

// Scoring thresholds
export const PASS_COHERENCE_THRESHOLD = 7;
export const PASS_RELEVANCE_THRESHOLD = 7;
export const DIRECTNESS_BONUS_THRESHOLD = 8;
export const PARTIAL_PASS_THRESHOLD = 5;
export const CATASTROPHIC_THRESHOLD = 2; // Scores at or below this in BOTH coherence AND relevance = instant death

// Score multipliers
export const COHERENCE_SCORE_MULTIPLIER = 10;
export const RELEVANCE_SCORE_MULTIPLIER = 10;
export const TONE_SCORE_MULTIPLIER = 5;
export const DIRECTNESS_BONUS = 30;
export const SURVIVAL_BONUS_PER_ROUND = 50;

// AI model config
export const GEMINI_MODEL = "gemini-2.5-flash";
export const JUDGE_TEMPERATURE = 0.3;
export const CONTINUATION_TEMPERATURE = 0.7;
export const JUDGE_MAX_TOKENS = 4096;
export const CONTINUATION_MAX_TOKENS = 2048;
export const JUDGE_MAX_RETRIES = 3;
export const CONTINUATION_MAX_RETRIES = 2;

// Neutral/fallback score value
export const NEUTRAL_SCORE = 5;

// Notes limit in judge responses
export const JUDGE_NOTES_LIMIT = 3;
