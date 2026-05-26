"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface MadHatterSessionProps {
  focusTimeMinutes: number;
  setFocusTimeMinutes: (minutes: number) => void;
  onStartSession: () => void;
}

export function MadHatterSession({
  focusTimeMinutes,
  setFocusTimeMinutes,
  onStartSession,
}: MadHatterSessionProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
      <div className="relative w-16 h-16 rounded-full bg-amber-500/15 border border-amber-600/30 flex items-center justify-center shadow-lg animate-bounce mb-4">
        <Sparkles className="w-8 h-8 text-amber-500" />
      </div>

      <h3 className="font-serif text-lg text-amber-500 font-bold mb-1">
        {"The Mad Hatter's Tea Time"}
      </h3>
      <p className="text-xs text-purple-200/60 max-w-xs font-sans leading-relaxed mb-4">
        {"Dense academic texts cause worry. Let's box your study session! Select a duration, and the Wise Caterpillar will brew a perfectly paced dialogue."}
      </p>

      {/* Interactive slider question panel */}
      <div className="w-full max-w-xs bg-purple-900/25 border border-amber-500/10 rounded-xl p-4.5 mb-5 space-y-3.5 text-left">
        <label className="block text-[10px] uppercase font-mono tracking-wider text-amber-500/90 font-bold text-center">
          How much time would you like to dedicate to this scroll?
        </label>

        {/* Slider */}
        <div className="space-y-1">
          <input
            type="range"
            min="1"
            max="30"
            value={focusTimeMinutes}
            onChange={(e) => setFocusTimeMinutes(parseInt(e.target.value, 10))}
            className="w-full h-1 bg-amber-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between font-mono text-[9px] text-purple-300/40">
            <span>1 min</span>
            <span className="text-amber-400 font-bold font-serif">
              {focusTimeMinutes} Minutes
            </span>
            <span>30 min</span>
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {[5, 10, 15, 20].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFocusTimeMinutes(t)}
              className={`py-1 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer text-center ${
                focusTimeMinutes === t
                  ? "bg-amber-500 border-amber-400 text-amber-950 font-extrabold shadow-sm"
                  : "bg-purple-950/40 border-amber-500/10 text-purple-300/60 hover:border-amber-500/30 hover:text-amber-400"
              }`}
            >
              {t}m
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onStartSession}
        className="w-full max-w-xs py-3.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 border border-amber-400 text-purple-950 font-serif font-extrabold text-xs uppercase tracking-widest rounded-xl hover:from-amber-400 hover:to-amber-500 active:scale-97 shadow-xl shadow-amber-950/20 transition-all cursor-pointer flex items-center justify-center gap-2"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Pour the Tea (Start Focus Session)
      </button>
    </div>
  );
}
