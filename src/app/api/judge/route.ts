import { NextRequest, NextResponse } from "next/server";
import { judgeReply } from "@/lib/judge";
import { calculateConfusionDelta, clampConfusion } from "@/lib/confusion";
import { calculateRoundScore } from "@/lib/scoring";
import { Conversation, RoundResult } from "@/lib/types";

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

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
  // #region agent log
  fetch('http://127.0.0.1:7251/ingest/2405a2e0-c532-44ac-bf01-d6cd188340ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:judge-apikey-check',message:'API key check',data:{hasApiKey:!!apiKey,apiKeyLen:apiKey?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
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
      playerReply,
      currentConfusionA,
      currentConfusionB,
      roundNumber,
    } = body as {
      conversationA: Conversation;
      conversationB: Conversation;
      playerReply: string;
      currentConfusionA: number;
      currentConfusionB: number;
      roundNumber: number;
    };

    // Validate input
    if (!conversationA || !conversationB || !playerReply) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (playerReply.length < 1 || playerReply.length > 500) {
      return NextResponse.json(
        { error: "Reply must be between 1 and 500 characters" },
        { status: 400 }
      );
    }

    // Judge the reply
    const evaluation = await judgeReply(
      conversationA,
      conversationB,
      playerReply,
      apiKey
    );

    // Calculate confusion deltas deterministically
    const deltaA = calculateConfusionDelta(evaluation.A);
    const deltaB = calculateConfusionDelta(evaluation.B);

    // Calculate new confusion levels
    const newConfusionA = clampConfusion(currentConfusionA + deltaA);
    const newConfusionB = clampConfusion(currentConfusionB + deltaB);

    // Check for game over
    const gameOver = newConfusionA >= 5 || newConfusionB >= 5;
    const gameOverReason = newConfusionA >= 5 ? "A" : newConfusionB >= 5 ? "B" : undefined;

    // Calculate score
    const scoreGained = gameOver ? 0 : calculateRoundScore(evaluation, roundNumber);

    const result: RoundResult = {
      evaluation,
      confusionDelta: { A: deltaA, B: deltaB },
      scoreGained,
      newConfusionA,
      newConfusionB,
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

