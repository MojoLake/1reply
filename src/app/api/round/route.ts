import { NextRequest, NextResponse } from "next/server";
import { selectSituationPair, getDailyInitialPair, selectSingleSituation } from "@/lib/rounds";
import { RoundQuerySchema, validateRequest } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Validate query parameters with Zod
  const validation = validateRequest(RoundQuerySchema, {
    mode: searchParams.get("mode") ?? undefined,
    usedIds: searchParams.get("usedIds") ?? undefined,
    usedPairIds: searchParams.get("usedPairIds") ?? undefined,
    single: searchParams.get("single") ?? undefined,
  });

  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { mode, usedIds: usedIdsStr, usedPairIds: usedPairIdsStr, single: fetchSingle } = validation.data;
  const usedIds = usedIdsStr ? usedIdsStr.split(",").filter(Boolean) : [];
  const usedPairIds = usedPairIdsStr ? usedPairIdsStr.split(",").filter(Boolean) : [];

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
