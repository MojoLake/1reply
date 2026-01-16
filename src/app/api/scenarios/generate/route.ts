import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractJsonFromResponse } from "@/lib/parseJson";
import {
  GEMINI_MODEL,
  GENERATION_TEMPERATURE,
  GENERATION_MAX_TOKENS,
  GENERATION_MAX_RETRIES,
} from "@/lib/constants";

export interface GeneratedFields {
  personName: string;
  personContext: string;
  topic: string;
  tone: string;
  intent: string;
  facts: string[];
}

const GENERATION_SYSTEM_PROMPT = `You are helping create content for a word puzzle game called "1Reply" where players craft a single reply that works for two simultaneous text conversations.

Given a set of opening messages from one conversation, infer the context and generate the missing fields.

RULES:
- personName: The sender's first name (invent a realistic one if not obvious)
- personContext: A brief description of who they are to the player (e.g., "Your coworker", "Your friend from college")
- topic: The general category (e.g., "work", "friendship", "dating", "family", "social", "health")
- tone: How the messages feel (e.g., "casual", "formal", "excited", "stressed", "flirty", "sarcastic", "passive-aggressive")
- intent: What the person wants (e.g., "making_plans", "venting", "asking_favor", "sharing_news", "checking_in")
- facts: 2-3 relevant facts about the situation, referring to the recipient as "the player"

Be creative but realistic. The fields should match the vibe of the messages.

OUTPUT: Return ONLY valid JSON:
{
  "personName": "string",
  "personContext": "string",
  "topic": "string",
  "tone": "string",
  "intent": "string",
  "facts": ["fact1", "fact2"]
}`;

function buildGenerationPrompt(messages: string[]): string {
  return `Opening messages from the conversation:
${messages.map((m, i) => `${i + 1}. "${m}"`).join("\n")}

Based on these messages, generate the context fields for this conversation.`;
}

function parseGenerationResponse(response: string): GeneratedFields | null {
  try {
    const jsonStr = extractJsonFromResponse(response);
    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (
      typeof parsed.personName === "string" &&
      typeof parsed.personContext === "string" &&
      typeof parsed.topic === "string" &&
      typeof parsed.tone === "string" &&
      typeof parsed.intent === "string" &&
      Array.isArray(parsed.facts)
    ) {
      return {
        personName: parsed.personName.trim(),
        personContext: parsed.personContext.trim(),
        topic: parsed.topic.trim(),
        tone: parsed.tone.trim(),
        intent: parsed.intent.trim(),
        facts: parsed.facts.map((f: unknown) => String(f).trim()).filter((f: string) => f),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body;

    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "At least one message is required" },
        { status: 400 }
      );
    }

    // Filter and validate messages
    const validMessages = messages
      .filter((m): m is string => typeof m === "string" && m.trim().length > 0)
      .map((m) => m.trim());

    if (validMessages.length === 0) {
      return NextResponse.json(
        { error: "At least one non-empty message is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not configured");
      return NextResponse.json(
        { error: "API not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = buildGenerationPrompt(validMessages);

    for (let attempt = 0; attempt < GENERATION_MAX_RETRIES; attempt++) {
      try {
        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: GENERATION_SYSTEM_PROMPT + "\n\n" + prompt }],
            },
          ],
          generationConfig: {
            temperature: GENERATION_TEMPERATURE,
            maxOutputTokens: GENERATION_MAX_TOKENS,
          },
        });

        const response = result.response.text();
        const parsed = parseGenerationResponse(response);

        if (parsed) {
          return NextResponse.json(parsed);
        }

        console.warn(`Generation parse failed on attempt ${attempt + 1}, retrying...`);
      } catch (error) {
        console.error(`Generation API error on attempt ${attempt + 1}:`, error);
      }
    }

    // Fallback: return reasonable defaults
    return NextResponse.json({
      personName: "Alex",
      personContext: "Someone you know",
      topic: "general",
      tone: "casual",
      intent: "chatting",
      facts: ["The player is in a conversation"],
    });
  } catch (error) {
    console.error("Error generating fields:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
