import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractJsonFromResponse } from "./parseJson";
import {
  GEMINI_MODEL,
  MODERATION_TEMPERATURE,
  MODERATION_MAX_TOKENS,
  MODERATION_MAX_RETRIES,
} from "./constants";

export interface ModerationResult {
  approved: boolean;
  reason?: string;
}

// =============================================================================
// Layer 1: Keyword Blocklist (instant, free)
// =============================================================================

// Patterns for obviously inappropriate content - catches the worst offenders instantly
// This is intentionally conservative; nuanced cases go to OpenAI Moderation API
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

// =============================================================================
// Gemini-based moderation (existing, for full scenario validation)
// =============================================================================

const MODERATION_SYSTEM_PROMPT = `You are a content moderator for a casual word puzzle game where players create conversation scenarios.

Your job is to check if user-submitted content is appropriate. Be PERMISSIVE - this is a creative game and edgy/awkward scenarios are part of the fun.

ONLY reject content that is:
- Hate speech targeting protected groups
- Explicit sexual content (not just flirty/romantic scenarios)
- Content promoting violence or self-harm
- Harassment or doxxing instructions
- Illegal activities (drug trafficking, etc.)

DO NOT reject:
- Awkward social situations
- Relationship drama (breakups, jealousy, etc.)
- Workplace conflicts
- Mild profanity
- Edgy humor
- Creative/absurd scenarios

OUTPUT: Return ONLY valid JSON:
{"approved": true}
or
{"approved": false, "reason": "<brief reason>"}`;

function buildModerationPrompt(content: {
  title: string;
  situations: Array<{
    personName: string;
    personContext: string;
    topic: string;
    tone: string;
    intent: string;
    facts: string[];
    messages: string[];
  }>;
}): string {
  const situationTexts = content.situations.map((s, i) => {
    return `Situation ${i + 1}:
- Person: ${s.personName}
- Context: ${s.personContext}
- Topic: ${s.topic}
- Tone: ${s.tone}
- Intent: ${s.intent}
- Facts: ${s.facts.join("; ")}
- Messages: ${s.messages.join(" | ")}`;
  });

  return `Review this user-created game scenario:

Title: ${content.title}

${situationTexts.join("\n\n")}

Is this content appropriate for the game?`;
}

function parseModerationResponse(response: string): ModerationResult | null {
  try {
    const jsonStr = extractJsonFromResponse(response);
    const parsed = JSON.parse(jsonStr);

    if (typeof parsed.approved === "boolean") {
      return {
        approved: parsed.approved,
        reason: parsed.reason,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function moderateContent(
  content: {
    title: string;
    situations: Array<{
      personName: string;
      personContext: string;
      topic: string;
      tone: string;
      intent: string;
      facts: string[];
      messages: string[];
    }>;
  },
  apiKey: string
): Promise<ModerationResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = buildModerationPrompt(content);

  for (let attempt = 0; attempt < MODERATION_MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: MODERATION_SYSTEM_PROMPT + "\n\n" + prompt }],
          },
        ],
        generationConfig: {
          temperature: MODERATION_TEMPERATURE,
          maxOutputTokens: MODERATION_MAX_TOKENS,
        },
      });

      const response = result.response.text();
      const parsed = parseModerationResponse(response);

      if (parsed) {
        return parsed;
      }

      console.warn(
        `Moderation parse failed on attempt ${attempt + 1}, retrying...`
      );
    } catch (error) {
      console.error(`Moderation API error on attempt ${attempt + 1}:`, error);
    }
  }

  // Default to approved if moderation fails (permissive approach)
  console.warn("All moderation retries failed, defaulting to approved");
  return { approved: true };
}

// =============================================================================
// Layer 2: OpenAI Moderation API (free, catches nuanced content)
// =============================================================================

interface OpenAIModerationResult {
  id: string;
  model: string;
  results: Array<{
    flagged: boolean;
    categories: {
      hate: boolean;
      "hate/threatening": boolean;
      harassment: boolean;
      "harassment/threatening": boolean;
      "self-harm": boolean;
      "self-harm/intent": boolean;
      "self-harm/instructions": boolean;
      sexual: boolean;
      "sexual/minors": boolean;
      violence: boolean;
      "violence/graphic": boolean;
    };
    category_scores: Record<string, number>;
  }>;
}

// Map OpenAI categories to user-friendly reasons
const CATEGORY_REASONS: Record<string, string> = {
  hate: "Hate speech detected",
  "hate/threatening": "Threatening hate speech detected",
  harassment: "Harassment detected",
  "harassment/threatening": "Threatening harassment detected",
  "self-harm": "Self-harm content detected",
  "self-harm/intent": "Self-harm intent detected",
  "self-harm/instructions": "Self-harm instructions detected",
  sexual: "Sexual content detected",
  "sexual/minors": "Content involving minors detected",
  violence: "Violent content detected",
  "violence/graphic": "Graphic violence detected",
};

/**
 * Check content using OpenAI's free Moderation API.
 * Returns { approved: true } if clean, { approved: false, reason } if flagged.
 */
export async function checkOpenAIModeration(
  texts: string[]
): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // If no API key, skip this layer (permissive)
    console.warn("OPENAI_API_KEY not configured, skipping OpenAI moderation");
    return { approved: true };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input: texts,
      }),
    });

    if (!response.ok) {
      console.error(
        "OpenAI Moderation API error:",
        response.status,
        response.statusText
      );
      // Fail open - if API errors, allow content through
      return { approved: true };
    }

    const data: OpenAIModerationResult = await response.json();

    // Check if any result is flagged
    for (const result of data.results) {
      if (result.flagged) {
        // Find the first flagged category for the reason
        const flaggedCategory = Object.entries(result.categories).find(
          ([, flagged]) => flagged
        );
        const reason = flaggedCategory
          ? CATEGORY_REASONS[flaggedCategory[0]] ||
            "Content flagged by moderation"
          : "Content flagged by moderation";

        return { approved: false, reason };
      }
    }

    return { approved: true };
  } catch (error) {
    console.error("OpenAI Moderation API error:", error);
    // Fail open - if API errors, allow content through
    return { approved: true };
  }
}

// =============================================================================
// Combined moderation for messages (used by /api/scenarios/generate)
// =============================================================================

/**
 * Two-layer moderation for raw messages:
 * 1. Keyword blocklist (instant, free)
 * 2. OpenAI Moderation API (free, catches nuanced content)
 *
 * Returns { approved: true } if clean, { approved: false, reason } if blocked.
 */
export async function moderateMessages(
  messages: string[]
): Promise<ModerationResult> {
  // Layer 1: Quick keyword blocklist
  const blocklistResult = checkBlocklistMultiple(messages);
  if (!blocklistResult.passed) {
    return { approved: false, reason: blocklistResult.reason };
  }

  // Layer 2: OpenAI Moderation API
  const openaiResult = await checkOpenAIModeration(messages);
  return openaiResult;
}
