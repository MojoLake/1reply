import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";

// =============================================================================
// Text Normalization - defeats common bypass techniques
// =============================================================================

// Zero-width and invisible characters to strip
const ZERO_WIDTH_CHARS =
  /[\u200B\u200C\u200D\u2060\uFEFF\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180E\u2000-\u200F\u202A-\u202F\u205F-\u2064\u206A-\u206F\u3000\u3164\uFFA0]/g;

/**
 * Normalize text to defeat common bypass techniques:
 * - Strip zero-width and invisible characters
 * - Apply Unicode NFKC normalization (converts homoglyphs like Cyrillic "е" to Latin "e")
 * - Collapse multiple spaces
 */
export function normalizeText(text: string): string {
  return text
    .replace(ZERO_WIDTH_CHARS, "") // Remove invisible characters
    .normalize("NFKC") // Normalize homoglyphs (е→e, а→a, etc.)
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

// =============================================================================
// Obscenity Matcher - handles leetspeak, repeated chars, substitutions
// =============================================================================

const obscenityMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

/**
 * Check text against the Obscenity library's profanity detection.
 * Handles leetspeak, character substitutions, whitespace evasion, etc.
 */
function checkObscenity(text: string): { allowed: boolean; reason?: string } {
  const matches = obscenityMatcher.getAllMatches(text);
  if (matches.length > 0) {
    return { allowed: false, reason: "Inappropriate language detected" };
  }
  return { allowed: true };
}

// =============================================================================
// Custom Patterns - domain-specific content not covered by Obscenity
// =============================================================================

// Patterns for content Obscenity doesn't cover (violence, CSAM, doxxing)
const CUSTOM_BLOCKED_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  // Violence/harm instructions
  {
    pattern: /\bhow\s+to\s+(make|build)\s+(a\s+)?bomb\b/i,
    reason: "Violence instructions detected",
  },
  {
    pattern: /\bhow\s+to\s+kill\s+(yourself|someone)\b/i,
    reason: "Harmful content detected",
  },
  { pattern: /\bkill\s+yourself\b/i, reason: "Self-harm content detected" },
  { pattern: /\bcommit\s+suicide\b/i, reason: "Self-harm content detected" },

  // CSAM indicators
  {
    pattern: /\b(child|kid|minor)\s*(porn|sex|nude)/i,
    reason: "CSAM content detected",
  },
  { pattern: /\bpedo(phile|philia)?\b/i, reason: "CSAM content detected" },

  // Doxxing patterns
  {
    pattern: /\b(ssn|social\s*security)\s*:?\s*\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/i,
    reason: "Personal information detected",
  },
];

/**
 * Check text against custom domain-specific patterns.
 */
function checkCustomPatterns(text: string): {
  allowed: boolean;
  reason?: string;
} {
  const lowerText = text.toLowerCase();

  for (const { pattern, reason } of CUSTOM_BLOCKED_PATTERNS) {
    if (pattern.test(lowerText)) {
      return { allowed: false, reason };
    }
  }

  return { allowed: true };
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Check if text content is allowed by all moderation layers:
 * 1. Normalize text (strip zero-width chars, convert homoglyphs)
 * 2. Check against Obscenity library (handles leetspeak, substitutions)
 * 3. Check against custom patterns (violence, CSAM, doxxing)
 *
 * Returns { allowed: true } if clean, { allowed: false, reason } if blocked.
 */
export function isContentAllowed(text: string): {
  allowed: boolean;
  reason?: string;
} {
  const normalizedText = normalizeText(text);

  // Check Obscenity library first (covers slurs with evasion techniques)
  const obscenityResult = checkObscenity(normalizedText);
  if (!obscenityResult.allowed) {
    return obscenityResult;
  }

  // Check custom patterns (violence, CSAM, doxxing)
  const customResult = checkCustomPatterns(normalizedText);
  if (!customResult.allowed) {
    return customResult;
  }

  return { allowed: true };
}

/**
 * Check if all texts are allowed by all moderation layers.
 */
export function isAllContentAllowed(texts: string[]): {
  allowed: boolean;
  reason?: string;
} {
  const combined = texts.join(" ");
  return isContentAllowed(combined);
}

/**
 * Moderate messages using all moderation layers.
 * Returns { allowed: true } if clean, { allowed: false, reason } if blocked.
 */
export function moderateMessages(messages: string[]): {
  allowed: boolean;
  reason?: string;
} {
  return isAllContentAllowed(messages);
}
