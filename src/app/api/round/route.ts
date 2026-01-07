import { NextRequest, NextResponse } from "next/server";
import { selectSituationPair, getDailyInitialPair, selectSingleSituation } from "@/lib/rounds";
import { GameMode } from "@/lib/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const modeParam = searchParams.get("mode");
  const usedIdsParam = searchParams.get("usedIds");
  const usedPairIdsParam = searchParams.get("usedPairIds");
  const singleParam = searchParams.get("single");

  const mode = (modeParam || "classic") as GameMode;
  const usedIds = usedIdsParam ? usedIdsParam.split(",").filter(Boolean) : [];
  const usedPairIds = usedPairIdsParam ? usedPairIdsParam.split(",").filter(Boolean) : [];
  const fetchSingle = singleParam === "true";

  try {
    // Handle single situation fetch (for conversation swapping)
    if (fetchSingle) {
      const situation = selectSingleSituation(usedIds);
      
      if (!situation) {
        return NextResponse.json(
          { error: "No more situations available" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        pairId: null,
        situationA: situation,
        situationB: situation, // Return same for both (only situationA will be used)
      });
    }

    // Daily mode: use seeded initial pair
    if (mode === "daily") {
      const roundData = getDailyInitialPair();

      return NextResponse.json({
        pairId: roundData.pairId,
        situationA: roundData.situationA,
        situationB: roundData.situationB,
        situationC: roundData.situationC,
      });
    }

    // For other modes, pick a curated pair
    const roundData = selectSituationPair(usedPairIds, mode);

    return NextResponse.json({
      pairId: roundData.pairId,
      situationA: roundData.situationA,
      situationB: roundData.situationB,
      situationC: roundData.situationC,
    });
  } catch (error) {
    console.error("Error generating round:", error);
    return NextResponse.json(
      { error: "Failed to generate round" },
      { status: 500 }
    );
  }
}
