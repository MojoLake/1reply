import { NextRequest, NextResponse } from "next/server";
import { generateAllContinuations } from "@/lib/conversation";
import { Conversation } from "@/lib/types";
import { checkRateLimit } from "@/lib/rateLimit";

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
    const { conversationA, conversationB, conversationC } = body as {
      conversationA: Conversation;
      conversationB: Conversation;
      conversationC?: Conversation;
    };

    if (!conversationA || !conversationB) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await generateAllContinuations(
      conversationA,
      conversationB,
      apiKey,
      conversationC
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
