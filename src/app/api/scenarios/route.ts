import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import { ConversationSituation } from "@/lib/types";

// Validate a situation object has all required fields
function validateSituation(
  situation: unknown,
  label: string
): ConversationSituation | null {
  if (!situation || typeof situation !== "object") {
    return null;
  }

  const s = situation as Record<string, unknown>;

  // Check required string fields
  const requiredStrings = ["topic", "tone", "intent", "personName", "personContext"];
  for (const field of requiredStrings) {
    if (typeof s[field] !== "string" || !(s[field] as string).trim()) {
      console.error(`Invalid ${label}: missing or empty ${field}`);
      return null;
    }
  }

  // Check facts array
  if (!Array.isArray(s.facts)) {
    console.error(`Invalid ${label}: facts must be an array`);
    return null;
  }

  // Check initialTranscript array
  if (!Array.isArray(s.initialTranscript) || s.initialTranscript.length === 0) {
    console.error(`Invalid ${label}: initialTranscript must be a non-empty array`);
    return null;
  }

  // Validate transcript messages
  for (const msg of s.initialTranscript) {
    if (
      typeof msg !== "object" ||
      !msg ||
      (msg as Record<string, unknown>).role !== "them" ||
      typeof (msg as Record<string, unknown>).text !== "string"
    ) {
      console.error(`Invalid ${label}: invalid message in initialTranscript`);
      return null;
    }
  }

  // Valid tones
  const validTones = [
    "casual",
    "formal",
    "stressed",
    "flirty",
    "serious",
    "playful",
    "concerned",
    "excited",
  ];
  if (!validTones.includes(s.tone as string)) {
    console.error(`Invalid ${label}: invalid tone "${s.tone}"`);
    return null;
  }

  return {
    id: `user-${nanoid(8)}`,
    topic: (s.topic as string).trim(),
    tone: s.tone as ConversationSituation["tone"],
    intent: (s.intent as string).trim(),
    personName: (s.personName as string).trim(),
    personContext: (s.personContext as string).trim(),
    facts: (s.facts as string[]).filter((f) => f.trim()),
    initialTranscript: s.initialTranscript as ConversationSituation["initialTranscript"],
    difficultyTags: ["medium"], // User scenarios default to medium
  };
}

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
        { error: "Authentication required to create scenarios" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, difficulty, situationA, situationB, situationC } = body;

    // Validate title
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Validate difficulty
    const validDifficulties = ["easy", "medium", "hard"];
    if (!difficulty || !validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { error: "Valid difficulty (easy, medium, hard) is required" },
        { status: 400 }
      );
    }

    // Validate situations
    const validatedA = validateSituation(situationA, "situationA");
    const validatedB = validateSituation(situationB, "situationB");

    if (!validatedA || !validatedB) {
      return NextResponse.json(
        { error: "Invalid situation data. Both situationA and situationB are required with all fields." },
        { status: 400 }
      );
    }

    // Optional situationC for trios
    let validatedC = null;
    if (situationC) {
      validatedC = validateSituation(situationC, "situationC");
      if (!validatedC) {
        return NextResponse.json(
          { error: "Invalid situationC data" },
          { status: 400 }
        );
      }
    }

    // Generate unique share code
    const shareCode = nanoid(8);

    // Insert into database
    const { data, error } = await supabase
      .from("user_scenarios")
      .insert({
        author_id: user.id,
        share_code: shareCode,
        title: title.trim(),
        difficulty,
        situation_a: validatedA,
        situation_b: validatedB,
        situation_c: validatedC,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to save scenario" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id,
      shareCode: data.share_code,
      shareUrl: `/play/${data.share_code}`,
    });
  } catch (error) {
    console.error("Error creating scenario:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - fetch scenarios for the current user
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    // If code is provided, fetch that specific scenario (public)
    if (code) {
      const { data, error } = await supabase
        .from("user_scenarios")
        .select("*")
        .eq("share_code", code)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "Scenario not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(data);
    }

    // Otherwise, fetch user's own scenarios (requires auth)
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

    const { data, error } = await supabase
      .from("user_scenarios")
      .select("id, share_code, title, difficulty, play_count, created_at")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch scenarios" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching scenarios:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
