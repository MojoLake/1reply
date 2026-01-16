import { NextRequest, NextResponse } from "next/server";
import { judgeReply } from "@/lib/judge";
import { calculateConfusionDelta, clampConfusion } from "@/lib/confusion";
import { calculateRoundScore } from "@/lib/scoring";
import { Conversation, RoundResult } from "@/lib/types";
import { checkRateLimit } from "@/lib/rateLimit";
import { moderateMessages } from "@/lib/moderation";
import { MAX_REPLY_LENGTH, MAX_CONFUSION, JUDGE_MAX_RETRIES } from "@/lib/constants";

export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const ip = request.headers.get("x-forwarded-for") || "anonymous";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a moment." },
      { status: 429 }
    );
  }

  // Get API key from environment
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const {
      conversationA,
      conversationB,
      conversationC,
      playerReply,
      currentConfusionA,
      currentConfusionB,
      currentConfusionC,
      roundNumber,
    } = body as {
      conversationA: Conversation;
      conversationB: Conversation;
      conversationC?: Conversation;
      playerReply: string;
      currentConfusionA: number;
      currentConfusionB: number;
      currentConfusionC?: number;
      roundNumber: number;
    };

    const isExtremeMode = !!conversationC;

    // Validate input
    if (!conversationA || !conversationB || !playerReply) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (playerReply.length < 1 || playerReply.length > MAX_REPLY_LENGTH) {
      return NextResponse.json(
        { error: `Reply must be between 1 and ${MAX_REPLY_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Moderate user content before sending to LLM
    const moderationResult = moderateMessages([playerReply]);
    if (!moderationResult.approved) {
      return NextResponse.json(
        { error: "Your message contains inappropriate content" },
        { status: 400 }
      );
    }

    // Judge the reply (with optional third conversation for extreme mode)
    const evaluation = await judgeReply(
      conversationA,
      conversationB,
      playerReply,
      apiKey,
      JUDGE_MAX_RETRIES,
      conversationC
    );

    // Calculate confusion deltas deterministically
    const deltaA = calculateConfusionDelta(evaluation.A);
    const deltaB = calculateConfusionDelta(evaluation.B);
    const deltaC = isExtremeMode && evaluation.C ? calculateConfusionDelta(evaluation.C) : undefined;

    // Calculate new confusion levels
    const newConfusionA = clampConfusion(currentConfusionA + deltaA);
    const newConfusionB = clampConfusion(currentConfusionB + deltaB);
    const newConfusionC = isExtremeMode && deltaC !== undefined && currentConfusionC !== undefined
      ? clampConfusion(currentConfusionC + deltaC)
      : undefined;

    // Check for game over
    let gameOver = newConfusionA >= MAX_CONFUSION || newConfusionB >= MAX_CONFUSION;
    let gameOverReason: "A" | "B" | "C" | undefined = newConfusionA >= MAX_CONFUSION ? "A" : newConfusionB >= MAX_CONFUSION ? "B" : undefined;
    
    if (isExtremeMode && newConfusionC !== undefined && newConfusionC >= MAX_CONFUSION) {
      gameOver = true;
      if (!gameOverReason) gameOverReason = "C";
    }

    // Calculate score
    const scoreGained = gameOver ? 0 : calculateRoundScore(evaluation, roundNumber);

    const result: RoundResult = {
      evaluation,
      confusionDelta: { A: deltaA, B: deltaB, C: deltaC },
      scoreGained,
      newConfusionA,
      newConfusionB,
      newConfusionC,
      gameOver,
      gameOverReason,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Judge error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate reply" },
      { status: 500 }
    );
  }
}
