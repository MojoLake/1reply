# 1Reply - Dual Conversation Game

A word puzzle webapp where you participate in two simultaneous conversations and must craft a single reply that works for **both** conversations at the same time.

## 🎮 How to Play

1. You're presented with two ongoing conversations (A and B)
2. Craft a single reply that makes sense in **both** conversations
3. An AI judge evaluates how well your reply fits each conversation
4. Keep both conversations going as long as possible
5. If either party gets too confused, game over!

## 🎯 Game Modes

- **Classic**: No timer. Take your time to craft the perfect reply.
- **Timer**: 20-35 seconds per round. Think fast!
- **Daily Challenge**: Same seed for everyone. Compare scores!
- **Extreme**: Juggle 3 conversations at once. Triple the chaos!

## 🧠 Confusion System

Each conversation has a confusion meter (0-5):
- **0** `:D` Crystal clear
- **1** `:)` Makes sense  
- **2** `:|` Slightly off
- **3** `:(` Getting confused
- **4** `:'(` Very confused
- **5** `>:(` Game Over!

Great replies can reduce confusion, while poor replies increase it.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Google Gemini API key

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd 1reply

# Install dependencies
npm install

# Create environment file
# Add your Gemini API key to .env.local:
# GEMINI_API_KEY=your_key_here

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play!

### Environment Variables

Create a `.env.local` file in the root directory:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key at: https://makersuite.google.com/app/apikey

## 🛠 Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (animations)
- **Google Gemini** (AI judge)

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── judge/      # LLM evaluation endpoint
│   │   └── round/      # Round generation endpoint
│   ├── game/           # Main game page
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx        # Landing page
├── components/
│   ├── ConfusionMeter.tsx
│   ├── ConversationPanel.tsx
│   ├── GameHeader.tsx
│   ├── GameOverModal.tsx
│   ├── JudgeFeedback.tsx
│   └── ReplyInput.tsx
├── data/
│   └── situations.ts   # 60+ conversation scenarios
└── lib/
    ├── confusion.ts    # Confusion calculation logic
    ├── judge.ts        # Gemini integration
    ├── rounds.ts       # Round generation
    ├── scoring.ts      # Score calculation
    ├── storage.ts      # LocalStorage helpers
    └── types.ts        # TypeScript types
```

## 🎨 Features

- ✅ 60+ unique conversation scenarios
- ✅ Difficulty scaling (easy → medium → hard)
- ✅ Real-time confusion tracking
- ✅ AI-powered reply evaluation
- ✅ Score tracking with local storage
- ✅ Beautiful animations
- ✅ Responsive design (mobile + desktop)
- ✅ Hint system
- ✅ Share results

## 📝 License

MIT
