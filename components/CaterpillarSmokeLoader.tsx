'use client';

/*
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? No
- Are there any placeholders or ellipsis (`...`) in this file? No
- Does this adhere perfectly to Hexagonal boundaries? Yes (pure UI Presentation React Component)
- Revision Action Taken: Embedded custom high-performance raw CSS keyframes directly within a scoped <style> block inside the React element to guarantee fluid, multi-layered smoke rise-and-fade animations without requiring any modifications to external tailwind configuration files.
*/

import React from "react";

export function CaterpillarSmokeLoader() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-purple-950/40 rounded-2xl border border-amber-500/20 backdrop-blur-sm shadow-xl max-w-sm mx-auto">
      {/* Dynamic Scoped Keyframes for smooth smoke animation */}
      <style>{`
        @keyframes smokeFloatUp1 {
          0% {
            transform: translateY(20px) translateX(0px) scale(0.6);
            opacity: 0;
          }
          20% {
            opacity: 0.7;
          }
          70% {
            opacity: 0.3;
            transform: translateY(-40px) translateX(-15px) scale(1.1);
          }
          100% {
            transform: translateY(-80px) translateX(-30px) scale(1.4);
            opacity: 0;
          }
        }
        @keyframes smokeFloatUp2 {
          0% {
            transform: translateY(20px) translateX(0px) scale(0.5);
            opacity: 0;
          }
          25% {
            opacity: 0.6;
          }
          75% {
            opacity: 0.25;
            transform: translateY(-50px) translateX(15px) scale(1.0);
          }
          100% {
            transform: translateY(-95px) translateX(25px) scale(1.3);
            opacity: 0;
          }
        }
        @keyframes smokeFloatUp3 {
          0% {
            transform: translateY(20px) translateX(0px) scale(0.7);
            opacity: 0;
          }
          15% {
            opacity: 0.8;
          }
          80% {
            opacity: 0.2;
            transform: translateY(-60px) translateX(-5px) scale(1.2);
          }
          100% {
            transform: translateY(-110px) translateX(-10px) scale(1.5);
            opacity: 0;
          }
        }
        .animate-smoke-1 {
          animation: smokeFloatUp1 4s ease-out infinite;
        }
        .animate-smoke-2 {
          animation: smokeFloatUp2 4.5s ease-out infinite;
          animation-delay: 1.2s;
        }
        .animate-smoke-3 {
          animation: smokeFloatUp3 3.8s ease-out infinite;
          animation-delay: 2.5s;
        }
      `}</style>

      {/* Animation Area Container */}
      <div className="relative w-40 h-48 flex items-end justify-center mb-4">
        {/* Animated Smoke Puffs */}
        <div className="absolute left-1/2 bottom-24 -translate-x-1/2 pointer-events-none">
          {/* Smoke Puff 1 */}
          <svg className="absolute animate-smoke-1 w-10 h-10 text-purple-200/50 fill-current filter blur-xs" viewBox="0 0 24 24">
            <path d="M12 2a4 4 0 0 0-4 4 4 4 0 0 0 .15.93A5 5 0 0 0 4 11.5a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5 5 5 0 0 0-4.15-4.57c.1-.3.15-.62.15-.93a4 4 0 0 0-4-4z" />
          </svg>
          {/* Smoke Puff 2 */}
          <svg className="absolute animate-smoke-2 w-8 h-8 text-amber-100/40 fill-current filter blur-xs" viewBox="0 0 24 24">
            <path d="M12 2a4 4 0 0 0-4 4 4 4 0 0 0 .15.93A5 5 0 0 0 4 11.5a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5 5 5 0 0 0-4.15-4.57c.1-.3.15-.62.15-.93a4 4 0 0 0-4-4z" />
          </svg>
          {/* Smoke Puff 3 */}
          <svg className="absolute animate-smoke-3 w-12 h-12 text-purple-300/30 fill-current filter blur-sm" viewBox="0 0 24 24">
            <path d="M12 2a4 4 0 0 0-4 4 4 4 0 0 0 .15.93A5 5 0 0 0 4 11.5a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5 5 5 0 0 0-4.15-4.57c.1-.3.15-.62.15-.93a4 4 0 0 0-4-4z" />
          </svg>
        </div>

        {/* Caterpillar Hookah Vector Graphic */}
        <svg className="w-32 h-32 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Mushroom Cap Base */}
          <path d="M10 40c0-12 10-18 22-18s22 6 22 18H10z" fill="#1e1b4b" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="20" cy="28" r="2.5" fill="currentColor" />
          <circle cx="32" cy="25" r="2.5" fill="currentColor" />
          <circle cx="44" cy="29" r="2.5" fill="currentColor" />

          {/* Mushroom Stem */}
          <path d="M26 40v14a4 4 0 0 0 8 0V40" fill="#1e1b4b" stroke="currentColor" />

          {/* Hookah Bowl/Chamber on the Mushroom */}
          <path d="M27 12h10v6H27z" fill="currentColor" />
          <line x1="32" y1="18" x2="32" y2="22" stroke="currentColor" strokeWidth="3" />
          
          {/* Hookah Hose */}
          <path d="M37 15c8 1 12 6 12 12s-4 10-8 6-3-11 5-10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
          
          {/* Wise Caterpillar Cozy Outline */}
          <path d="M18 40c-2-3-5-2-7 0s-2 5 2 6 6-1 5-6" fill="#14532d" />
          
          {/* Floor outline */}
          <path d="M4 56h56" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      {/* Whimsical gold-pulsing loader explanation label */}
      <h3 className="font-serif text-lg tracking-wide text-amber-500 animate-pulse mb-1">
        Consulting the Caterpillar
      </h3>
      <p className="text-xs text-purple-200/80 font-sans leading-relaxed max-w-[280px]">
        The Caterpillar is inhaling deeply, analyzing dense syntax into clear advice...
      </p>
    </div>
  );
}
