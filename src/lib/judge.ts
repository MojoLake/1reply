import { GoogleGenerativeAI } from "@google/generative-ai";
import { Conversation, JudgeResult, JudgeScores } from "./types";

// Configuration for judge generation
const JUDGE_MAX_TOKENS = 2048; // High limit to prevent mid-JSON cutoff

const JUDGE_SYSTEM_PROMPT = `You are a strict evaluator for a word game. Your job is to evaluate a player's reply as the next message in TWO independent conversations.

CRITICAL RULES:
- Do not invent facts beyond what's in the transcripts
- Do not assume hidden intent or subtext
- Penalize vague replies that avoid answering both conversations
- Penalize non-sequiturs that don't follow naturally
- Reward replies that naturally fit BOTH conversation contexts
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
{
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
  playerReply: string
): string {
  return `${formatConversationForJudge(conversationA, "A")}

${formatConversationForJudge(conversationB, "B")}

=== Player's Reply (sent to BOTH conversations) ===
"${playerReply}"

Evaluate how well this single reply works as the next message in EACH conversation independently.`;
}

function parseJudgeResponse(response: string): JudgeResult | null {
  try {
    // Try to extract JSON from the response
    let jsonStr = response;

    // Look for JSON in code blocks
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
      // Look for raw JSON object
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
    }

    const parsed = JSON.parse(jsonStr);

    // Validate structure
    if (!parsed.A || !parsed.B) {
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

    // Clamp scores to 0-10
    const clampScore = (s: JudgeScores): JudgeScores => ({
      coherence: Math.max(0, Math.min(10, Math.round(s.coherence))),
      relevance: Math.max(0, Math.min(10, Math.round(s.relevance))),
      tone_match: Math.max(0, Math.min(10, Math.round(s.tone_match))),
      directness: Math.max(0, Math.min(10, Math.round(s.directness))),
      contradiction: s.contradiction,
      unsafe: s.unsafe,
      notes: s.notes.slice(0, 3), // Limit notes
    });

    return {
      A: clampScore(parsed.A),
      B: clampScore(parsed.B),
    };
  } catch {
    return null;
  }
}

export async function judgeReply(
  conversationA: Conversation,
  conversationB: Conversation,
  playerReply: string,
  apiKey: string,
  maxRetries = 3
): Promise<JudgeResult> {
  // #region agent log
  fetch("http://127.0.0.1:7251/ingest/2405a2e0-c532-44ac-bf01-d6cd188340ac", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "judge.ts:judgeReply-entry",
      message: "judgeReply called",
      data: {
        hasApiKey: !!apiKey,
        apiKeyLen: apiKey?.length,
        playerReplyLen: playerReply?.length,
        hasConvA: !!conversationA,
        hasConvB: !!conversationB,
      },
      timestamp: Date.now(),
      sessionId: "debug-session",
      hypothesisId: "H1,H4",
    }),
  }).catch(() => {});
  // #endregion

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const prompt = buildJudgePrompt(conversationA, conversationB, playerReply);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // #region agent log
      fetch(
        "http://127.0.0.1:7251/ingest/2405a2e0-c532-44ac-bf01-d6cd188340ac",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "judge.ts:before-generateContent",
            message: "Calling Gemini API",
            data: { attempt: attempt + 1, promptLen: prompt.length },
            timestamp: Date.now(),
            sessionId: "debug-session",
            hypothesisId: "H3,H5",
          }),
        }
      ).catch(() => {});
      // #endregion

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: JUDGE_SYSTEM_PROMPT + "\n\n" + prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent judging
          maxOutputTokens: JUDGE_MAX_TOKENS,
        },
      });

      const response = result.response.text();
      console.log("response", response);

      // #region agent log
      fetch(
        "http://127.0.0.1:7251/ingest/2405a2e0-c532-44ac-bf01-d6cd188340ac",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "judge.ts:after-generateContent",
            message: "Gemini response received",
            data: {
              attempt: attempt + 1,
              responseLen: response?.length,
              responsePreview: response?.substring(0, 500),
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            hypothesisId: "H2,H3",
          }),
        }
      ).catch(() => {});
      // #endregion

      const parsed = parseJudgeResponse(response);

      // #region agent log
      fetch(
        "http://127.0.0.1:7251/ingest/2405a2e0-c532-44ac-bf01-d6cd188340ac",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "judge.ts:after-parse",
            message: "Parse result",
            data: {
              attempt: attempt + 1,
              parseSuccess: !!parsed,
              parsedKeys: parsed ? Object.keys(parsed) : null,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            hypothesisId: "H2",
          }),
        }
      ).catch(() => {});
      // #endregion

      if (parsed) {
        return parsed;
      }

      console.warn(`Judge parse failed on attempt ${attempt + 1}, retrying...`);
    } catch (error) {
      // #region agent log
      fetch(
        "http://127.0.0.1:7251/ingest/2405a2e0-c532-44ac-bf01-d6cd188340ac",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "judge.ts:catch-error",
            message: "Gemini API error caught",
            data: {
              attempt: attempt + 1,
              errorMessage: String(error),
              errorName: (error as Error)?.name,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            hypothesisId: "H1,H3",
          }),
        }
      ).catch(() => {});
      // #endregion
      console.error(`Judge API error on attempt ${attempt + 1}:`, error);
    }
  }

  // #region agent log
  fetch("http://127.0.0.1:7251/ingest/2405a2e0-c532-44ac-bf01-d6cd188340ac", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "judge.ts:all-retries-failed",
      message: "All retries exhausted, returning neutral",
      data: { maxRetries },
      timestamp: Date.now(),
      sessionId: "debug-session",
      hypothesisId: "H5",
    }),
  }).catch(() => {});
  // #endregion

  // Fallback: return neutral scores if all retries fail
  console.error("All judge retries failed, returning neutral scores");
  return {
    A: {
      coherence: 5,
      relevance: 5,
      tone_match: 5,
      directness: 5,
      contradiction: false,
      unsafe: false,
      notes: ["Evaluation failed - neutral score applied"],
    },
    B: {
      coherence: 5,
      relevance: 5,
      tone_match: 5,
      directness: 5,
      contradiction: false,
      unsafe: false,
      notes: ["Evaluation failed - neutral score applied"],
    },
  };
}
