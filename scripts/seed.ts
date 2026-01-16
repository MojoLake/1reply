/**
 * Seed script for populating Supabase with test data
 *
 * Run with: npm run seed (or yarn seed)
 *
 * Prerequisites:
 * 1. Set SUPABASE_SERVICE_ROLE_KEY in your .env.local (from Supabase dashboard)
 * 2. Have the database schema already applied
 */

import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

// Safety check: refuse to run in production
if (process.env.NODE_ENV === "production") {
  console.error("❌ Refusing to seed production database!");
  process.exit(1);
}

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error(
    "   SUPABASE_SERVICE_ROLE_KEY:",
    supabaseServiceKey ? "✓" : "✗"
  );
  console.error("\nMake sure these are set in your .env.local file");
  process.exit(1);
}

// Create admin client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test user data
const TEST_USER = {
  email: "test@1.co",
  password: "42",
  displayName: "Test Player",
};

// Sample scenarios to seed
const SAMPLE_SCENARIOS = [
  {
    title: "Office Chaos",
    difficulty: "medium",
    situation_a: {
      id: "seed-boss-meeting",
      topic: "work",
      tone: "formal",
      intent: "scheduling",
      personName: "Mr. Henderson",
      personContext: "Your demanding boss at the tech company",
      facts: [
        "There's an important client meeting tomorrow",
        "The player missed the last team meeting",
      ],
      initialTranscript: [
        { role: "them", text: "We need to discuss the Q4 projections." },
        { role: "them", text: "Are you available for a call this afternoon?" },
      ],
      difficultyTags: ["medium"],
    },
    situation_b: {
      id: "seed-friend-hangout",
      topic: "social",
      tone: "casual",
      intent: "making_plans",
      personName: "Jake",
      personContext: "Your best friend since high school",
      facts: [
        "Jake just got dumped last week",
        "You promised to hang out this week",
      ],
      initialTranscript: [
        { role: "them", text: "yo dude you free later?" },
        { role: "them", text: "really need to talk about stuff" },
      ],
      difficultyTags: ["easy"],
    },
  },
  {
    title: "Family Drama",
    difficulty: "hard",
    situation_a: {
      id: "seed-mom-call",
      topic: "family",
      tone: "concerned",
      intent: "checking_in",
      personName: "Mom",
      personContext: "Your mother who worries about everything",
      facts: [
        "You haven't called in 2 weeks",
        "Your cousin's wedding is coming up",
        "Mom heard you might be dating someone new",
      ],
      initialTranscript: [
        { role: "them", text: "Sweetheart, are you alive?? 😢" },
        { role: "them", text: "Your aunt keeps asking about you" },
      ],
      difficultyTags: ["medium"],
    },
    situation_b: {
      id: "seed-ex-text",
      topic: "relationship",
      tone: "serious",
      intent: "reconnecting",
      personName: "Alex",
      personContext: "Your ex from 6 months ago",
      facts: [
        "You dated for 2 years",
        "The breakup was mutual but messy",
        "Alex still has some of your stuff",
      ],
      initialTranscript: [
        { role: "them", text: "Hey... hope you're doing well" },
        { role: "them", text: "Found your old hoodie. Want it back?" },
      ],
      difficultyTags: ["hard"],
    },
  },
  {
    title: "Roommate Roulette",
    difficulty: "easy",
    situation_a: {
      id: "seed-roommate-chores",
      topic: "household",
      tone: "casual",
      intent: "reminder",
      personName: "Chris",
      personContext: "Your laid-back roommate",
      facts: [
        "It's Chris's turn to buy toilet paper",
        "The dishes have been piling up",
      ],
      initialTranscript: [
        { role: "them", text: "hey did you eat my leftover pizza" },
        { role: "them", text: "also the wifi is being weird again" },
      ],
      difficultyTags: ["easy"],
    },
    situation_b: {
      id: "seed-landlord-issue",
      topic: "housing",
      tone: "formal",
      intent: "complaint",
      personName: "Mr. Park",
      personContext: "Your strict landlord",
      facts: ["Rent is due next week", "The heater has been broken for 3 days"],
      initialTranscript: [
        {
          role: "them",
          text: "Hello, this is regarding the maintenance request.",
        },
        {
          role: "them",
          text: "When would be a good time to send someone over?",
        },
      ],
      difficultyTags: ["medium"],
    },
  },
];

async function seed() {
  console.log("🌱 Starting seed process...\n");

  // Step 1: Create test user
  console.log("👤 Creating test user...");

  // First, check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u: { email?: string }) => u.email === TEST_USER.email
  );

  let userId: string;

  if (existingUser) {
    console.log("   User already exists, using existing user");
    userId = existingUser.id;
  } else {
    const { data: newUser, error: userError } =
      await supabase.auth.admin.createUser({
        email: TEST_USER.email,
        password: TEST_USER.password,
        email_confirm: true,
        user_metadata: {
          full_name: TEST_USER.displayName,
        },
      });

    if (userError) {
      console.error("❌ Failed to create test user:", userError.message);
      process.exit(1);
    }

    userId = newUser.user.id;
    console.log("   ✓ Created user:", TEST_USER.email);
  }

  // Step 2: Ensure profile exists (should be auto-created by trigger, but let's be safe)
  console.log("\n📋 Checking profile...");
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  if (!profile) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      display_name: TEST_USER.displayName,
    });

    if (profileError) {
      console.error("❌ Failed to create profile:", profileError.message);
    } else {
      console.log("   ✓ Created profile");
    }
  } else {
    console.log("   Profile already exists");
  }

  // Step 3: Create sample scenarios
  console.log("\n🎮 Creating sample scenarios...");

  for (const scenario of SAMPLE_SCENARIOS) {
    const shareCode = nanoid(8);

    const { data, error } = await supabase
      .from("user_scenarios")
      .insert({
        author_id: userId,
        share_code: shareCode,
        title: scenario.title,
        difficulty: scenario.difficulty,
        situation_a: scenario.situation_a,
        situation_b: scenario.situation_b,
      })
      .select("id, share_code")
      .single();

    if (error) {
      // Check if it's a duplicate
      if (error.code === "23505") {
        console.log(
          `   ⚠ Scenario "${scenario.title}" already exists, skipping`
        );
      } else {
        console.error(
          `   ❌ Failed to create "${scenario.title}":`,
          error.message
        );
      }
    } else {
      console.log(
        `   ✓ Created "${scenario.title}" → /play/${data.share_code}`
      );
    }
  }

  // Step 4: Create some sample scores
  console.log("\n🏆 Creating sample scores...");

  const sampleScores = [
    { mode: "classic", score: 1250, rounds_survived: 8 },
    { mode: "classic", score: 2100, rounds_survived: 14 },
    { mode: "timer", score: 890, rounds_survived: 6 },
    { mode: "extreme", score: 3200, rounds_survived: 11 },
  ];

  for (const scoreData of sampleScores) {
    const { error } = await supabase.from("user_scores").insert({
      user_id: userId,
      ...scoreData,
    });

    if (error) {
      console.error(`   ❌ Failed to create score:`, error.message);
    } else {
      console.log(
        `   ✓ Added ${scoreData.mode} score: ${scoreData.score} pts (${scoreData.rounds_survived} rounds)`
      );
    }
  }

  console.log("\n✅ Seed completed!\n");
  console.log("Test account credentials:");
  console.log(`   Email: ${TEST_USER.email}`);
  console.log(`   Password: ${TEST_USER.password}`);
  console.log("\nYou can now sign in with these credentials to test the app.");
}

seed().catch(console.error);
