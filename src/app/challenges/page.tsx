"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AuthButton } from "@/components/AuthButton";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

interface UserScenario {
  id: string;
  share_code: string;
  title: string;
  difficulty: string;
  play_count: number;
  created_at: string;
}

export default function ChallengesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userScenarios, setUserScenarios] = useState<UserScenario[]>([]);
  const [scenariosLoading, setScenariosLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const supabase = createClient();

  // Auth state tracking
  useEffect(() => {
    supabase.auth
      .getUser()
      .then(
        ({ data: { user: fetchedUser } }: { data: { user: User | null } }) => {
          setUser(fetchedUser);
        }
      );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
      }
    );

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

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Link
          href="/"
          className="text-gray-400 hover:text-white font-mono text-sm transition-colors"
        >
          [&lt; BACK]
        </Link>
        <AuthButton />
      </header>

      <main className="flex-1 flex flex-col items-center p-4 pt-8">
        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-white text-2xl font-mono font-bold mb-2">
            [*] CUSTOM CHALLENGES
          </h1>
          <p className="text-gray-500 font-mono text-sm">
            Play community scenarios or your own creations
          </p>
        </motion.div>

        {/* Your Scenarios Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-2xl"
        >
          <h2 className="text-gray-400 font-mono text-sm mb-4 flex items-center gap-2">
            <span className="text-white">&gt;</span> YOUR SCENARIOS
          </h2>

          {user === null ? (
            // Not logged in - show sign in prompt
            <div className="border border-gray-800 p-6 text-center">
              <p className="text-gray-500 font-mono text-sm mb-4">
                Sign in to view and manage your custom scenarios.
              </p>
              <AuthButton />
            </div>
          ) : scenariosLoading ? (
            // Loading state
            <div className="text-center text-gray-600 font-mono text-sm py-8">
              [LOADING...]
            </div>
          ) : userScenarios.length === 0 ? (
            // No scenarios yet
            <div className="border border-gray-800 p-6 text-center">
              <p className="text-gray-600 font-mono text-sm mb-4">
                No challenges created yet.
              </p>
              <Link
                href="/create"
                className="inline-block px-4 py-2 border border-gray-700 text-gray-400 hover:border-white hover:text-white font-mono text-sm transition-colors"
              >
                [+ CREATE YOUR FIRST]
              </Link>
            </div>
          ) : (
            // Scenarios list
            <div className="space-y-3">
              {userScenarios.map((scenario, index) => (
                <motion.div
                  key={scenario.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
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

              {/* Create more link */}
              <div className="pt-4 text-center">
                <Link
                  href="/create"
                  className="text-gray-500 hover:text-white font-mono text-sm transition-colors"
                >
                  [+ CREATE ANOTHER]
                </Link>
              </div>
            </div>
          )}
        </motion.div>

        {/* Placeholder for future leaderboard */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-2xl mt-12"
        >
          <h2 className="text-gray-400 font-mono text-sm mb-4 flex items-center gap-2">
            <span className="text-white">&gt;</span> POPULAR CHALLENGES
          </h2>
          <div className="border border-gray-800 border-dashed p-6 text-center">
            <p className="text-gray-700 font-mono text-sm">
              [ Coming soon... ]
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-600 font-mono">
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
