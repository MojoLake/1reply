import { NextRequest, NextResponse } from "next/server";
import { selectSituationPair, getDifficultyForRound, getDailySituations } from "@/lib/rounds";
import { Difficulty } from "@/lib/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const roundParam = searchParams.get("round");
  const modeParam = searchParams.get("mode");
  const usedIdsParam = searchParams.get("usedIds");

  const round = roundParam ? parseInt(roundParam, 10) : 1;
  const mode = modeParam || "classic";
  const usedIds = usedIdsParam ? usedIdsParam.split(",").filter(Boolean) : [];

  try {
    if (mode === "daily") {
      const dailyRounds = getDailySituations();
      const roundIndex = Math.min(round - 1, dailyRounds.length - 1);
      const roundData = dailyRounds[roundIndex];

      if (!roundData) {
        return NextResponse.json(
          { error: "No more daily rounds available" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        situationA: roundData.situationA,
        situationB: roundData.situationB,
        difficulty: roundData.difficulty,
        round,
        totalDailyRounds: dailyRounds.length,
      });
    }

    // For other modes, use difficulty scaling
    const difficulty: Difficulty = getDifficultyForRound(round);
    const roundData = selectSituationPair(difficulty, usedIds);

    return NextResponse.json({
      situationA: roundData.situationA,
      situationB: roundData.situationB,
      difficulty: roundData.difficulty,
      round,
    });
  } catch (error) {
    console.error("Error generating round:", error);
    return NextResponse.json(
      { error: "Failed to generate round" },
      { status: 500 }
    );
  }
}

