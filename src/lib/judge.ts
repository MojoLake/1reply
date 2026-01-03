import { GoogleGenerativeAI } from "@google/generative-ai";
import { Conversation, JudgeResult, JudgeScores } from "./types";

// Configuration for judge generation
const JUDGE_MAX_TOKENS = 4096; // High limit to prevent mid-JSON cutoff

const JUDGE_SYSTEM_PROMPT_2 = `You are a strict evaluator for a word game. Your job is to evaluate a player's reply as the next message in TWO independent conversations.

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

const JUDGE_SYSTEM_PROMPT_3 = `You are a strict evaluator for a word game. Your job is to evaluate a player's reply as the next message in THREE independent conversations simultaneously (EXTREME mode).

CRITICAL RULES:
- Do not invent facts beyond what's in the transcripts
- Do not assume hidden intent or subtext
- Penalize vague replies that avoid answering all three conversations
- Penalize non-sequiturs that don't follow naturally
- Reward replies that naturally fit ALL THREE conversation contexts
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
      notes: s.notes.slice(0, 3), // Limit notes
    });

    const result: JudgeResult =
      expectC && parsed.C
        ? {
            A: clampScore(parsed.A),
            B: clampScore(parsed.B),
            C: clampScore(parsed.C),
          }
        : {
            A: clampScore(parsed.A),
            B: clampScore(parsed.B),
          };

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
  maxRetries = 3,
  conversationC?: Conversation
): Promise<JudgeResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const isExtremeMode = !!conversationC;
  const systemPrompt = isExtremeMode
    ? JUDGE_SYSTEM_PROMPT_3
    : JUDGE_SYSTEM_PROMPT_2;
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
          temperature: 0.3, // Lower temperature for more consistent judging
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
    coherence: 5,
    relevance: 5,
    tone_match: 5,
    directness: 5,
    contradiction: false,
    unsafe: false,
    notes: ["Evaluation failed - neutral score applied"],
  };

  const result: JudgeResult = isExtremeMode
    ? {
        A: { ...neutralScore },
        B: { ...neutralScore },
        C: { ...neutralScore },
      }
    : {
        A: { ...neutralScore },
        B: { ...neutralScore },
      };

  return result;
}
