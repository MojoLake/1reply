"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GameMode } from "@/lib/types";
import { getStoredData, hasDailyBeenPlayed, StoredGameData } from "@/lib/storage";
import { formatScore } from "@/lib/scoring";

const modes: {
  id: GameMode;
  name: string;
  description: string;
  icon: string;
  gradient: string;
}[] = [
  {
    id: "classic",
    name: "Classic",
    description: "No timer. Take your time to craft the perfect reply.",
    icon: "🎯",
    gradient: "from-indigo-600 to-blue-600",
  },
  {
    id: "timer",
    name: "Timer",
    description: "20-35 seconds per round. Think fast!",
    icon: "⏱️",
    gradient: "from-amber-600 to-orange-600",
  },
  {
    id: "daily",
    name: "Daily Challenge",
    description: "5 rounds. Same seed for everyone. Compare scores!",
    icon: "📅",
    gradient: "from-emerald-600 to-teal-600",
  },
  {
    id: "endless",
    name: "Endless",
    description: "How long can you keep both conversations going?",
    icon: "♾️",
    gradient: "from-purple-600 to-pink-600",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState<StoredGameData | null>(null);
  const [dailyPlayed, setDailyPlayed] = useState(false);

  useEffect(() => {
    setStats(getStoredData());
    setDailyPlayed(hasDailyBeenPlayed());
  }, []);

  const handleModeSelect = (mode: GameMode) => {
    router.push(`/game?mode=${mode}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-900/20 via-zinc-950 to-purple-900/20 pointer-events-none" />

      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 20,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 25,
            ease: "easeInOut",
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
        />
      </div>

      <main className="relative flex-1 flex flex-col items-center justify-center p-4">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="text-6xl md:text-8xl font-black mb-4"
          >
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              1Reply
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-zinc-400 max-w-lg mx-auto"
          >
            Two conversations. One reply.
            <br />
            <span className="text-zinc-500">
              Craft messages that work for both sides.
            </span>
          </motion.p>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12 flex flex-wrap justify-center gap-6 text-sm text-zinc-500"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">💬</span>
            <span>Two conversations</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">✍️</span>
            <span>One reply</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span>Keep them going</span>
          </div>
        </motion.div>

        {/* Mode selection */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full mb-12"
        >
          {modes.map((mode, index) => (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleModeSelect(mode.id)}
              className="relative group p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all text-left overflow-hidden"
            >
              {/* Gradient overlay on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}
              />

              <div className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{mode.icon}</span>
                  <h3 className="text-xl font-bold text-white">{mode.name}</h3>
                </div>
                <p className="text-sm text-zinc-500">{mode.description}</p>

                {/* High score */}
                {stats && mode.id !== "daily" && stats.highScores[mode.id] > 0 && (
                  <div className="mt-3 text-xs text-zinc-600">
                    Best: {formatScore(stats.highScores[mode.id])} pts
                    {stats.bestRounds[mode.id] > 0 &&
                      ` • ${stats.bestRounds[mode.id]} rounds`}
                  </div>
                )}

                {/* Daily specific */}
                {mode.id === "daily" && (
                  <div className="mt-3">
                    {dailyPlayed ? (
                      <span className="text-xs text-emerald-500">
                        ✓ Completed today
                        {stats?.highScores.daily.score &&
                          ` • ${formatScore(stats.highScores.daily.score)} pts`}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-400">
                        Today&apos;s challenge awaits!
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Stats */}
        {stats && stats.totalGamesPlayed > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-sm text-zinc-600"
          >
            {stats.totalGamesPlayed} games played
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative py-6 text-center text-sm text-zinc-600">
        <p>
          Made with 🧠 for wordplay enthusiasts
        </p>
      </footer>
    </div>
  );
}
