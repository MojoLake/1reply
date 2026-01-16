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

      console.warn(`Moderation parse failed on attempt ${attempt + 1}, retrying...`);
    } catch (error) {
      console.error(`Moderation API error on attempt ${attempt + 1}:`, error);
    }
  }

  // Default to approved if moderation fails (permissive approach)
  console.warn("All moderation retries failed, defaulting to approved");
  return { approved: true };
}
