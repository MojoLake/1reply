import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import { ConversationSituation } from "@/lib/types";
import { moderateMessages } from "@/lib/moderation";
import {
  CREATE_TITLE_MAX_LENGTH,
  CREATE_NAME_MAX_LENGTH,
  CREATE_CONTEXT_MAX_LENGTH,
  CREATE_TOPIC_MAX_LENGTH,
  CREATE_TONE_MAX_LENGTH,
  CREATE_INTENT_MAX_LENGTH,
  CREATE_FACT_MAX_LENGTH,
  CREATE_MESSAGE_MAX_LENGTH,
  CREATE_MAX_FACTS,
  CREATE_MAX_MESSAGES,
} from "@/lib/constants";

// Validate a situation object has all required fields and enforce length limits
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

  // Validate and limit transcript messages count
  if (s.initialTranscript.length > CREATE_MAX_MESSAGES) {
    console.error(`Invalid ${label}: too many messages (max ${CREATE_MAX_MESSAGES})`);
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

  // Limit facts count
  if (s.facts.length > CREATE_MAX_FACTS) {
    console.error(`Invalid ${label}: too many facts (max ${CREATE_MAX_FACTS})`);
    return null;
  }

  // Truncate all fields to their max lengths
  const personName = (s.personName as string).trim().slice(0, CREATE_NAME_MAX_LENGTH);
  const personContext = (s.personContext as string).trim().slice(0, CREATE_CONTEXT_MAX_LENGTH);
  const topic = (s.topic as string).trim().slice(0, CREATE_TOPIC_MAX_LENGTH);
  const tone = (s.tone as string).trim().slice(0, CREATE_TONE_MAX_LENGTH);
  const intent = (s.intent as string).trim().slice(0, CREATE_INTENT_MAX_LENGTH);
  const facts = (s.facts as string[])
    .filter((f) => f.trim())
    .slice(0, CREATE_MAX_FACTS)
    .map((f) => f.trim().slice(0, CREATE_FACT_MAX_LENGTH));
  const transcript = (s.initialTranscript as Array<{ role: "them"; text: string }>)
    .slice(0, CREATE_MAX_MESSAGES)
    .map((m) => ({ role: m.role, text: m.text.trim().slice(0, CREATE_MESSAGE_MAX_LENGTH) }));

  return {
    id: `user-${nanoid(8)}`,
    topic,
    tone,
    intent,
    personName,
    personContext,
    facts,
    initialTranscript: transcript,
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
    const { title, situationA, situationB, situationC } = body;

    // Validate title
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Truncate title to max length
    const trimmedTitle = title.trim().slice(0, CREATE_TITLE_MAX_LENGTH);

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

    // Content moderation - collect all text and check against blocklist
    const allText = [
      trimmedTitle,
      validatedA.personName,
      validatedA.personContext,
      validatedA.topic,
      validatedA.tone,
      validatedA.intent,
      ...validatedA.facts,
      ...validatedA.initialTranscript.map((m) => m.text),
      validatedB.personName,
      validatedB.personContext,
      validatedB.topic,
      validatedB.tone,
      validatedB.intent,
      ...validatedB.facts,
      ...validatedB.initialTranscript.map((m) => m.text),
    ];

    if (validatedC) {
      allText.push(
        validatedC.personName,
        validatedC.personContext,
        validatedC.topic,
        validatedC.tone,
        validatedC.intent,
        ...validatedC.facts,
        ...validatedC.initialTranscript.map((m) => m.text)
      );
    }

    const moderationResult = moderateMessages(allText);

    if (!moderationResult.approved) {
      return NextResponse.json(
        {
          error: "Content not allowed",
          reason: moderationResult.reason || "This content violates our guidelines",
        },
        { status: 400 }
      );
    }

    // Generate unique share code
    const shareCode = nanoid(8);

    // Insert into database
    const { data, error } = await supabase
      .from("user_scenarios")
      .insert({
        author_id: user.id,
        share_code: shareCode,
        title: trimmedTitle,
        difficulty: "medium", // Default difficulty for user-created scenarios
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
