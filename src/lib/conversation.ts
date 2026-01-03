import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  Conversation,
  ContinuationResult,
  ContinuationResponse,
} from "./types";

// Configuration for continuation generation
const CONTINUATION_MAX_TOKENS = 1024; // Increased buffer to prevent mid-sentence cutoff

const CONTINUATION_SYSTEM_PROMPT = `You are roleplaying as a person in a text conversation. Your job is to respond naturally to the last message, staying in character.

RULES:
- Respond as the character would, based on their personality and the conversation context
- Keep it brief - 1-2 short sentences max, like real texting
- Match the tone of the conversation (casual, formal, excited, etc.)
- Do NOT break character or acknowledge you are an AI
- Do NOT evaluate or judge the quality of their message
- Do NOT say things like "That makes sense" or "I understand" unless it genuinely fits
- Respond to what they actually said, as a real person would
- If they ask a question, answer it naturally
- If they make a statement, react naturally to it
- ALWAYS write complete sentences - never stop mid-thought or mid-sentence

CONVERSATION ENDING DETECTION:
A conversation is "ending" if your response is a natural conclusion like:
- Goodbyes: "See you!", "Talk later!", "Bye!"
- Sign-offs: "Have a great day!", "Take care!"
- Closing acknowledgments: "Thanks, will do!", "Perfect, see you then!"
- Scheduling confirmations that close the topic: "Sounds good, 3pm it is!"

OUTPUT: Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{"response": "<your message>", "isEnding": <true/false>}`;

function formatConversationForContinuation(conversation: Conversation): string {
  const lines: string[] = [];
  lines.push(`You are: ${conversation.situation.personName}`);
  lines.push(`Your relationship: ${conversation.situation.personContext}`);
  lines.push(`Conversation tone: ${conversation.situation.tone}`);
  lines.push(
    `Your intent in this conversation: ${conversation.situation.intent}`
  );
  lines.push(`Relevant facts: ${conversation.situation.facts.join("; ")}`);
  lines.push(`\nConversation so far:`);

  for (const msg of conversation.transcript) {
    const speaker = msg.role === "them" ? "You" : "Them";
    lines.push(`${speaker}: ${msg.text}`);
  }

  return lines.join("\n");
}

function parseContinuationResponse(
  rawResponse: string
): ContinuationResult | null {
  try {
    // Try to extract JSON from the response
    let jsonStr = rawResponse.trim();

    // Look for JSON in code blocks
    const codeBlockMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
      // Look for raw JSON object
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
    }

    const parsed = JSON.parse(jsonStr);

    if (typeof parsed.response === "string" && parsed.response.length > 0) {
      return {
        response: parsed.response,
        isEnding: Boolean(parsed.isEnding),
      };
    }

    return null;
  } catch {
    // If JSON parsing fails, try to use the raw response as plain text
    const cleaned = rawResponse.trim();
    if (cleaned.length > 0 && !cleaned.startsWith("{")) {
      return {
        response: cleaned,
        isEnding: false, // Can't determine, default to false
      };
    }
    return null;
  }
}

export async function generateContinuation(
  conversation: Conversation,
  apiKey: string,
  maxRetries = 2
): Promise<ContinuationResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const context = formatConversationForContinuation(conversation);
  const prompt = `${CONTINUATION_SYSTEM_PROMPT}\n\n${context}\n\nRespond as ${conversation.situation.personName}:`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7, // Higher for natural variation
          maxOutputTokens: CONTINUATION_MAX_TOKENS,
        },
      });

      const rawResponse = result.response.text().trim();
      const parsed = parseContinuationResponse(rawResponse);

      if (parsed) {
        // Clean up response - remove quotes if the model wrapped it
        let cleaned = parsed.response;
        if (
          (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
          (cleaned.startsWith("'") && cleaned.endsWith("'"))
        ) {
          cleaned = cleaned.slice(1, -1);
        }

        // Remove any "Name:" prefix if model included it
        const namePrefix = `${conversation.situation.personName}:`;
        if (cleaned.startsWith(namePrefix)) {
          cleaned = cleaned.slice(namePrefix.length).trim();
        }

        if (cleaned.length > 0) {
          return {
            response: cleaned,
            isEnding: parsed.isEnding,
          };
        }
      }
    } catch (error) {
      console.error(`Continuation error on attempt ${attempt + 1}:`, error);
    }
  }

  // Fallback: return a simple acknowledgment based on tone
  const fallbacks: Record<string, string[]> = {
    excited: ["Oh nice!", "That's great!", "Awesome!"],
    stressed: ["Okay...", "Alright", "Got it"],
    casual: ["Cool", "Nice", "Okay"],
    formal: ["Thank you", "I appreciate that", "Understood"],
    flirty: ["Haha okay", "Fair enough 😊", "Interesting"],
    concerned: ["I see", "Okay", "Alright"],
    serious: ["I understand", "Okay", "Alright"],
    playful: ["Haha nice", "Okay okay", "Alright then"],
  };

  const options = fallbacks[conversation.situation.tone] || fallbacks.casual;
  return {
    response: options[Math.floor(Math.random() * options.length)],
    isEnding: false,
  };
}

async function generateBothContinuations(
  conversationA: Conversation,
  conversationB: Conversation,
  apiKey: string
): Promise<ContinuationResponse> {
  // Generate both continuations in parallel
  const [resultA, resultB] = await Promise.all([
    generateContinuation(conversationA, apiKey),
    generateContinuation(conversationB, apiKey),
  ]);

  return {
    responseA: resultA.response,
    responseB: resultB.response,
    endingA: resultA.isEnding,
    endingB: resultB.isEnding,
  };
}

export async function generateAllContinuations(
  conversationA: Conversation,
  conversationB: Conversation,
  apiKey: string,
  conversationC?: Conversation
): Promise<ContinuationResponse> {
  if (conversationC) {
    // Generate all three continuations in parallel for extreme mode
    const [resultA, resultB, resultC] = await Promise.all([
      generateContinuation(conversationA, apiKey),
      generateContinuation(conversationB, apiKey),
      generateContinuation(conversationC, apiKey),
    ]);

    return {
      responseA: resultA.response,
      responseB: resultB.response,
      responseC: resultC.response,
      endingA: resultA.isEnding,
      endingB: resultB.isEnding,
      endingC: resultC.isEnding,
    };
  }

  // Fall back to two conversations
  return generateBothContinuations(conversationA, conversationB, apiKey);
}
