"use client";

/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? No
- Are there any placeholders or ellipsis (`...`) in this file? No
- Does this adhere perfectly to Hexagonal boundaries? Yes (Client Component UI adapter).
- Revision Action Taken: Built a robust NextAuth v5 client-side login implementation painted accurately inside the Wonderland aesthetic directives. Used Playfair Display and Inter fonts via CSS variables assumed injected by Next.js.
---
*/

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (response?.error) {
        setError("Invalid credentials. The Red Queen demands accuracy.");
        setIsLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("A mysterious anomaly occurred in Wonderland.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2e1065] text-gray-100 font-sans p-6">
      <div className="max-w-md w-full bg-[#1e0a4d] border border-[#ca8a04]/30 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        {/* Decorative Pocket Watch UI Accent */}
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <svg className="w-24 h-24 text-[#ca8a04]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-4xl font-serif text-[#ca8a04] mb-2 font-medium tracking-tight">Down the Rabbit Hole</h1>
          <p className="text-[#a78bfa] text-sm font-sans">Enter your credentials to access the looking glass.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-medium text-[#c4b5fd] mb-1" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#3b1c7a] border border-[#5b21b6] rounded-lg px-4 py-3 text-white placeholder-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#ca8a04]/50 focus:border-transparent transition-all"
              placeholder="alice@wonderland.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#c4b5fd] mb-1" htmlFor="password">
              Secret Passcode
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#3b1c7a] border border-[#5b21b6] rounded-lg px-4 py-3 text-white placeholder-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#ca8a04]/50 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-900/40 border border-red-500/50 text-red-200 text-sm flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#14532d] hover:bg-[#166534] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#2e1065] focus:ring-[#ca8a04] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Validating...
              </>
            ) : (
              "Cross the Looking Glass"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
