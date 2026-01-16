"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

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
  }, [supabase.auth]);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowMenu(false);
  };

  const signInWithProvider = async (provider: "google" | "github") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  if (loading) {
    return (
      <div className="w-8 h-8 border border-gray-700 flex items-center justify-center">
        <span className="text-gray-500 animate-pulse">...</span>
      </div>
    );
  }

  if (user) {
    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "User";

    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-3 py-2 border border-gray-700 hover:border-white transition-colors font-mono text-sm"
        >
          <span className="text-gray-400">[</span>
          <span className="text-white max-w-24 truncate">{displayName}</span>
          <span className="text-gray-400">]</span>
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-48 bg-black border border-gray-700 z-50"
            >
              <div className="px-3 py-2 border-b border-gray-800">
                <p className="text-xs text-gray-500 font-mono truncate">
                  {user.email}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full px-3 py-2 text-left text-sm font-mono text-gray-400 hover:bg-white hover:text-black transition-colors"
              >
                [x] Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowSignInModal(true)}
        className="px-3 py-2 border border-gray-700 hover:border-white hover:bg-white hover:text-black transition-colors font-mono text-sm"
      >
        [SIGN IN]
      </button>

      <AnimatePresence>
        {showSignInModal && (
          <SignInModal
            onClose={() => setShowSignInModal(false)}
            onGoogleSignIn={() => signInWithProvider("google")}
            onGitHubSignIn={() => signInWithProvider("github")}
            onEmailSignIn={signInWithEmail}
          />
        )}
      </AnimatePresence>
    </>
  );
}

interface SignInModalProps {
  onClose: () => void;
  onGoogleSignIn: () => void;
  onGitHubSignIn: () => void;
  onEmailSignIn: (email: string) => Promise<{ error: Error | null }>;
}

function SignInModal({
  onClose,
  onGoogleSignIn,
  onGitHubSignIn,
  onEmailSignIn,
}: SignInModalProps) {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setEmailLoading(true);
    setEmailError("");

    const { error } = await onEmailSignIn(email);

    if (error) {
      setEmailError("Failed to send magic link. Please try again.");
    } else {
      setEmailSent(true);
    }
    setEmailLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-black border border-gray-700 p-6"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors font-mono"
        >
          [x]
        </button>

        <h2 className="text-xl font-mono text-white mb-2">SIGN IN</h2>
        <p className="text-sm text-gray-500 font-mono mb-6">
          Save scores and create scenarios
        </p>

        {emailSent ? (
          <div className="text-center py-8">
            <div className="text-green-400 font-mono mb-4">[✓]</div>
            <p className="text-white font-mono mb-2">Check your email!</p>
            <p className="text-sm text-gray-500 font-mono">
              We sent a magic link to
              <br />
              <span className="text-gray-400">{email}</span>
            </p>
          </div>
        ) : (
          <>
            {/* OAuth buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={onGoogleSignIn}
                className="w-full py-3 border border-gray-700 hover:border-white hover:bg-white hover:text-black transition-colors font-mono text-sm flex items-center justify-center gap-2"
              >
                <GoogleIcon />
                Continue with Google
              </button>
              <button
                onClick={onGitHubSignIn}
                className="w-full py-3 border border-gray-700 hover:border-white hover:bg-white hover:text-black transition-colors font-mono text-sm flex items-center justify-center gap-2"
              >
                <GitHubIcon />
                Continue with GitHub
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 border-t border-gray-800" />
              <span className="text-gray-600 font-mono text-xs">or</span>
              <div className="flex-1 border-t border-gray-800" />
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailSubmit}>
              <label className="block text-xs text-gray-500 font-mono mb-2">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 bg-black border border-gray-700 focus:border-white text-white font-mono text-sm mb-3 outline-none transition-colors"
              />
              {emailError && (
                <p className="text-red-500 text-xs font-mono mb-3">
                  {emailError}
                </p>
              )}
              <button
                type="submit"
                disabled={emailLoading || !email}
                className="w-full py-3 bg-white text-black font-mono text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {emailLoading ? "SENDING..." : "SEND MAGIC LINK"}
              </button>
            </form>
          </>
        )}

        {/* Corner decorations */}
        <span className="absolute top-0 left-0 text-gray-700 text-xs">+</span>
        <span className="absolute top-0 right-0 text-gray-700 text-xs">+</span>
        <span className="absolute bottom-0 left-0 text-gray-700 text-xs">+</span>
        <span className="absolute bottom-0 right-0 text-gray-700 text-xs">+</span>
      </motion.div>
    </motion.div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
