# Code Improvements

A comprehensive list of potential improvements, bugs, and technical debt identified in the codebase.

---

## 🐛 Potential Bugs

### 1. Race condition in `useAuth` hook

**File:** `src/lib/useAuth.ts`

The `supabase` client is created fresh every render with `createClient()` (line 10), so `supabase.auth` changes each time, potentially causing infinite loops or unexpected behavior in the `useEffect` dependency array.

**Fix:** Either memoize the client or move it to a ref/context:

```typescript
const supabaseRef = useRef(createClient());
const supabase = supabaseRef.current;
```

---

### 2. Shuffle using `Math.random() - 0.5` is biased

**File:** `src/lib/rounds.ts` (lines 65, 90, 126)

The `sort(() => Math.random() - 0.5)` shuffle algorithm is not uniformly random.

**Fix:** Use Fisher-Yates shuffle:

```typescript
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
```

---

### 3. Missing null check before array access

**File:** `src/lib/rounds.ts` (line 127)

If `dailyPairs` is empty after filtering, `shuffled[0]` would be `undefined`, causing downstream errors.

**Fix:** Add a guard:

```typescript
if (shuffled.length === 0) {
  throw new Error("No pairs available for daily mode");
}
const selectedPair = shuffled[0];
```

---

### 4. `calculateRoundScore` doesn't account for extreme mode

**File:** `src/lib/scoring.ts`

In extreme mode, there's a `result.C` but the scoring function only considers A and B in the min calculations. This may be intentional, but should be documented or fixed.

**Fix (if C should be included):**

```typescript
const scores = [result.A, result.B];
if (result.C) scores.push(result.C);

score += COHERENCE_SCORE_MULTIPLIER * Math.min(...scores.map(s => s.coherence));
score += RELEVANCE_SCORE_MULTIPLIER * Math.min(...scores.map(s => s.relevance));
score += TONE_SCORE_MULTIPLIER * Math.min(...scores.map(s => s.tone_match));
```

---

## 🔒 Security Concerns

### 1. Regex-based moderation is easily bypassed

**File:** `src/lib/moderation.ts`

Blocklist-based moderation can be bypassed with:
- Unicode homoglyphs (е vs e, а vs a)
- Zero-width characters
- Spacing tricks
- Leetspeak variations not covered

**Recommendation:** Add LLM-based moderation as a second layer. Constants exist for this (`MODERATION_TEMPERATURE`, etc.) but no implementation.

---

### 2. Rate limiting is per-instance and easily bypassed

**File:** `src/lib/rateLimit.ts`

The in-memory `Map` is per-process. In a multi-instance deployment (Vercel serverless, etc.), each instance has its own map, making rate limiting ineffective. Also, `x-forwarded-for` can be spoofed if not properly configured.

**Recommendation:** Use a distributed store (Redis/Upstash) or a service like Vercel's built-in rate limiting.

---

### 3. No input sanitization beyond length checks in judge API

**File:** `src/app/api/judge/route.ts`

The `playerReply` is sent directly to the LLM prompt. While there are length limits, consider additional prompt injection mitigations.

**Recommendation:** Add input sanitization and consider wrapping user content in clear delimiters.

---

## ⚡ Performance Issues

### 1. Recalculating all situations on every call

**File:** `src/lib/rounds.ts` (function `getAllSituations`)

This iterates through all pairs every time `selectSingleSituation` is called.

**Fix:** Memoize the result:

```typescript
let cachedSituations: ConversationSituation[] | null = null;

function getAllSituations(): ConversationSituation[] {
  if (!cachedSituations) {
    const situationMap = new Map<string, ConversationSituation>();
    for (const pair of allPairs) {
      situationMap.set(pair.situationA.id, pair.situationA);
      situationMap.set(pair.situationB.id, pair.situationB);
      if (pair.situationC) {
        situationMap.set(pair.situationC.id, pair.situationC);
      }
    }
    cachedSituations = Array.from(situationMap.values());
  }
  return cachedSituations;
}
```

---

### 2. Rate limit map never cleans up old entries

**File:** `src/lib/rateLimit.ts`

Old IPs accumulate forever until process restart, causing memory growth.

**Fix:** Add periodic cleanup:

```typescript
// Clean up expired entries every minute
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap) {
      if (now > record.resetTime) {
        rateLimitMap.delete(ip);
      }
    }
  }, 60000);
}
```

---

## 🏗 Architecture & Maintainability

### 1. `GamePageContent` is too large (~770 lines)

**File:** `src/app/game/page.tsx`

The game page component handles too many concerns.

**Recommendation:** Extract into:
- `useGameTimer` hook for timer logic
- `useReducer` or XState for game state management
- `useFetchContinuations` for fetching logic
- Separate components for different game phases

---

### 2. Duplicated conversation update logic

**File:** `src/app/game/page.tsx` (lines 249-266 and 330-355)

Both sections update conversation transcripts with the player's reply. This duplication can lead to bugs if one is updated but not the other.

**Recommendation:** Extract to a helper function:

```typescript
function addPlayerReplyToConversations(
  state: GameState,
  reply: string
): Pick<GameState, 'conversationA' | 'conversationB' | 'conversationC'> {
  return {
    conversationA: {
      ...state.conversationA,
      transcript: [...state.conversationA.transcript, { role: "player", text: reply }],
    },
    conversationB: {
      ...state.conversationB,
      transcript: [...state.conversationB.transcript, { role: "player", text: reply }],
    },
    conversationC: state.conversationC ? {
      ...state.conversationC,
      transcript: [...state.conversationC.transcript, { role: "player", text: reply }],
    } : undefined,
  };
}
```

---

### 3. Type assertions instead of type guards

**Files:** `src/app/api/judge/route.ts`, `src/app/api/continue/route.ts`, etc.

Using `as` to cast request bodies bypasses runtime validation.

**Recommendation:** Use Zod for request validation:

```typescript
import { z } from 'zod';

const JudgeRequestSchema = z.object({
  conversationA: ConversationSchema,
  conversationB: ConversationSchema,
  conversationC: ConversationSchema.optional(),
  playerReply: z.string().min(1).max(MAX_REPLY_LENGTH),
  currentConfusionA: z.number(),
  currentConfusionB: z.number(),
  currentConfusionC: z.number().optional(),
  roundNumber: z.number().positive(),
});

// Usage
const parseResult = JudgeRequestSchema.safeParse(await request.json());
if (!parseResult.success) {
  return NextResponse.json({ error: parseResult.error.message }, { status: 400 });
}
const body = parseResult.data;
```

---

### 4. Inconsistent error handling

Some places return fallback values on error (judge returns neutral scores), others throw, others return null. Consider a consistent strategy across the codebase.

---

## 🧹 Code Quality

### 1. Magic strings for game modes are out of sync

**Files:** `src/lib/types.ts`, `src/app/api/scores/route.ts`

The `GameMode` type and `validModes` array are out of sync ("custom" is missing from the type).

**Fix:** Use a single source of truth:

```typescript
// In src/lib/types.ts
export const GAME_MODES = ["classic", "timer", "daily", "extreme", "custom"] as const;
export type GameMode = typeof GAME_MODES[number];

// In route.ts
import { GAME_MODES } from "@/lib/types";
if (!mode || !GAME_MODES.includes(mode)) { ... }
```

---

### 2. Empty catch blocks

**File:** `src/lib/judge.ts` (line 208), and others

Empty catch blocks swallow errors silently.

**Fix:** At minimum log a warning:

```typescript
} catch (error) {
  console.warn("Failed to parse judge response:", error);
  return null;
}
```

---

### 3. Unused/redundant ModerationResult interface

**File:** `src/lib/moderation.ts`

The `ModerationResult` interface is only used by `moderateMessages`, which just wraps `checkBlocklist`. Consider simplifying or expanding the moderation system.

---

### 4. JSDoc mismatch / confusing naming

**File:** `src/lib/moderation.ts`

The function `checkBlocklist` returns `passed` (double negative thinking required: "blocklist check passed" = "content is OK").

**Recommendation:** Rename to something clearer like `isContentAllowed` returning `{ allowed: boolean }` or `validateContent` returning `{ valid: boolean }`.

---

## 📝 Minor Suggestions

### 1. Extract confusion delta magic numbers

**File:** `src/lib/confusion.ts`

The magic numbers (+2, +3, -1, +5) in `calculateConfusionDelta` should be extracted to named constants:

```typescript
const CONFUSION_DELTA = {
  GREAT_REPLY: -1,
  PASS: 0,
  PARTIAL_PASS: 2,
  UNSAFE_OR_CONTRADICTION: 2,
  FAIL: 3,
  CATASTROPHIC: MAX_CONFUSION, // instant death
} as const;
```

---

### 2. Add request timeouts to fetch calls

**File:** `src/app/game/page.tsx`

If the LLM is slow, users have no feedback. Add timeouts:

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const res = await fetch("/api/judge", {
    signal: controller.signal,
    // ...
  });
} finally {
  clearTimeout(timeoutId);
}
```

---

### 3. Seeded random quality

**File:** `src/lib/rounds.ts`

The Linear Congruential Generator used for seeded random may have poor distribution properties for small seeds. Consider using a better PRNG like Mulberry32 or xoshiro128**.

---

### 4. Add observability

Consider adding OpenTelemetry or structured logging for API routes to track:
- LLM latency
- Error rates
- Rate limit hits
- Moderation blocks

---

## Priority Order

1. **High:** Security issues (rate limiting, moderation bypass)
2. **High:** Bugs (shuffle bias, null checks, useAuth race condition)
3. **Medium:** Type safety (Zod validation, GameMode sync)
4. **Medium:** Architecture (break up GamePageContent)
5. **Low:** Code quality (naming, magic numbers, empty catches)
6. **Low:** Performance (memoization, cleanup)
