"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { AuthButton } from "@/components/AuthButton";
import type { User } from "@supabase/supabase-js";
import type { ConversationSituation } from "@/lib/types";

type Tone = ConversationSituation["tone"];

const TONES: { value: Tone; label: string }[] = [
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "stressed", label: "Stressed" },
  { value: "flirty", label: "Flirty" },
  { value: "serious", label: "Serious" },
  { value: "playful", label: "Playful" },
  { value: "concerned", label: "Concerned" },
  { value: "excited", label: "Excited" },
];

interface SituationFormData {
  personName: string;
  personContext: string;
  topic: string;
  tone: Tone;
  intent: string;
  facts: string[];
  messages: string[];
}

const emptySituation: SituationFormData = {
  personName: "",
  personContext: "",
  topic: "",
  tone: "casual",
  intent: "",
  facts: [""],
  messages: [""],
};

export default function CreatePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Form state
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [situationA, setSituationA] = useState<SituationFormData>({ ...emptySituation });
  const [situationB, setSituationB] = useState<SituationFormData>({ ...emptySituation });
  const [activeTab, setActiveTab] = useState<"A" | "B">("A");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ shareCode: string; shareUrl: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: fetchedUser } }: { data: { user: User | null } }) => {
      setUser(fetchedUser);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: { user: User | null } | null) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setError("");

    // Build situation objects
    const buildSituation = (data: SituationFormData) => ({
      personName: data.personName,
      personContext: data.personContext,
      topic: data.topic,
      tone: data.tone,
      intent: data.intent,
      facts: data.facts.filter((f) => f.trim()),
      initialTranscript: data.messages
        .filter((m) => m.trim())
        .map((text) => ({ role: "them" as const, text })),
    });

    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          difficulty,
          situationA: buildSituation(situationA),
          situationB: buildSituation(situationB),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create scenario");
      }

      setSuccess({ shareCode: data.shareCode, shareUrl: data.shareUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const updateSituation = (
    setter: React.Dispatch<React.SetStateAction<SituationFormData>>,
    field: keyof SituationFormData,
    value: string | string[] | Tone
  ) => {
    setter((prev) => ({ ...prev, [field]: value }));
  };

  const addArrayItem = (
    setter: React.Dispatch<React.SetStateAction<SituationFormData>>,
    field: "facts" | "messages"
  ) => {
    setter((prev) => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const updateArrayItem = (
    setter: React.Dispatch<React.SetStateAction<SituationFormData>>,
    field: "facts" | "messages",
    index: number,
    value: string
  ) => {
    setter((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const removeArrayItem = (
    setter: React.Dispatch<React.SetStateAction<SituationFormData>>,
    field: "facts" | "messages",
    index: number
  ) => {
    setter((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="text-white font-mono text-xl"
        >
          [LOADING...]
        </motion.div>
      </div>
    );
  }

  // Success state
  if (success) {
    const fullUrl = typeof window !== "undefined" 
      ? `${window.location.origin}${success.shareUrl}` 
      : success.shareUrl;

    return (
      <div className="min-h-screen bg-black flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-gray-800">
          <Link href="/" className="text-white font-mono hover:text-gray-300">
            [← HOME]
          </Link>
          <AuthButton />
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center"
          >
            <div className="text-green-400 font-mono text-4xl mb-6">[✓]</div>
            <h1 className="text-2xl font-mono text-white mb-4">
              Scenario Created!
            </h1>
            <p className="text-gray-400 font-mono text-sm mb-8">
              Share this link with friends to play your scenario:
            </p>

            <div className="bg-gray-900 border border-gray-700 p-4 mb-6">
              <code className="text-white font-mono text-sm break-all">
                {fullUrl}
              </code>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(fullUrl)}
                className="w-full py-3 border border-white text-white hover:bg-white hover:text-black transition-colors font-mono"
              >
                [COPY LINK]
              </button>
              <Link
                href={success.shareUrl}
                className="w-full py-3 bg-white text-black hover:bg-gray-200 transition-colors font-mono text-center"
              >
                [PLAY NOW]
              </Link>
              <button
                onClick={() => {
                  setSuccess(null);
                  setTitle("");
                  setSituationA({ ...emptySituation });
                  setSituationB({ ...emptySituation });
                }}
                className="w-full py-3 border border-gray-700 text-gray-400 hover:border-white hover:text-white transition-colors font-mono"
              >
                [CREATE ANOTHER]
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-gray-800">
          <Link href="/" className="text-white font-mono hover:text-gray-300">
            [← HOME]
          </Link>
          <AuthButton />
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <h1 className="text-2xl font-mono text-white mb-4">
              Create Scenario
            </h1>
            <p className="text-gray-400 font-mono text-sm mb-8">
              Sign in to create custom scenarios and share them with friends.
            </p>
            <div className="inline-block">
              <AuthButton />
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  const activeSituation = activeTab === "A" ? situationA : situationB;
  const setActiveSituation = activeTab === "A" ? setSituationA : setSituationB;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-gray-800">
        <Link href="/" className="text-white font-mono hover:text-gray-300">
          [← HOME]
        </Link>
        <AuthButton />
      </header>

      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-mono text-white mb-2">Create Scenario</h1>
          <p className="text-gray-500 font-mono text-sm mb-8">
            Design two conversation situations for players to juggle.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Title and Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-xs text-gray-500 font-mono mb-2">
                  SCENARIO TITLE
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Office Drama"
                  className="w-full px-3 py-2 bg-black border border-gray-700 focus:border-white text-white font-mono text-sm outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-mono mb-2">
                  DIFFICULTY
                </label>
                <div className="flex gap-2">
                  {(["easy", "medium", "hard"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 py-2 border font-mono text-sm transition-colors ${
                        difficulty === d
                          ? "border-white bg-white text-black"
                          : "border-gray-700 text-gray-400 hover:border-white hover:text-white"
                      }`}
                    >
                      {d.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Situation Tabs */}
            <div className="flex gap-2 mb-4">
              {(["A", "B"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-mono text-sm transition-colors ${
                    activeTab === tab
                      ? "bg-white text-black"
                      : "border border-gray-700 text-gray-400 hover:border-white hover:text-white"
                  }`}
                >
                  SITUATION {tab}
                </button>
              ))}
            </div>

            {/* Situation Form */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: activeTab === "A" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: activeTab === "A" ? 20 : -20 }}
                transition={{ duration: 0.2 }}
                className="border border-gray-700 p-4 mb-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 font-mono mb-2">
                      PERSON&apos;S NAME
                    </label>
                    <input
                      type="text"
                      value={activeSituation.personName}
                      onChange={(e) =>
                        updateSituation(setActiveSituation, "personName", e.target.value)
                      }
                      placeholder="e.g., Sam"
                      className="w-full px-3 py-2 bg-black border border-gray-700 focus:border-white text-white font-mono text-sm outline-none transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-mono mb-2">
                      RELATIONSHIP/CONTEXT
                    </label>
                    <input
                      type="text"
                      value={activeSituation.personContext}
                      onChange={(e) =>
                        updateSituation(setActiveSituation, "personContext", e.target.value)
                      }
                      placeholder="e.g., Your coworker"
                      className="w-full px-3 py-2 bg-black border border-gray-700 focus:border-white text-white font-mono text-sm outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 font-mono mb-2">
                      TOPIC
                    </label>
                    <input
                      type="text"
                      value={activeSituation.topic}
                      onChange={(e) =>
                        updateSituation(setActiveSituation, "topic", e.target.value)
                      }
                      placeholder="e.g., work"
                      className="w-full px-3 py-2 bg-black border border-gray-700 focus:border-white text-white font-mono text-sm outline-none transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-mono mb-2">
                      TONE
                    </label>
                    <select
                      value={activeSituation.tone}
                      onChange={(e) =>
                        updateSituation(setActiveSituation, "tone", e.target.value as Tone)
                      }
                      className="w-full px-3 py-2 bg-black border border-gray-700 focus:border-white text-white font-mono text-sm outline-none transition-colors"
                    >
                      {TONES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-mono mb-2">
                      INTENT
                    </label>
                    <input
                      type="text"
                      value={activeSituation.intent}
                      onChange={(e) =>
                        updateSituation(setActiveSituation, "intent", e.target.value)
                      }
                      placeholder="e.g., small_talk"
                      className="w-full px-3 py-2 bg-black border border-gray-700 focus:border-white text-white font-mono text-sm outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Facts */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 font-mono mb-2">
                    FACTS (context for the AI judge)
                  </label>
                  {activeSituation.facts.map((fact, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={fact}
                        onChange={(e) =>
                          updateArrayItem(setActiveSituation, "facts", i, e.target.value)
                        }
                        placeholder={`Fact ${i + 1}`}
                        className="flex-1 px-3 py-2 bg-black border border-gray-700 focus:border-white text-white font-mono text-sm outline-none transition-colors"
                      />
                      {activeSituation.facts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayItem(setActiveSituation, "facts", i)}
                          className="px-3 py-2 border border-gray-700 text-gray-500 hover:border-red-500 hover:text-red-500 font-mono transition-colors"
                        >
                          [x]
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem(setActiveSituation, "facts")}
                    className="text-xs text-gray-500 hover:text-white font-mono transition-colors"
                  >
                    [+ ADD FACT]
                  </button>
                </div>

                {/* Initial Messages */}
                <div>
                  <label className="block text-xs text-gray-500 font-mono mb-2">
                    INITIAL MESSAGES (from them)
                  </label>
                  {activeSituation.messages.map((msg, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={msg}
                        onChange={(e) =>
                          updateArrayItem(setActiveSituation, "messages", i, e.target.value)
                        }
                        placeholder={`Message ${i + 1}`}
                        className="flex-1 px-3 py-2 bg-black border border-gray-700 focus:border-white text-white font-mono text-sm outline-none transition-colors"
                        required={i === 0}
                      />
                      {activeSituation.messages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayItem(setActiveSituation, "messages", i)}
                          className="px-3 py-2 border border-gray-700 text-gray-500 hover:border-red-500 hover:text-red-500 font-mono transition-colors"
                        >
                          [x]
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem(setActiveSituation, "messages")}
                    className="text-xs text-gray-500 hover:text-white font-mono transition-colors"
                  >
                    [+ ADD MESSAGE]
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 p-3 border border-red-500 text-red-500 font-mono text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-white text-black font-mono hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "[CREATING...]" : "[CREATE SCENARIO]"}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
