"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { BookOpen, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("The looking glass did not recognise those credentials. Try again.");
      } else {
        window.location.href = "/";
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-purple-950 via-slate-900 to-emerald-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-amber-500/10 border border-amber-600/30 rounded-2xl shadow-lg mb-4">
            <BookOpen className="w-10 h-10 text-amber-500 animate-pulse" />
          </div>
          <h1 className="font-serif text-2xl font-extrabold text-amber-500 tracking-wide">
            Through the Looking Glass
          </h1>
          <p className="text-xs text-purple-300/50 font-mono uppercase tracking-widest mt-1">
            Step through to continue
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-purple-950/60 border border-amber-500/15 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-4"
        >
          {error && (
            <p className="text-xs text-red-300 bg-red-950/40 border border-red-500/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-amber-500/80 font-bold">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-purple-900/30 border border-amber-500/20 rounded-xl px-3 py-2.5 text-sm text-purple-100 placeholder-purple-300/30 focus:outline-none focus:border-amber-500/60 transition-colors"
              placeholder="alice@wonderland.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-amber-500/80 font-bold">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-purple-900/30 border border-amber-500/20 rounded-xl px-3 py-2.5 text-sm text-purple-100 placeholder-purple-300/30 focus:outline-none focus:border-amber-500/60 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 border border-amber-400 text-purple-950 font-serif font-extrabold text-xs uppercase tracking-widest rounded-xl hover:from-amber-400 hover:to-amber-500 active:scale-98 shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {loading ? "Opening the glass..." : "Step Through the Mirror"}
          </button>
        </form>
      </div>
    </div>
  );
}
