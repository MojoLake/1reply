import { NextRequest, NextResponse } from "next/server";
import { generateBothContinuations } from "@/lib/conversation";
import { Conversation } from "@/lib/types";

// Simple in-memory rate limiting (shared concept with judge)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a moment." },
      { status: 429 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { conversationA, conversationB } = body as {
      conversationA: Conversation;
      conversationB: Conversation;
    };

    if (!conversationA || !conversationB) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await generateBothContinuations(
      conversationA,
      conversationB,
      apiKey
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Continue error:", error);
    return NextResponse.json(
      { error: "Failed to generate continuations" },
      { status: 500 }
    );
  }
}

