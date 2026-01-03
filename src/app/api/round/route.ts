import { NextRequest, NextResponse } from "next/server";
import { selectSituationPair, getDailyInitialPair, selectSingleSituation } from "@/lib/rounds";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const modeParam = searchParams.get("mode");
  const usedIdsParam = searchParams.get("usedIds");
  const singleParam = searchParams.get("single");

  const mode = modeParam || "classic";
  const usedIds = usedIdsParam ? usedIdsParam.split(",").filter(Boolean) : [];
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
        situationA: situation,
        situationB: situation, // Return same for both (only situationA will be used)
      });
    }

    // Daily mode: use seeded initial pair
    if (mode === "daily") {
      const roundData = getDailyInitialPair();

      return NextResponse.json({
        situationA: roundData.situationA,
        situationB: roundData.situationB,
      });
    }

    // For other modes, pick a random pair
    const roundData = selectSituationPair(usedIds);

    return NextResponse.json({
      situationA: roundData.situationA,
      situationB: roundData.situationB,
    });
  } catch (error) {
    console.error("Error generating round:", error);
    return NextResponse.json(
      { error: "Failed to generate round" },
      { status: 500 }
    );
  }
}
