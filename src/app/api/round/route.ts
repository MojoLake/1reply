import { NextRequest, NextResponse } from "next/server";
import { selectSituationPair, getDifficultyForRound, getDailyInitialPair, selectSingleSituation } from "@/lib/rounds";
import { Difficulty } from "@/lib/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const roundParam = searchParams.get("round");
  const modeParam = searchParams.get("mode");
  const usedIdsParam = searchParams.get("usedIds");
  const singleParam = searchParams.get("single");

  const round = roundParam ? parseInt(roundParam, 10) : 1;
  const mode = modeParam || "classic";
  const usedIds = usedIdsParam ? usedIdsParam.split(",").filter(Boolean) : [];
  const fetchSingle = singleParam === "true";

  try {
    // Handle single situation fetch (for conversation swapping)
    if (fetchSingle) {
      const difficulty: Difficulty = getDifficultyForRound(round);
      const situation = selectSingleSituation(difficulty, usedIds);
      
      if (!situation) {
        return NextResponse.json(
          { error: "No more situations available" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        situationA: situation,
        situationB: situation, // Return same for both (only situationA will be used)
        difficulty,
        round,
      });
    }

    // Daily mode: use seeded initial pair for round 1, then standard difficulty scaling
    if (mode === "daily" && round === 1) {
      const roundData = getDailyInitialPair();

      return NextResponse.json({
        situationA: roundData.situationA,
        situationB: roundData.situationB,
        difficulty: roundData.difficulty,
        round,
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

