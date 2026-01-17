"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { GameMode } from "@/lib/types";
import {
  getStoredData,
  hasDailyBeenPlayed,
  StoredGameData,
} from "@/lib/storage";
import { formatScore } from "@/lib/scoring";
import { AuthButton } from "@/components/AuthButton";

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState<StoredGameData | null>(null);
  const [dailyPlayed, setDailyPlayed] = useState(false);

  // Client-side initialization from localStorage (unavailable during SSR)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(getStoredData());
    setDailyPlayed(hasDailyBeenPlayed());
  }, []);

  const handleModeSelect = (mode: GameMode) => {
    router.push(`/game?mode=${mode}`);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header with auth */}
      <header className="absolute top-0 right-0 p-4 z-10">
        <AuthButton />
      </header>

      <main className="relative flex-1 flex flex-col items-center justify-center p-4">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          {/* ASCII Art Title */}
          <motion.pre
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-white text-xs sm:text-sm md:text-base font-mono mb-6 leading-tight"
          >
            {`
  __  _____           _       
 /_ ||  __ \\         | |      
  | || |__) |___ _ __| |_   _ 
  | ||  _  // _ \\ '_ \\ | | | |
  | || | \\ \\  __/ |_) | | |_| |
  |_||_|  \\_\\___| .__/|_|\\__, |
                | |       __/ |
                |_|      |___/ 
`}
          </motion.pre>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-lg mx-auto font-mono"
          >
            Two conversations. One reply.
            <br />
            <span className="text-gray-600">
              Craft messages that work for both sides.
            </span>
          </motion.p>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12 flex flex-wrap justify-center gap-6 text-sm text-gray-500 font-mono"
        >
          <div className="flex items-center gap-2">
            <span className="text-white">[A][B]</span>
            <span>Two conversations</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white">&gt;_</span>
            <span>One reply</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white">[OK]</span>
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
          {/* Classic mode */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => handleModeSelect("classic")}
            className="relative group p-5 bg-black border border-gray-700 hover:border-white hover:bg-white hover:text-black transition-all text-left font-mono"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg font-bold">[&gt;]</span>
              <h3 className="text-lg font-bold tracking-wide">CLASSIC</h3>
            </div>
            <p className="text-sm text-gray-500 group-hover:text-gray-600">
              No timer. Take your time to craft the perfect reply.
            </p>
            {stats && stats.highScores.classic > 0 && (
              <div className="mt-3 text-xs text-gray-600 group-hover:text-gray-500">
                Best: {formatScore(stats.highScores.classic)} pts
                {stats.bestRounds.classic > 0 &&
                  ` | ${stats.bestRounds.classic} rounds`}
              </div>
            )}
            <span className="absolute top-0 left-0 text-gray-700 group-hover:text-black text-xs">
              +
            </span>
            <span className="absolute top-0 right-0 text-gray-700 group-hover:text-black text-xs">
              +
            </span>
            <span className="absolute bottom-0 left-0 text-gray-700 group-hover:text-black text-xs">
              +
            </span>
            <span className="absolute bottom-0 right-0 text-gray-700 group-hover:text-black text-xs">
              +
            </span>
          </motion.button>

          {/* Custom Challenges - links to /challenges page */}
          <Link href="/challenges">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="relative group p-5 bg-black border border-gray-700 hover:border-white hover:bg-white hover:text-black transition-all text-left font-mono h-full"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg font-bold">[*]</span>
                <h3 className="text-lg font-bold tracking-wide">CUSTOM</h3>
              </div>
              <p className="text-sm text-gray-500 group-hover:text-gray-600">
                Play community scenarios or your own creations.
              </p>
              <span className="absolute top-0 left-0 text-gray-700 group-hover:text-black text-xs">
                +
              </span>
              <span className="absolute top-0 right-0 text-gray-700 group-hover:text-black text-xs">
                +
              </span>
              <span className="absolute bottom-0 left-0 text-gray-700 group-hover:text-black text-xs">
                +
              </span>
              <span className="absolute bottom-0 right-0 text-gray-700 group-hover:text-black text-xs">
                +
              </span>
            </motion.div>
          </Link>

          {/* Daily mode */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => handleModeSelect("daily")}
            className="relative group p-5 bg-black border border-gray-700 hover:border-white hover:bg-white hover:text-black transition-all text-left font-mono"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg font-bold">[D]</span>
              <h3 className="text-lg font-bold tracking-wide">DAILY</h3>
            </div>
            <p className="text-sm text-gray-500 group-hover:text-gray-600">
              Same seed for everyone. Compare scores!
            </p>
            <div className="mt-3">
              {dailyPlayed ? (
                <span className="text-xs text-gray-500 group-hover:text-gray-600">
                  [x] Completed today
                  {stats?.highScores.daily.score &&
                    ` | ${formatScore(stats.highScores.daily.score)} pts`}
                </span>
              ) : (
                <span className="text-xs text-gray-400 group-hover:text-gray-600">
                  [ ] Today&apos;s challenge awaits!
                </span>
              )}
            </div>
            <span className="absolute top-0 left-0 text-gray-700 group-hover:text-black text-xs">
              +
            </span>
            <span className="absolute top-0 right-0 text-gray-700 group-hover:text-black text-xs">
              +
            </span>
            <span className="absolute bottom-0 left-0 text-gray-700 group-hover:text-black text-xs">
              +
            </span>
            <span className="absolute bottom-0 right-0 text-gray-700 group-hover:text-black text-xs">
              +
            </span>
          </motion.button>

          {/* Extreme mode */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => handleModeSelect("extreme")}
            className="relative group p-5 bg-black border border-gray-700 hover:border-white hover:bg-white hover:text-black transition-all text-left font-mono"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg font-bold">[!!!]</span>
              <h3 className="text-lg font-bold tracking-wide">EXTREME</h3>
            </div>
            <p className="text-sm text-gray-500 group-hover:text-gray-600">
              Juggle 3 conversations at once. Triple the chaos!
            </p>
            {stats && stats.highScores.extreme > 0 && (
              <div className="mt-3 text-xs text-gray-600 group-hover:text-gray-500">
                Best: {formatScore(stats.highScores.extreme)} pts
                {stats.bestRounds.extreme > 0 &&
                  ` | ${stats.bestRounds.extreme} rounds`}
              </div>
            )}
            <span className="absolute top-0 left-0 text-gray-700 group-hover:text-black text-xs">
              +
            </span>
            <span className="absolute top-0 right-0 text-gray-700 group-hover:text-black text-xs">
              +
            </span>
            <span className="absolute bottom-0 left-0 text-gray-700 group-hover:text-black text-xs">
              +
            </span>
            <span className="absolute bottom-0 right-0 text-gray-700 group-hover:text-black text-xs">
              +
            </span>
          </motion.button>
        </motion.div>

        {/* Stats */}
        {stats && stats.totalGamesPlayed > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-sm text-gray-600 font-mono"
          >
            {stats.totalGamesPlayed} games played
          </motion.div>
        )}

        {/* Create scenario link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8"
        >
          <Link
            href="/create"
            className="inline-block px-6 py-3 border border-gray-700 text-gray-400 hover:border-white hover:text-white transition-colors font-mono text-sm"
          >
            [+ CREATE SCENARIO]
          </Link>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative py-6 text-center text-sm text-gray-600 font-mono">
        <p>
          made by{" "}
          <a
            href="https://elias.simojoki.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-black transition-colors"
          >
            elias
          </a>
        </p>
      </footer>
    </div>
  );
}
