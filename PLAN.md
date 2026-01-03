# Dual-Conversation Reply - Implementation Plan

## Overview

A webapp game where the player participates in two simultaneous conversations and must craft a single reply that plausibly works as the next message in **both** conversations. The goal is to keep both conversations going as long as possible without confusing either party.

---

## Core Concept

- **Two conversations displayed side-by-side**
- **One input box** for the player's reply
- **Reply is sent to both conversations**
- **LLM judges** whether the reply makes sense in each context
- **Confusion accumulates** when replies don't fit
- **Game over** when either conversation becomes too confused

---

## Confusion System (Critical Mechanic)

### State

- `confusionA`, `confusionB` ∈ [0..5]
- **Start value:** 0 (not confused at all)
- **Game over:** When either reaches 5

### ASCII Display (per conversation)

| Level | Face | Meaning                     |
| ----- | ---- | --------------------------- | ------------ |
| 0     | :D   | Crystal clear               |
| 1     | :)   | Makes sense                 |
| 2     | :    |                             | Slightly off |
| 3     | :(   | Getting confused            |
| 4     | :'(  | Very confused               |
| 5     | >:(  | Total confusion → Game Over |

### Visual Bar

```
[□□□□□] = 0 confusion (safe)
[■□□□□] = 1 confusion
[■■■□□] = 3 confusion
[■■■■■] = 5 confusion (game over)
```

### Confusion Update Rule (Deterministic)

For each conversation separately, based on LLM judge output:

```
pass = coherence >= 6 && relevance >= 6 && contradiction == false && unsafe == false

if unsafe == true → delta = +2
else if contradiction == true → delta = +2
else if pass == true && directness >= 7 → delta = -1 (reduce confusion!)
else if pass == true → delta = 0
else if coherence >= 4 && relevance >= 4 → delta = +1
else → delta = +2

confusion = clamp(confusion + delta, 0, 5)
```

**Key insight:** Great replies can actually _reduce_ confusion, rewarding skillful play.

---

## Game Flow

A **round** is a single exchange: you send a reply, the other people respond. The same two conversations continue throughout the game until one becomes too confused or ends naturally.

```
┌─────────────────────────────────────────────────────────┐
│                     START GAME                          │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│     Select 2 conversation situations (random pair)      │
│     These conversations continue throughout the game    │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│     Display: Conversations A & B side-by-side           │
│     Show: Confusion meters above each                   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│     Player types ONE reply (sent to both)               │
│     (optional: timer countdown)                         │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│     POST /api/judge                                     │
│     LLM evaluates reply against both conversations      │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│     Apply deterministic confusion update                │
│     Animate meter changes                               │
│     Show judge notes                                    │
└─────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐
    │ confusion < 5   │         │ confusion == 5  │
    │ for both        │         │ for either      │
    └─────────────────┘         └─────────────────┘
              │                           │
              ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐
    │ LLM continues   │         │    GAME OVER    │
    │ both convos     │         │  Show stats     │
    │ Next round      │         │  Share option   │
    └─────────────────┘         └─────────────────┘
```

**Conversation Swapping:** If a conversation ends naturally (e.g., goodbyes), the player can start a new conversation with a fresh situation (bonus points!) or continue the current one.

---

## Game Modes

| Mode        | Description                             |
| ----------- | --------------------------------------- |
| **Classic** | Text-only, no timer. Pure puzzle mode.  |
| **Timer**   | 20-40 seconds per round. Pressure mode. |
| **Daily**   | Shared seed. Leaderboard.               |
| **Extreme** | Juggle 3 conversations at once!         |

---

## Scoring (Secondary to Survival)

```javascript
// Per round:
score += 10 * min(coherenceA, coherenceB);
score += 10 * min(relevanceA, relevanceB);
score += 5 * min(tone_matchA, tone_matchB);
if (directnessA >= 7 && directnessB >= 7) score += 30;

// Bonus:
score += roundNumber * 50; // Survival bonus
```

**Score does NOT prevent game over. Confusion does.**

---

## LLM Judge System

### System Prompt

```
You are a strict evaluator. Evaluate the player's reply as the next message in TWO independent conversations.

Rules:
- Do not invent facts
- Do not assume hidden intent
- Penalize ambiguity that avoids answering both
- Penalize non-sequiturs
- Reward replies that naturally fit both contexts

Output JSON only. No explanation outside JSON.
```

### Input Structure

```json
{
  "conversationA": {
    "transcript": [...],
    "facts": [...],
    "context": "..."
  },
  "conversationB": {
    "transcript": [...],
    "facts": [...],
    "context": "..."
  },
  "playerReply": "..."
}
```

### Output Schema

```json
{
  "A": {
    "coherence": 0-10,
    "relevance": 0-10,
    "tone_match": 0-10,
    "directness": 0-10,
    "contradiction": false,
    "unsafe": false,
    "notes": ["explanation of rating"]
  },
  "B": {
    "coherence": 0-10,
    "relevance": 0-10,
    "tone_match": 0-10,
    "directness": 0-10,
    "contradiction": false,
    "unsafe": false,
    "notes": ["explanation of rating"]
  }
}
```

### Retry Logic

- Parse JSON response
- If invalid, retry up to 3 times
- If all retries fail, apply neutral delta (0) and log error

---

## Conversation Generation

### Seed Library Structure

60+ conversation situations stored in TypeScript:

```typescript
{
  id: "work-deadline",
  topic: "work",
  tone: "stressed",
  intent: "asking_for_update",
  personName: "Patricia",
  personContext: "Your project manager",
  facts: [
    "Project is due Friday",
    "You're working on the frontend"
  ],
  initialTranscript: [
    { role: "them", text: "Hey, how's the project coming along?" },
    { role: "them", text: "The client is asking for an update." }
  ],
  allowedReplyLength: { min: 10, max: 200 },
  difficultyTags: ["medium"]  // For future use / categorization
}
```

### Situation Pairing

At game start, two situations are randomly selected. The game tries to pick situations with **different intents** to create an interesting challenge. The inherent difficulty comes from how different the two situations are from each other.

```typescript
function selectSituationPair(usedSituationIds: string[]): RoundData {
  // Filter out already-used situations
  // Shuffle and pick two
  // Try to pick situations with different intents
}
```

---

## UI/UX Design

### Desktop Layout

```
┌────────────────────────────────────────────────────────────────┐
│                         HEADER                                  │
│            Dual-Conversation Reply    Round: 5    Score: 450   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────┐      ┌─────────────────────┐         │
│  │       :D            │      │        :|           │         │
│  │    [□□□□□]          │      │     [■■□□□]         │         │
│  │                     │      │                     │         │
│  │  CONVERSATION A     │      │  CONVERSATION B     │         │
│  │                     │      │                     │         │
│  │  Alex: Hey!         │      │  Boss: Update?      │         │
│  │  Alex: What's up?   │      │  Boss: Client needs │         │
│  │                     │      │        to know.     │         │
│  │                     │      │                     │         │
│  └─────────────────────┘      └─────────────────────┘         │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Type your reply...                                      │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│              [ SEND REPLY ]        [ HINT (3 left) ]          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (Stacked)

```
┌──────────────────────┐
│      Round: 5        │
│     Score: 450       │
├──────────────────────┤
│  :D  [□□□□□]         │
│  CONVERSATION A      │
│  Alex: Hey!          │
│  Alex: What's up?    │
├──────────────────────┤
│  :|  [■■□□□]         │
│  CONVERSATION B      │
│  Boss: Update?       │
│  Boss: Client needs  │
├──────────────────────┤
│ ┌──────────────────┐ │
│ │ Type reply...    │ │
│ └──────────────────┘ │
│    [SEND] [HINT]     │
└──────────────────────┘
```

### Post-Submission Feedback

- Animate confusion meter change (+1 ↑, -1 ↓, +2 ↑↑)
- Flash color: green (good), yellow (okay), red (bad)
- Show judge notes in collapsible panel
- "Continue" button to proceed

### Game Over Screen

- Final score
- Rounds survived
- Best reply (highest scoring)
- Share button (copy result)
- Play again button

---

## Hints System

- **3 hints per game** (reduces final score by 10% each)
- Options:
  1. **Reveal intents** - Show what each person is looking for
  2. **Bridge template** - Suggest a neutral reply structure

---

## Tech Stack

### Frontend

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS** (styling)
- **Framer Motion** (animations)

### Backend

- **Next.js API Routes**
- **OpenAI API** (or compatible LLM)

### Storage

- **LocalStorage** for guest progress
- Optional: Supabase/Vercel KV for persistence & leaderboards

---

## API Routes

### GET /api/round

```typescript
// Query params: mode, usedIds, single (optional)
// Returns: { situationA, situationB }
// Used at game start to get initial conversation pair
// Also used with single=true to get a new situation for swapping
```

### POST /api/judge

```typescript
// Body: { conversationA, conversationB, playerReply }
// Returns: { evaluation, confusionDeltaA, confusionDeltaB, score }
```

### POST /api/continue

```typescript
// Body: { conversationA, conversationB }
// Returns: { responseA, responseB, endingA, endingB }
// LLM generates the next message for each conversation
```

### POST /api/leaderboard

```typescript
// Body: { score, rounds, mode, playerName }
// Requires: rate limiting, validation
```

---

## File Structure

```
1reply/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # Landing/menu
│   ├── game/
│   │   └── page.tsx          # Main game screen
│   ├── api/
│   │   ├── round/route.ts
│   │   ├── judge/route.ts
│   │   └── daily/route.ts
│   └── globals.css
├── components/
│   ├── ConversationPanel.tsx
│   ├── ConfusionMeter.tsx
│   ├── ReplyInput.tsx
│   ├── GameHeader.tsx
│   ├── JudgeFeedback.tsx
│   ├── GameOverModal.tsx
│   └── HintButton.tsx
├── lib/
│   ├── types.ts
│   ├── confusion.ts          # Deterministic update logic
│   ├── scoring.ts
│   ├── judge.ts              # LLM integration
│   └── storage.ts            # LocalStorage helpers
├── data/
│   └── situations.json       # 60+ conversation seeds
├── public/
│   └── ...
├── .env.local                # LLM_API_KEY
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── PLAN.md
```

---

## Implementation Phases

### Phase 1: Core Game Loop

1. [x] Create PLAN.md
2. [ ] Set up Next.js project with TypeScript + Tailwind
3. [ ] Create basic types and interfaces
4. [ ] Build ConversationPanel component
5. [ ] Build ConfusionMeter component
6. [ ] Build ReplyInput component
7. [ ] Create initial situations.json (10 seeds)
8. [ ] Implement /api/round endpoint
9. [ ] Basic game page layout

### Phase 2: LLM Integration

1. [ ] Implement /api/judge endpoint
2. [ ] LLM prompt engineering & testing
3. [ ] JSON parsing with retry logic
4. [ ] Deterministic confusion calculation
5. [ ] Score calculation

### Phase 3: Game Polish

1. [ ] Animations for confusion meter changes
2. [ ] Judge feedback display
3. [ ] Game over modal with stats
4. [ ] Responsive mobile layout
5. [ ] Hints system

### Phase 4: Game Modes

1. [ ] Timer mode
2. [ ] Daily mode with seed
3. [x] Extreme mode (3 conversations)
4. [ ] Mode selection menu

### Phase 5: Content & Balance

1. [ ] Expand to 60+ situations
2. [ ] Playtest and tune confusion thresholds
3. [ ] Add variety to conversation topics
4. [ ] Curate situation pairs for interesting challenges

### Phase 6: Polish & Launch

1. [ ] LocalStorage persistence
2. [ ] Share functionality
3. [ ] Sound effects (optional)
4. [ ] Performance optimization
5. [ ] Deploy to Vercel

---

## Safety & Content Moderation

- **Conversation seeds** are pre-written and reviewed
- **Player input** passes through LLM judge (flags `unsafe`)
- **Auto-fail** if `unsafe == true` (confusion +2)
- **No generation** of disallowed content

---

## Environment Variables

```env
# .env.local
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-...

# Optional
RATE_LIMIT_REQUESTS_PER_MINUTE=20
```

---

## Success Metrics

- Players survive 5+ rounds on average
- Session length > 10 minutes
- Return rate > 30%
- Share rate > 5%

---

## Open Questions

1. **LLM choice**: OpenAI GPT-4o-mini vs Claude Haiku for judging?
2. **Leaderboard**: Anonymous or require auth?
3. **Multiplayer**: Future feature - compete on same seed?
4. **Monetization**: Ads? Premium modes? (probably not for MVP)

---

## Next Steps

1. Initialize Next.js project
2. Install dependencies
3. Create type definitions
4. Build first 10 conversation situations
5. Implement core game loop without LLM (mock judge)
6. Add LLM integration
7. Iterate on UI/UX
