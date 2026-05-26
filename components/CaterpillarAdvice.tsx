"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { CaterpillarSmokeLoader } from "./CaterpillarSmokeLoader";

interface GlossaryItem {
  term: string;
  definition: string;
}

interface FocusSessionLine {
  speaker: "Narrator" | "Alice";
  text: string;
}

interface CaterpillarAdviceProps {
  isExplaining: boolean;
  explanationText: string;
  focusSessionScript?: FocusSessionLine[];
  glossary?: GlossaryItem[];
}

export function CaterpillarAdvice({
  isExplaining,
  explanationText,
  focusSessionScript,
  glossary,
}: CaterpillarAdviceProps) {
  return (
    <>
      {/* Smoke puff loading mask */}
      {isExplaining && (
        <div className="absolute inset-0 bg-purple-950/95 z-20 flex items-center justify-center p-4 rounded-b-2xl md:rounded-r-2xl">
          <CaterpillarSmokeLoader />
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden justify-between">
        <div className="w-full flex flex-col flex-1 overflow-hidden">
          {/* Page Header */}
          <div className="flex items-center justify-between border-b border-amber-500/10 pb-3 mb-4 select-none">
            <span className="font-serif text-xs uppercase tracking-widest text-amber-500/70 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Page II &bull; Wise Advice
            </span>
            <span className="text-[10px] text-emerald-400 font-mono tracking-wider">
              Hookah Wisdom Filtered
            </span>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Inner Advice Scroll Box */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4">
              {/* Standard text summary introduction */}
              <div className="text-xs sm:text-sm leading-relaxed text-purple-100/90 space-y-3 font-medium mb-4">
                <p className="italic text-amber-500/90 font-serif border-l-2 border-amber-600 pl-3">
                  &ldquo;Who are you?&rdquo; said the Caterpillar. This was not
                  an encouraging opening. Nevertheless, he blew a puff of smoke
                  and offered clear counsel...
                </p>
                {explanationText.split("\n\n").map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>

              {/* Dialogue rendering when focus script is present */}
              {focusSessionScript && focusSessionScript.length > 0 && (
                <div className="mt-6 border-t border-amber-500/10 pt-4 space-y-4">
                  <span className="font-serif text-xs uppercase tracking-widest text-amber-500/85 font-extrabold flex items-center gap-1.5 mb-2">
                    {"☕ The Mad Hatter's Tea Time (Focus Session):"}
                  </span>
                  <div className="space-y-4 pr-1">
                    {focusSessionScript.map((line, idx) => (
                      <div key={idx} className="space-y-1">
                        {line.speaker === "Narrator" ? (
                          <div className="bg-purple-50/95 text-purple-950 p-3.5 rounded-r-xl rounded-bl-xl border-l-4 border-amber-600 shadow-md">
                            <div className="flex items-center justify-between mb-1 opacity-80 select-none">
                              <span className="font-serif font-extrabold text-[10px] uppercase tracking-wider text-purple-900">
                                Narrator
                              </span>
                            </div>
                            <p className="font-serif text-xs sm:text-sm leading-relaxed text-purple-950 font-medium">
                              {line.text}
                            </p>
                          </div>
                        ) : (
                          <div className="ml-6 pl-2 flex items-start gap-2 bg-emerald-50 text-emerald-950 p-3.5 rounded-l-xl rounded-br-xl border-r-4 border-emerald-600 shadow-md">
                            <div className="p-1.5 bg-emerald-500/10 rounded-lg shrink-0 mt-0.5 select-none">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1 opacity-80 select-none">
                                <span className="font-sans font-extrabold text-[10px] uppercase tracking-wider text-emerald-900">
                                  Alice (The Student)
                                </span>
                              </div>
                              <p className="font-sans italic text-xs sm:text-sm leading-relaxed text-emerald-950">
                                &ldquo;{line.text}&rdquo;
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Glossary Divider Segment if entries present */}
              {glossary && glossary.length > 0 && (
                <div className="mt-6 border-t border-amber-500/10 pt-4">
                  <h3 className="font-serif text-amber-500 text-xs font-bold uppercase tracking-wider mb-3">
                    Glossary of Academic Glyphs:
                  </h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {glossary.map((g, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-emerald-950/30 border border-emerald-500/15 rounded-lg flex flex-col gap-0.5"
                      >
                        <p className="text-[11px] font-bold text-amber-400 font-mono uppercase">
                          {g.term}
                        </p>
                        <p className="text-[10px] text-purple-200/80 leading-relaxed">
                          {g.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
