# Code Improvements

A comprehensive list of potential improvements, bugs, and technical debt identified in the codebase.

---

### 2. Rate limiting is per-instance and easily bypassed

**File:** `src/lib/rateLimit.ts`

The in-memory `Map` is per-process. In a multi-instance deployment (Vercel serverless, etc.), each instance has its own map, making rate limiting ineffective. Also, `x-forwarded-for` can be spoofed if not properly configured.

**Recommendation:** Use a distributed store (Redis/Upstash) or a service like Vercel's built-in rate limiting.

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

The Linear Congruential Generator used for seeded random may have poor distribution properties for small seeds. Consider using a better PRNG like Mulberry32 or xoshiro128\*\*.

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
