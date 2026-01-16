export interface ModerationResult {
  approved: boolean;
  reason?: string;
}

// =============================================================================
// Keyword Blocklist - catches obvious violations instantly
// =============================================================================

// Patterns for obviously inappropriate content
// This is intentionally conservative - only blocks the worst offenders
const BLOCKED_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  // Slurs and hate speech (common variations)
  { pattern: /\bn[i1]gg[ae3]r?s?\b/i, reason: "Racial slur detected" },
  { pattern: /\bf[a@]gg?[o0]t?s?\b/i, reason: "Homophobic slur detected" },
  { pattern: /\bk[i1]ke?s?\b/i, reason: "Antisemitic slur detected" },
  { pattern: /\bch[i1]nk?s?\b/i, reason: "Racial slur detected" },
  { pattern: /\bsp[i1]c?s?\b/i, reason: "Racial slur detected" },
  { pattern: /\btr[a@]nn(y|ie)s?\b/i, reason: "Transphobic slur detected" },
  { pattern: /\bretard(ed|s)?\b/i, reason: "Ableist slur detected" },

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
 * Quick keyword blocklist check - catches obvious violations instantly.
 * Returns { passed: true } if clean, { passed: false, reason } if blocked.
 */
export function checkBlocklist(text: string): {
  passed: boolean;
  reason?: string;
} {
  const normalizedText = text.toLowerCase();

  for (const { pattern, reason } of BLOCKED_PATTERNS) {
    if (pattern.test(normalizedText)) {
      return { passed: false, reason };
    }
  }

  return { passed: true };
}

/**
 * Check multiple texts against the blocklist.
 */
export function checkBlocklistMultiple(texts: string[]): {
  passed: boolean;
  reason?: string;
} {
  const combined = texts.join(" ");
  return checkBlocklist(combined);
}

/**
 * Moderate messages using keyword blocklist only.
 * Returns { approved: true } if clean, { approved: false, reason } if blocked.
 */
export function moderateMessages(messages: string[]): ModerationResult {
  const blocklistResult = checkBlocklistMultiple(messages);
  if (!blocklistResult.passed) {
    return { approved: false, reason: blocklistResult.reason };
  }
  return { approved: true };
}
