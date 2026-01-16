import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SaveScoreRequestSchema, validateRequest } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required to save scores" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate request body with Zod
    const validation = validateRequest(SaveScoreRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { mode, score, roundsSurvived, scenarioId } = validation.data;

    // Insert score
    const { data, error } = await supabase
      .from("user_scores")
      .insert({
        user_id: user.id,
        mode,
        score,
        rounds_survived: roundsSurvived,
        scenario_id: scenarioId || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to save score" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error("Error saving score:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - fetch user's scores or leaderboard
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const leaderboard = searchParams.get("leaderboard") === "true";

    if (leaderboard && mode) {
      // Fetch top scores for a mode (public leaderboard)
      const { data, error } = await supabase
        .from("user_scores")
        .select(`
          id,
          score,
          rounds_survived,
          played_at,
          profiles!inner (display_name)
        `)
        .eq("mode", mode)
        .order("score", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Database error:", error);
        return NextResponse.json(
          { error: "Failed to fetch leaderboard" },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    }

    // Otherwise fetch user's own scores (requires auth)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    let query = supabase
      .from("user_scores")
      .select("id, mode, score, rounds_survived, scenario_id, played_at")
      .eq("user_id", user.id)
      .order("played_at", { ascending: false })
      .limit(limit);

    if (mode) {
      query = query.eq("mode", mode);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch scores" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching scores:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
