import { GoogleGenerativeAI } from "@google/generative-ai";
import { Conversation, JudgeResult, JudgeScores } from "./types";
import { extractJsonFromResponse } from "./parseJson";
import {
  GEMINI_MODEL,
  JUDGE_TEMPERATURE,
  JUDGE_MAX_TOKENS,
  JUDGE_MAX_RETRIES,
  JUDGE_NOTES_LIMIT,
  NEUTRAL_SCORE,
} from "./constants";

/**
 * Build the judge system prompt for evaluating replies across multiple conversations.
 */
function buildJudgeSystemPrompt(conversationCount: 2 | 3): string {
  const countWord = conversationCount === 2 ? "TWO" : "THREE";
  const countWordLower = conversationCount === 2 ? "both" : "all three";
  const modeNote = conversationCount === 3 ? " (EXTREME mode)" : "";

  const outputSchema =
    conversationCount === 3
      ? `{
  "A": {
    "coherence": <0-10>,
    "relevance": <0-10>,
    "tone_match": <0-10>,
    "directness": <0-10>,
    "contradiction": <true/false>,
    "unsafe": <true/false>,
    "notes": ["<one brief sentence explaining the score>"]
  },
  "B": {
    "coherence": <0-10>,
    "relevance": <0-10>,
    "tone_match": <0-10>,
    "directness": <0-10>,
    "contradiction": <true/false>,
    "unsafe": <true/false>,
    "notes": ["<one brief sentence explaining the score>"]
  },
  "C": {
    "coherence": <0-10>,
    "relevance": <0-10>,
    "tone_match": <0-10>,
    "directness": <0-10>,
    "contradiction": <true/false>,
    "unsafe": <true/false>,
    "notes": ["<one brief sentence explaining the score>"]
  }
}`
      : `{
  "A": {
    "coherence": <0-10>,
    "relevance": <0-10>,
    "tone_match": <0-10>,
    "directness": <0-10>,
    "contradiction": <true/false>,
    "unsafe": <true/false>,
    "notes": ["<one brief sentence explaining the score>"]
  },
  "B": {
    "coherence": <0-10>,
    "relevance": <0-10>,
    "tone_match": <0-10>,
    "directness": <0-10>,
    "contradiction": <true/false>,
    "unsafe": <true/false>,
    "notes": ["<one brief sentence explaining the score>"]
  }
}`;

  return `You are a strict evaluator for a word game. Your job is to evaluate a player's reply as the next message in ${countWord} independent conversations${modeNote}.

CRITICAL RULES:
- Do not invent facts beyond what's in the transcripts
- Do not assume hidden intent or subtext
- Penalize vague replies that avoid answering ${countWordLower} conversations
- Penalize non-sequiturs that don't follow naturally
- Reward replies that naturally fit ${countWord.toUpperCase()} conversation contexts
- A reply that is grammatically correct but contextually wrong should score low
- Consider: Would a real person in this conversation be confused by this reply?

SCORING GUIDE (0-10):
- coherence: Does the reply logically follow from the conversation? (10 = perfect follow-up, 0 = complete non-sequitur)
- relevance: Does the reply address what the other person said/asked? (10 = directly addresses, 0 = completely off-topic)
- tone_match: Does the reply match the conversation's tone? (10 = perfect match, 0 = totally wrong tone)
- directness: Is the reply substantive vs evasive? (10 = clear and direct, 0 = meaningless filler)

FLAGS:
- contradiction: true if the reply contradicts established facts in this conversation
- unsafe: true if the reply contains harmful, offensive, or inappropriate content

OUTPUT: Return ONLY valid JSON matching this exact schema:
${outputSchema}`;
}

function formatConversationForJudge(
  conversation: Conversation,
  label: string
): string {
  const lines: string[] = [];
  lines.push(`=== Conversation ${label} ===`);
  lines.push(`Person: ${conversation.situation.personName}`);
  lines.push(`Context: ${conversation.situation.personContext}`);
  lines.push(`Tone: ${conversation.situation.tone}`);
  lines.push(`Their intent: ${conversation.situation.intent}`);
  lines.push(`Known facts: ${conversation.situation.facts.join("; ")}`);
  lines.push(`\nTranscript:`);

  for (const msg of conversation.transcript) {
    const speaker =
      msg.role === "them" ? conversation.situation.personName : "Player";
    lines.push(`${speaker}: ${msg.text}`);
  }

  return lines.join("\n");
}

function buildJudgePrompt(
  conversationA: Conversation,
  conversationB: Conversation,
  playerReply: string,
  conversationC?: Conversation
): string {
  if (conversationC) {
    return `${formatConversationForJudge(conversationA, "A")}

${formatConversationForJudge(conversationB, "B")}

${formatConversationForJudge(conversationC, "C")}

=== Player's Reply (sent to ALL THREE conversations) ===
"${playerReply}"

Evaluate how well this single reply works as the next message in EACH conversation independently.`;
  }

  return `${formatConversationForJudge(conversationA, "A")}

${formatConversationForJudge(conversationB, "B")}

=== Player's Reply (sent to BOTH conversations) ===
"${playerReply}"

Evaluate how well this single reply works as the next message in EACH conversation independently.`;
}

function parseJudgeResponse(
  response: string,
  expectC: boolean = false
): JudgeResult | null {
  try {
    const jsonStr = extractJsonFromResponse(response);
    const parsed = JSON.parse(jsonStr);

    // Validate structure
    if (!parsed.A || !parsed.B) {
      return null;
    }

    // For extreme mode, we need C as well
    if (expectC && !parsed.C) {
      return null;
    }

    const validateScores = (scores: JudgeScores): boolean => {
      return (
        typeof scores.coherence === "number" &&
        typeof scores.relevance === "number" &&
        typeof scores.tone_match === "number" &&
        typeof scores.directness === "number" &&
        typeof scores.contradiction === "boolean" &&
        typeof scores.unsafe === "boolean" &&
        Array.isArray(scores.notes)
      );
    };

    if (!validateScores(parsed.A) || !validateScores(parsed.B)) {
      return null;
    }

    if (expectC && !validateScores(parsed.C)) {
      return null;
    }

    // Clamp scores to 0-10
    const clampScore = (s: JudgeScores): JudgeScores => ({
      coherence: Math.max(0, Math.min(10, Math.round(s.coherence))),
      relevance: Math.max(0, Math.min(10, Math.round(s.relevance))),
      tone_match: Math.max(0, Math.min(10, Math.round(s.tone_match))),
      directness: Math.max(0, Math.min(10, Math.round(s.directness))),
      contradiction: s.contradiction,
      unsafe: s.unsafe,
      notes: s.notes.slice(0, JUDGE_NOTES_LIMIT),
    });

    const result: JudgeResult = {
      A: clampScore(parsed.A),
      B: clampScore(parsed.B),
    };

    if (expectC && parsed.C) {
      result.C = clampScore(parsed.C);
    }

    return result;
  } catch {
    return null;
  }
}

export async function judgeReply(
  conversationA: Conversation,
  conversationB: Conversation,
  playerReply: string,
  apiKey: string,
  maxRetries = JUDGE_MAX_RETRIES,
  conversationC?: Conversation
): Promise<JudgeResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const isExtremeMode = !!conversationC;
  const systemPrompt = buildJudgeSystemPrompt(isExtremeMode ? 3 : 2);
  const prompt = buildJudgePrompt(
    conversationA,
    conversationB,
    playerReply,
    conversationC
  );

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt + "\n\n" + prompt }],
          },
        ],
        generationConfig: {
          temperature: JUDGE_TEMPERATURE,
          maxOutputTokens: JUDGE_MAX_TOKENS,
        },
      });

      const response = result.response.text();
      const parsed = parseJudgeResponse(response, isExtremeMode);

      if (parsed) {
        return parsed;
      }

      console.warn(`Judge parse failed on attempt ${attempt + 1}, retrying...`);
    } catch (error) {
      console.error(`Judge API error on attempt ${attempt + 1}:`, error);
    }
  }

  // Fallback: return neutral scores if all retries fail
  console.error("All judge retries failed, returning neutral scores");
  const neutralScore: JudgeScores = {
    coherence: NEUTRAL_SCORE,
    relevance: NEUTRAL_SCORE,
    tone_match: NEUTRAL_SCORE,
    directness: NEUTRAL_SCORE,
    contradiction: false,
    unsafe: false,
    notes: ["Evaluation failed - neutral score applied"],
  };

  const result: JudgeResult = {
    A: { ...neutralScore },
    B: { ...neutralScore },
  };

  if (isExtremeMode) {
    result.C = { ...neutralScore };
  }

  return result;
}
