"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <pre className="text-red-500 text-sm mb-6 font-mono">
{`
 _____ ____  ____   ___  ____ 
| ____|  _ \\|  _ \\ / _ \\|  _ \\
|  _| | |_) | |_) | | | | |_) |
| |___|  _ <|  _ <| |_| |  _ < 
|_____|_| \\_\\_| \\_\\\\___/|_| \\_\\
`}
        </pre>
        <h1 className="text-xl font-mono text-white mb-4">
          Authentication Failed
        </h1>
        <p className="text-gray-400 font-mono text-sm mb-8">
          Something went wrong during sign-in.
          <br />
          Please try again.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-colors font-mono"
        >
          [← RETURN HOME]
        </Link>
      </motion.div>
    </div>
  );
}
