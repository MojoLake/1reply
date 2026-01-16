import { SituationPair } from "@/lib/types";

/**
 * Curated situation pairs for the game.
 *
 * Design philosophies:
 * - Confusable: Similar topics/words but different contexts (tricky but fair)
 * - Contrast: Stark tonal/stakes differences (boss + ex, serious + silly)
 * - Narrative: Creates funny/absurd scenarios when mixed up
 *
 * Trios (3 situations) are only used in extreme mode.
 */
export const pairs: SituationPair[] = [
  // === EASY: Clear contrast, forgiving pairs ===

  {
    id: "monday-blues",
    situationIds: ["coworker-monday", "friend-checkin-1"],
    difficulty: "easy",
    theme: "contrast",
  },
  {
    id: "weekend-plans",
    situationIds: ["dinner-plans", "movie-night"],
    difficulty: "easy",
    theme: "confusable",
  },
  {
    id: "neighbor-vs-gym",
    situationIds: ["neighbor-hello", "friend-checkin-2"],
    difficulty: "easy",
    theme: "contrast",
  },
  {
    id: "work-vs-play",
    situationIds: ["project-update", "concert-invite"],
    difficulty: "easy",
    theme: "contrast",
  },
  {
    id: "friend-updates",
    situationIds: ["friend-checkin-1", "friend-checkin-2"],
    difficulty: "easy",
    theme: "confusable",
  },
  {
    id: "food-talk",
    situationIds: ["recipe-share", "restaurant-rec"],
    difficulty: "easy",
    theme: "confusable",
  },
  {
    id: "hobby-chat",
    situationIds: ["new-hobby", "book-recommendation"],
    difficulty: "easy",
    theme: "confusable",
  },
  {
    id: "pet-stories",
    situationIds: ["pet-news", "dog-walker"],
    difficulty: "easy",
    theme: "confusable",
  },
  {
    id: "media-recs",
    situationIds: ["podcast-share", "book-recommendation"],
    difficulty: "easy",
    theme: "confusable",
  },
  {
    id: "fitness-friends",
    situationIds: ["gym-progress", "marathon-training"],
    difficulty: "easy",
    theme: "confusable",
  },

  // === MEDIUM: Subtle similarities, requires attention ===

  {
    id: "money-matters",
    situationIds: ["money-owed", "borrow-car"],
    difficulty: "medium",
    theme: "confusable",
  },
  {
    id: "emotional-whiplash",
    situationIds: ["friend-stressed", "crush-hint"],
    difficulty: "medium",
    theme: "narrative",
  },
  {
    id: "professional-personal",
    situationIds: ["feedback-request", "dating-advice"],
    difficulty: "medium",
    theme: "contrast",
  },
  {
    id: "family-drama",
    situationIds: ["parent-visit", "sister-drama"],
    difficulty: "medium",
    theme: "confusable",
  },
  {
    id: "roommate-woes",
    situationIds: ["roommate-issue", "roommate-partner"],
    difficulty: "medium",
    theme: "confusable",
  },
  {
    id: "tech-troubles",
    situationIds: ["tech-help", "parent-tech"],
    difficulty: "medium",
    theme: "confusable",
  },
  {
    id: "job-crossroads",
    situationIds: ["job-offer", "career-change"],
    difficulty: "medium",
    theme: "confusable",
  },
  {
    id: "party-planning",
    situationIds: ["surprise-party", "baby-shower"],
    difficulty: "medium",
    theme: "confusable",
  },
  {
    id: "housing-hunt",
    situationIds: ["apartment-hunting", "apartment-showing"],
    difficulty: "medium",
    theme: "confusable",
  },
  {
    id: "health-check",
    situationIds: ["health-concern", "doctor-results"],
    difficulty: "medium",
    theme: "confusable",
  },
  {
    id: "romance-juggle",
    situationIds: ["date-followup", "date-app-match"],
    difficulty: "medium",
    theme: "confusable",
  },
  {
    id: "work-politics",
    situationIds: ["boss-complaint", "coworker-boundary"],
    difficulty: "medium",
    theme: "confusable",
  },

  // === HARD: Confusable contexts, high stakes mix ===

  {
    id: "ex-vs-crush",
    situationIds: ["ex-text", "confession-feelings"],
    difficulty: "hard",
    theme: "narrative",
  },
  {
    id: "life-changes",
    situationIds: ["layoff-news", "promotion-news"],
    difficulty: "hard",
    theme: "contrast",
  },
  {
    id: "family-news",
    situationIds: ["new-baby", "friend-pregnancy"],
    difficulty: "hard",
    theme: "confusable",
  },
  {
    id: "support-circle",
    situationIds: ["breakup-comfort", "divorce-news"],
    difficulty: "hard",
    theme: "confusable",
  },
  {
    id: "secret-feelings",
    situationIds: ["coworker-crush", "work-crush"],
    difficulty: "hard",
    theme: "confusable",
  },
  {
    id: "wedding-chaos",
    situationIds: ["wedding-drama", "wedding-invitation"],
    difficulty: "hard",
    theme: "confusable",
  },
  {
    id: "money-awkward",
    situationIds: ["crypto-advice", "friend-mlm"],
    difficulty: "hard",
    theme: "confusable",
  },
  {
    id: "elder-care",
    situationIds: ["mom-health", "dad-retirement"],
    difficulty: "hard",
    theme: "confusable",
  },

  // === TRIOS: Extreme mode only ===

  {
    id: "triple-work-chaos",
    situationIds: ["project-update", "intern-question", "coworker-resignation"],
    difficulty: "hard",
    theme: "confusable",
  },
  {
    id: "triple-social-spiral",
    situationIds: ["dinner-plans", "concert-invite", "karaoke-night"],
    difficulty: "medium",
    theme: "confusable",
  },
  {
    id: "triple-family-storm",
    situationIds: ["parent-visit", "sibling-rivalry", "aunt-gossip"],
    difficulty: "hard",
    theme: "confusable",
  },
  {
    id: "triple-romance-maze",
    situationIds: ["date-followup", "ex-text", "coworker-crush"],
    difficulty: "hard",
    theme: "narrative",
  },
  {
    id: "triple-life-updates",
    situationIds: ["friend-checkin-1", "friend-checkin-2", "childhood-friend"],
    difficulty: "easy",
    theme: "confusable",
  },
];

export default pairs;
