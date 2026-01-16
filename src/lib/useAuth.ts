"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user: fetchedUser } }: { data: { user: User | null } }) => {
      setUser(fetchedUser);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: { user: User | null } | null) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, loading };
}

// Function to save score (can be called from anywhere)
export async function saveScore(
  mode: string,
  score: number,
  roundsSurvived: number,
  scenarioId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        score,
        roundsSurvived,
        scenarioId,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      // 401 is expected for non-authenticated users, not an error
      if (res.status === 401) {
        return { success: false };
      }
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving score:", error);
    return { success: false, error: "Network error" };
  }
}
