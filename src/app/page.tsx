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
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UserScenario {
  id: string;
  share_code: string;
  title: string;
  difficulty: string;
  play_count: number;
  created_at: string;
}

const modes: {
  id: GameMode;
  name: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "classic",
    name: "CLASSIC",
    description: "No timer. Take your time to craft the perfect reply.",
    icon: "[>]",
  },
  {
    id: "timer",
    name: "TIMER",
    description: "20-35 seconds per round. Think fast!",
    icon: "[T]",
  },
  {
    id: "daily",
    name: "DAILY",
    description: "Same seed for everyone. Compare scores!",
    icon: "[D]",
  },
  {
    id: "extreme",
    name: "EXTREME",
    description: "Juggle 3 conversations at once. Triple the chaos!",
    icon: "[!!!]",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState<StoredGameData | null>(null);
  const [dailyPlayed, setDailyPlayed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userScenarios, setUserScenarios] = useState<UserScenario[]>([]);
  const [scenariosLoading, setScenariosLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const supabase = createClient();

  // Client-side initialization from localStorage (unavailable during SSR)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(getStoredData());
    setDailyPlayed(hasDailyBeenPlayed());
  }, []);

  // Auth state tracking
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: fetchedUser } }) => {
      setUser(fetchedUser);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Fetch user's scenarios when authenticated
  useEffect(() => {
    if (!user) {
      setUserScenarios([]);
      return;
    }

    setScenariosLoading(true);
    fetch("/api/scenarios")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setUserScenarios(data))
      .catch(() => setUserScenarios([]))
      .finally(() => setScenariosLoading(false));
  }, [user]);

  const copyShareLink = (shareCode: string) => {
    const url = `${window.location.origin}/play/${shareCode}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(shareCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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
          {modes.map((mode, index) => (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleModeSelect(mode.id)}
              className="relative group p-5 bg-black border border-gray-700 hover:border-white hover:bg-white hover:text-black transition-all text-left font-mono"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg font-bold">{mode.icon}</span>
                <h3 className="text-lg font-bold tracking-wide">{mode.name}</h3>
              </div>
              <p className="text-sm text-gray-500 group-hover:text-gray-600">
                {mode.description}
              </p>

              {/* High score */}
              {stats &&
                mode.id !== "daily" &&
                mode.id !== "custom" &&
                stats.highScores[mode.id] > 0 && (
                  <div className="mt-3 text-xs text-gray-600 group-hover:text-gray-500">
                    Best: {formatScore(stats.highScores[mode.id])} pts
                    {stats.bestRounds[mode.id] > 0 &&
                      ` | ${stats.bestRounds[mode.id]} rounds`}
                  </div>
                )}

              {/* Daily specific */}
              {mode.id === "daily" && (
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
              )}

              {/* Corner decorations */}
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
          ))}
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

        {/* Your Custom Challenges */}
        {user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="mt-12 w-full max-w-2xl"
          >
            <h2 className="text-gray-400 font-mono text-sm mb-4 text-center">
              YOUR CUSTOM CHALLENGES
            </h2>

            {scenariosLoading ? (
              <div className="text-center text-gray-600 font-mono text-sm">
                [LOADING...]
              </div>
            ) : userScenarios.length === 0 ? (
              <div className="text-center border border-gray-800 p-6">
                <p className="text-gray-600 font-mono text-sm mb-4">
                  No challenges created yet.
                </p>
                <Link
                  href="/create"
                  className="text-gray-400 hover:text-white font-mono text-sm transition-colors"
                >
                  [CREATE YOUR FIRST]
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {userScenarios.map((scenario, index) => (
                  <motion.div
                    key={scenario.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 + index * 0.05 }}
                    className="relative group border border-gray-800 hover:border-gray-600 p-4 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-500 font-mono text-sm">
                            [&gt;]
                          </span>
                          <h3 className="text-white font-mono text-sm truncate">
                            {scenario.title}
                          </h3>
                        </div>
                        <p className="text-gray-600 font-mono text-xs pl-6">
                          {scenario.play_count}{" "}
                          {scenario.play_count === 1 ? "play" : "plays"} ·{" "}
                          {formatDate(scenario.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2 pl-6 sm:pl-0">
                        <Link
                          href={`/play/${scenario.share_code}`}
                          className="px-3 py-1.5 border border-gray-700 text-gray-400 hover:border-white hover:text-white font-mono text-xs transition-colors"
                        >
                          [PLAY]
                        </Link>
                        <button
                          onClick={() => copyShareLink(scenario.share_code)}
                          className="px-3 py-1.5 border border-gray-700 text-gray-400 hover:border-white hover:text-white font-mono text-xs transition-colors"
                        >
                          {copiedCode === scenario.share_code
                            ? "[COPIED!]"
                            : "[COPY LINK]"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative py-6 text-center text-sm text-gray-600 font-mono">
        <p>Made with &lt;3 for wordplay enthusiasts</p>
      </footer>
    </div>
  );
}
