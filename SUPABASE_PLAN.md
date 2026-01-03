# Supabase Integration Plan

## Overview

Move conversation situations from hardcoded TypeScript (`src/data/situations.ts`) to a Supabase database. This enables:

- **Reusable content** — situations persist without LLM regeneration costs
- **Easy management** — add/edit via Supabase dashboard, no redeploy needed
- **Analytics** — track which situations work well
- **Scalability** — grow from 60 to 500+ situations over time
- **Batch generation** — use LLM to create situations in bulk, then reuse forever

---

## Database Schema

### `situations` table

```sql
CREATE TABLE situations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,  -- human-readable ID, e.g. "friend-checkin-1"
  
  -- Core fields (matching ConversationSituation type)
  topic TEXT NOT NULL,
  tone TEXT NOT NULL,  -- casual, formal, stressed, flirty, serious, playful, concerned, excited
  intent TEXT NOT NULL,
  person_name TEXT NOT NULL,
  person_context TEXT NOT NULL,
  facts JSONB NOT NULL,  -- ["fact1", "fact2"]
  initial_transcript JSONB NOT NULL,  -- [{role: "them", text: "..."}, ...]
  reply_length_min INT NOT NULL DEFAULT 10,
  reply_length_max INT NOT NULL DEFAULT 200,
  difficulty TEXT NOT NULL DEFAULT 'medium',  -- easy, medium, hard
  
  -- Management metadata
  is_active BOOLEAN DEFAULT true,        -- false = hidden from rotation
  is_curated BOOLEAN DEFAULT false,      -- true = human-reviewed
  source TEXT DEFAULT 'seed',            -- 'seed' | 'llm' | 'community'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Analytics (populated during gameplay)
  times_played INT DEFAULT 0,
  total_confusion_delta FLOAT DEFAULT 0,  -- sum of confusion changes
  avg_confusion_delta FLOAT GENERATED ALWAYS AS (
    CASE WHEN times_played > 0 THEN total_confusion_delta / times_played ELSE 0 END
  ) STORED,
  
  -- Daily mode inclusion
  daily_pool BOOLEAN DEFAULT false  -- true = eligible for daily challenges
);

-- Indexes
CREATE INDEX idx_situations_active ON situations(is_active, difficulty);
CREATE INDEX idx_situations_daily ON situations(daily_pool) WHERE daily_pool = true;
CREATE INDEX idx_situations_intent ON situations(intent) WHERE is_active = true;
```

### Row-Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE situations ENABLE ROW LEVEL SECURITY;

-- Public read access for active situations
CREATE POLICY "Public can read active situations"
  ON situations FOR SELECT
  USING (is_active = true);

-- Service role can do everything (for API routes)
CREATE POLICY "Service role full access"
  ON situations FOR ALL
  USING (auth.role() = 'service_role');
```

---

## Environment Variables

Add to `.env.local`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...  # public key, safe for client
SUPABASE_SERVICE_KEY=eyJ...  # secret key, server-side only
```

---

## Implementation Steps

### Phase 1: Setup & Migration

1. **Create Supabase project** at [supabase.com](https://supabase.com)
2. **Run schema SQL** in Supabase SQL editor
3. **Install client**: `npm install @supabase/supabase-js`
4. **Create lib/supabase.ts** — client initialization
5. **Seed database** — migrate existing 60 situations
6. **Keep fallback** — retain `situations.ts` for offline/dev

### Phase 2: Update Game Logic

1. **Modify `lib/rounds.ts`** — fetch from Supabase instead of import
2. **Update API routes** — handle async situation fetching
3. **Add error handling** — fallback to local data if DB unavailable
4. **Test all game modes** — classic, timer, daily, extreme

### Phase 3: Analytics

1. **Track plays** — increment `times_played` after each round
2. **Track confusion** — update `total_confusion_delta` with actual results
3. **Dashboard queries** — identify best/worst performing situations

### Phase 4: Content Expansion

1. **Batch generation script** — use LLM to generate 50-100 situations at once
2. **Review workflow** — mark generated situations as `is_curated` after review
3. **Retire bad ones** — set `is_active = false` for poor performers

---

## Code Changes

### `lib/supabase.ts` (new file)

```typescript
import { createClient } from '@supabase/supabase-js';

// Server-side client (for API routes)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Public client (if needed for client-side)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### `lib/rounds.ts` (updated)

```typescript
import { supabaseAdmin } from './supabase';
import { situations as fallbackSituations } from '@/data/situations';
import { ConversationSituation, RoundData } from './types';

// Convert DB row to TypeScript type
function dbToSituation(row: any): ConversationSituation {
  return {
    id: row.slug,
    topic: row.topic,
    tone: row.tone,
    intent: row.intent,
    personName: row.person_name,
    personContext: row.person_context,
    facts: row.facts,
    initialTranscript: row.initial_transcript,
    allowedReplyLength: { 
      min: row.reply_length_min, 
      max: row.reply_length_max 
    },
    difficultyTags: [row.difficulty],
  };
}

export async function selectSituationPair(
  usedSlugs: string[]
): Promise<RoundData> {
  try {
    // Fetch random active situations, excluding used ones
    let query = supabaseAdmin
      .from('situations')
      .select('*')
      .eq('is_active', true);
    
    if (usedSlugs.length > 0) {
      query = query.not('slug', 'in', `(${usedSlugs.join(',')})`);
    }
    
    const { data, error } = await query.limit(20);
    
    if (error || !data || data.length < 2) {
      throw new Error('Not enough situations from DB');
    }
    
    // Shuffle and pick two with different intents
    const shuffled = data.sort(() => Math.random() - 0.5);
    const situationA = shuffled[0];
    const situationB = shuffled.find(s => s.intent !== situationA.intent) 
      || shuffled[1];
    
    return {
      situationA: dbToSituation(situationA),
      situationB: dbToSituation(situationB),
    };
  } catch (err) {
    console.warn('Supabase fetch failed, using fallback:', err);
    return selectSituationPairFallback(usedSlugs);
  }
}

// Fallback to local data
function selectSituationPairFallback(usedIds: string[]): RoundData {
  const pool = fallbackSituations.filter(s => !usedIds.includes(s.id));
  const shuffled = pool.sort(() => Math.random() - 0.5);
  const situationA = shuffled[0];
  const situationB = shuffled.find(s => s.intent !== situationA.intent) 
    || shuffled[1];
  return { situationA, situationB };
}
```

### Analytics: Track situation performance

```typescript
// Call after each round completes
export async function recordSituationPlay(
  slug: string, 
  confusionDelta: number
): Promise<void> {
  await supabaseAdmin.rpc('record_situation_play', {
    p_slug: slug,
    p_confusion_delta: confusionDelta,
  });
}
```

```sql
-- Supabase function for atomic updates
CREATE OR REPLACE FUNCTION record_situation_play(
  p_slug TEXT,
  p_confusion_delta FLOAT
) RETURNS void AS $$
BEGIN
  UPDATE situations
  SET 
    times_played = times_played + 1,
    total_confusion_delta = total_confusion_delta + p_confusion_delta,
    updated_at = now()
  WHERE slug = p_slug;
END;
$$ LANGUAGE plpgsql;
```

---

## Seed Script

`scripts/seed-situations.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { situations } from '../src/data/situations';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function seed() {
  console.log(`Seeding ${situations.length} situations...`);
  
  for (const s of situations) {
    const { error } = await supabase.from('situations').upsert({
      slug: s.id,
      topic: s.topic,
      tone: s.tone,
      intent: s.intent,
      person_name: s.personName,
      person_context: s.personContext,
      facts: s.facts,
      initial_transcript: s.initialTranscript,
      reply_length_min: s.allowedReplyLength.min,
      reply_length_max: s.allowedReplyLength.max,
      difficulty: s.difficultyTags[0] || 'medium',
      is_active: true,
      is_curated: true,
      source: 'seed',
      daily_pool: true,
    }, { onConflict: 'slug' });
    
    if (error) {
      console.error(`Failed to seed ${s.id}:`, error.message);
    } else {
      console.log(`✓ ${s.id}`);
    }
  }
  
  console.log('Done!');
}

seed();
```

Run with: `npx tsx scripts/seed-situations.ts`

---

## Batch Generation Script

`scripts/generate-situations.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const anthropic = new Anthropic();

const GENERATION_PROMPT = `Generate 10 unique conversation starter scenarios for a texting game where players must craft replies that work in multiple conversations simultaneously.

Each scenario needs these fields:
- slug: kebab-case unique ID (e.g., "coworker-deadline-stress")
- topic: category (work, friendship, dating, family, health, money, social, etc.)
- tone: one of [casual, formal, stressed, flirty, serious, playful, concerned, excited]
- intent: what the person wants (asking_favor, venting, making_plans, seeking_advice, etc.)
- person_name: realistic first name
- person_context: one sentence describing relationship to player
- facts: array of 2 relevant situational facts
- initial_transcript: array of 2 messages from "them" with {role: "them", text: "..."}
- reply_length_min: minimum characters (usually 10-20)
- reply_length_max: maximum characters (usually 150-300)
- difficulty: easy, medium, or hard

Guidelines:
- Make scenarios feel authentic to modern texting
- Vary the emotional stakes and relationship types
- Include mix of difficulties
- Avoid: generic greetings, inappropriate content, overly complex backstories

Output as a JSON array. No explanation, just the JSON.`;

async function generateBatch() {
  console.log('Generating situations via LLM...');
  
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: GENERATION_PROMPT }],
  });
  
  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');
  
  const scenarios = JSON.parse(content.text);
  console.log(`Generated ${scenarios.length} scenarios`);
  
  for (const s of scenarios) {
    const { error } = await supabase.from('situations').insert({
      slug: s.slug,
      topic: s.topic,
      tone: s.tone,
      intent: s.intent,
      person_name: s.person_name,
      person_context: s.person_context,
      facts: s.facts,
      initial_transcript: s.initial_transcript,
      reply_length_min: s.reply_length_min || 10,
      reply_length_max: s.reply_length_max || 200,
      difficulty: s.difficulty || 'medium',
      is_active: true,
      is_curated: false,  // needs human review
      source: 'llm',
      daily_pool: false,  // don't add to daily until reviewed
    });
    
    if (error) {
      console.error(`Failed: ${s.slug}`, error.message);
    } else {
      console.log(`✓ ${s.slug} (${s.difficulty})`);
    }
  }
}

generateBatch();
```

---

## Daily Mode Considerations

Daily mode requires **deterministic situation selection** so all players get the same game.

```typescript
export async function getDailyPair(): Promise<RoundData> {
  const seed = getDailySeed(); // YYYYMMDD as number
  
  // Fetch all daily-eligible situations
  const { data } = await supabaseAdmin
    .from('situations')
    .select('*')
    .eq('daily_pool', true)
    .eq('is_active', true)
    .order('slug');  // stable ordering
  
  if (!data || data.length < 2) {
    return getDailyPairFallback();
  }
  
  // Seeded shuffle
  const random = seededRandom(seed);
  const shuffled = [...data].sort(() => random() - 0.5);
  
  return {
    situationA: dbToSituation(shuffled[0]),
    situationB: dbToSituation(shuffled[1]),
  };
}
```

**Important:** Only add situations to `daily_pool` after human review to ensure quality.

---

## Useful Queries

### Find worst-performing situations
```sql
SELECT slug, times_played, avg_confusion_delta, difficulty
FROM situations
WHERE times_played > 10
ORDER BY avg_confusion_delta DESC
LIMIT 10;
```

### Find underused situations
```sql
SELECT slug, times_played, created_at
FROM situations
WHERE is_active = true
ORDER BY times_played ASC
LIMIT 20;
```

### Count by source
```sql
SELECT source, COUNT(*), AVG(times_played)
FROM situations
GROUP BY source;
```

---

## Rollback Plan

If Supabase causes issues:

1. Keep `src/data/situations.ts` as source of truth
2. Fallback logic in `rounds.ts` auto-activates on DB errors
3. Can fully revert by removing Supabase calls and using imports

---

## Cost Estimate

| Item | Free Tier | Notes |
|------|-----------|-------|
| Supabase database | 500MB | Situations are tiny (~1KB each) |
| Supabase API calls | 50k/month | More than enough for game traffic |
| LLM batch generation | ~$0.10/batch | Generate 10 situations per call |

Expanding to 500 situations ≈ $5 one-time LLM cost, then free forever.

---

## Timeline

| Week | Tasks |
|------|-------|
| 1 | Set up Supabase, create schema, seed existing situations |
| 1 | Update `rounds.ts` with DB fetching + fallback |
| 2 | Test all game modes, deploy |
| 2 | Add analytics tracking |
| 3+ | Batch generate new situations, curate, expand pool |

