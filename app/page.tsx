'use client';

/*
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? No
- Are there any placeholders or ellipsis (`...`) in this file? No
- Does this adhere perfectly to Hexagonal boundaries? Yes (Frontend delivery layer orchestrating components with standard React patterns)
- Revision Action Taken: Configured complete list mounting effects (`useEffect`), error clearing alerts, dual-page leather storybook responsive alignment, visual scrolling, mock floating tea-leaves or star backdrops, and seamless delete transitions.
*/

import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  HelpCircle, 
  Sparkles, 
  Trash2, 
  Plus, 
  RotateCcw,
  BookMarked,
  ArrowLeft,
  BookText
} from "lucide-react";
import { DrinkMeUpload } from "../components/DrinkMeUpload";
import { VintageAudioPlayer } from "../components/VintageAudioPlayer";
import { CaterpillarSmokeLoader } from "../components/CaterpillarSmokeLoader";

interface GlossaryItem {
  term: string;
  definition: string;
}

interface SerializableDocument {
  id: string;
  title: string;
  originalFilename: string;
  originalFilenames?: string[];
  extractedText?: string;
  audioUrl?: string;
  createdAt: string;
  explanation?: {
    explanationText: string;
    glossary: GlossaryItem[];
    focusSessionScript?: Array<{ speaker: "Narrator" | "Alice"; text: string }>;
  };
}

export default function Home() {
  const [documents, setDocuments] = useState<SerializableDocument[]>([]);
  const [activeDoc, setActiveDoc] = useState<SerializableDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [focusTimeMinutes, setFocusTimeMinutes] = useState<number>(10);

  // Fetch all existing documents from archive database on mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch("/api/documents");
        if (response.ok) {
          const data = await response.json();
          setDocuments(data);
          
          // Auto-select the most recent document if nothing is selected
          if (data.length > 0) {
            setActiveDoc(prev => prev || data[0]);
          }
        }
      } catch {
        setErrorMsg("Failed to connect to the looking glass library storage system.");
      }
    };

    fetchDocuments();
  }, []);

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you wish to dissolve this document back into the ether? All files will be purged.")) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
        if (activeDoc?.id === id) {
          setActiveDoc(null);
        }
      } else {
        const data = await response.json();
        setErrorMsg(data.error || "Failed to purge document details.");
      }
    } catch {
      setErrorMsg("Failed to connect to the looking glass database service.");
    }
  };

  const handleConsultCaterpillar = async () => {
    if (!activeDoc) return;

    try {
      setIsExplaining(true);
      setErrorMsg(null);

      const response = await fetch(`/api/documents/${activeDoc.id}/explain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ focusTimeMinutes })
      });

      const updatedDoc = await response.json();

      if (!response.ok) {
        throw new Error(updatedDoc.error || "The Wise Caterpillar could not be reached.");
      }

      // Update local states
      setActiveDoc(updatedDoc);
      
      // Update entry in full documents list
      setDocuments(prev => prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc));
    } catch (error) {
      setErrorMsg((error as Error).message);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleResetToUpload = () => {
    setActiveDoc(null);
    setErrorMsg(null);
  };

  return (
    <div className="relative min-h-screen bg-linear-to-b from-purple-950 via-slate-900 to-emerald-950 text-purple-100/90 overflow-x-hidden flex flex-col font-sans pb-12">
      
      {/* Whimsical interactive background element layer (e.g. glowing stars/tea leaves) */}
      <div className="absolute top-24 left-1/4 w-72 h-72 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-24 right-1/4 w-96 h-96 bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Primary Header Segment */}
      <header className="relative w-full border-b border-amber-500/10 bg-purple-950/60 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-600/30 rounded-xl shadow-lg">
            <BookOpen className="w-8 h-8 text-amber-500 animate-pulse" />
          </div>
          <div>
            <h1 className="font-serif text-2xl tracking-wide font-extrabold text-amber-500 text-shadow-sm">
              Through the Looking Glass
            </h1>
            <p className="text-xs text-purple-200/50 uppercase tracking-widest font-mono">
              Academic Transcriber & Comprehension Companion
            </p>
          </div>
        </div>

        {/* Global Controls & Library Summary */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-purple-300/40 uppercase font-mono">My Chronicles</p>
            <p className="text-xs text-amber-500/90 font-bold font-mono">
              {documents.length} {documents.length === 1 ? "Scroll" : "Scrolls"} Archived
            </p>
          </div>

          <button
            onClick={handleResetToUpload}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-amber-950 font-serif font-bold text-xs uppercase tracking-wide rounded-xl shadow-lg border border-amber-400 hover:bg-amber-400 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Distill New Scroll
          </button>
        </div>
      </header>

      {/* Main Application Inner Portal */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 pt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Historical Library Shelf */}
        <section className="lg:col-span-1 flex flex-col bg-purple-950/40 border border-amber-500/10 rounded-2xl p-4 shadow-2xl backdrop-blur-md max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-amber-500/15 pb-3 mb-4">
            <h2 className="font-serif text-base text-amber-500 flex items-center gap-2 font-bold">
              <BookMarked className="w-4 h-4" />
              The Library Shelf
            </h2>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-10 px-4">
              <BookText className="w-8 h-8 text-purple-300/20 mx-auto mb-2" />
              <p className="text-xs text-purple-200/40 leading-relaxed font-sans">
                No archived scrolls exist. Upload an academic textbook screenshot to begin your journey.
              </p>
            </div>
          ) : (
            <div className="space-y-2 flex-1">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    setActiveDoc(doc);
                    setErrorMsg(null);
                  }}
                  className={`w-full group text-left cursor-pointer p-3 rounded-xl border transition-all duration-300 relative flex items-center justify-between overflow-hidden ${
                    activeDoc?.id === doc.id
                      ? "border-amber-500 bg-linear-to-r from-purple-950 to-emerald-950/40 shadow-md"
                      : "border-amber-600/10 hover:border-amber-500/40 bg-purple-950/20 hover:bg-purple-900/10"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className={`text-xs font-serif truncate font-bold ${
                      activeDoc?.id === doc.id ? "text-amber-400" : "text-purple-100"
                    }`}>
                      {doc.title}
                    </p>
                    <p className="text-[9px] text-purple-200/40 truncate font-sans font-mono mt-0.5">
                      {doc.originalFilenames && doc.originalFilenames.length > 1
                        ? `📚 Stack of ${doc.originalFilenames.length} scrolls`
                        : doc.originalFilename}
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleDeleteDocument(doc.id, e)}
                    className="p-1.5 rounded-lg text-purple-200/30 hover:text-red-400 hover:bg-red-500/10 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Purge Scroll Details"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Tiny indicator badge for documents already explained */}
                  {doc.explanation && (
                    <div className="absolute right-1 top-1 w-1.5 h-1.5 bg-emerald-500 rounded-full" title="Caterpillar Explained" />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Columns: Main Storybook Board / Upload Window */}
        <section className="lg:col-span-3 flex flex-col justify-center">

          {/* Interactive Error Alert notification Banner */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 text-red-200 text-xs rounded-xl flex items-start gap-2.5 shadow-lg animate-fade-in">
              <HelpCircle className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">An anomaly has occurred</p>
                <p className="opacity-80 mt-0.5">{errorMsg}</p>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-red-400/60 hover:text-red-300 text-[10px] font-mono cursor-pointer uppercase font-bold px-1">
                Dismiss
              </button>
            </div>
          )}

          {/* Core Visual Toggle: Active Book vs Upload Potion State */}
          {!activeDoc ? (
            <div className="flex flex-col items-center justify-center p-4">
              {isUploading ? (
                <div className="flex flex-col items-center justify-center text-center py-20">
                  <div className="relative w-24 h-24 mb-6">
                    {/* Pulsing visual container */}
                    <div className="absolute inset-0 bg-amber-500/15 rounded-full animate-ping filter blur-lg" />
                    <div className="relative w-24 h-24 rounded-full border-2 border-dashed border-amber-500 flex items-center justify-center animate-spin">
                      <Sparkles className="w-10 h-10 text-amber-500" />
                    </div>
                  </div>
                  <h3 className="font-serif text-xl text-amber-500 font-bold mb-2">Brewing New Scroll</h3>
                  <p className="text-xs text-purple-200/60 font-sans max-w-sm leading-relaxed">
                    Analyzing screenshot visual layouts, transcribing dense academic glyphs, and preparing the golden hour custom audio podcast. Please wait...
                  </p>
                </div>
              ) : (
                <div className="w-full max-w-lg flex flex-col items-center">
                  <div className="text-center mb-6">
                    <h2 className="font-serif text-2xl text-amber-500 font-bold mb-2">Curiouser and Curiouser!</h2>
                    <p className="text-xs text-purple-200/70 max-w-md mx-auto leading-relaxed">
                      Adult students returning to college often face frighteningly dense textbooks. Pour a textbook screenshot below to easily read, listen, and dissect scholarly prose.
                    </p>
                  </div>
                  <DrinkMeUpload
                    onUploadStart={() => setIsUploading(true)}
                    onUploadSuccess={(doc) => {
                      setIsUploading(false);
                      setActiveDoc(doc);
                      // Prepend to archives
                      setDocuments(prev => [doc, ...prev]);
                    }}
                    onUploadError={(msg) => {
                      setIsUploading(false);
                      setErrorMsg(msg);
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            /* Leather storybook interface mockup */
            <div className="relative w-full flex flex-col gap-6 animate-fade-in">
              
              {/* Storybook Control Shelf */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-500/15 pb-4">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleResetToUpload}
                    className="p-2 bg-purple-900/30 hover:bg-purple-900/60 border border-amber-600/20 rounded-xl hover:text-amber-400 active:scale-95 transition-all text-purple-200/80 cursor-pointer"
                    title="Return to Screenshot Upload"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <span className="text-[9px] text-emerald-400 font-bold tracking-widest font-mono uppercase bg-emerald-950/60 border border-emerald-500/20 py-0.5 px-2 rounded-full">
                      Currently Reading
                    </span>
                    <h2 className="font-serif text-xl font-bold text-purple-100 mt-1">
                      {activeDoc.title}
                    </h2>
                  </div>
                </div>

                {/* Pocket watch controller and Audio mount point */}
                <div className="self-center flex items-center justify-center shrink-0">
                  <VintageAudioPlayer audioUrl={activeDoc.audioUrl} />
                </div>
              </div>

              {/* The Leather-bound Open Storybook Body */}
              <div 
                id="story-leather-book"
                className="grid grid-cols-1 md:grid-cols-2 gap-px bg-amber-900/30 rounded-3xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-amber-800/40 relative overflow-hidden backdrop-blur-xs min-h-[500px]"
              >
                {/* Book Gutter shadow divider */}
                <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 bg-linear-to-r from-black/40 via-black/10 to-black/40 border-x border-amber-950/20 z-10" />

                {/* PAGE 1 (Left Side): Extracted Textbook Screen Text */}
                <div className="bg-purple-950/85 p-6 md:p-8 rounded-t-2xl md:rounded-l-2xl md:rounded-r-none border-b md:border-b-0 md:border-r border-amber-800/20 flex flex-col max-h-[600px] overflow-hidden">
                  <div className="flex items-center justify-between border-b border-amber-500/10 pb-3 mb-4 select-none">
                    <span className="font-serif text-xs uppercase tracking-widest text-amber-500/70 font-bold flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Page I &bull; Original Transcript
                    </span>
                    <span className="text-[10px] text-purple-300/40 font-mono">
                      {activeDoc.originalFilenames && activeDoc.originalFilenames.length > 1
                        ? `Chapter Batch: ${activeDoc.originalFilenames.length} Pages`
                        : `File: ${activeDoc.originalFilename}`}
                    </span>
                  </div>

                  {/* Extracted text scrolling box */}
                  <div className="flex-1 overflow-y-auto whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed text-purple-100/90 pr-2 space-y-4">
                    {activeDoc.extractedText}
                  </div>
                </div>

                {/* PAGE 2 (Right Side): The Caterpillar's Translation Advice */}
                <div className="bg-purple-950/85 p-6 md:p-8 rounded-b-2xl md:rounded-r-2xl md:rounded-l-none flex flex-col max-h-[600px] overflow-hidden justify-between relative">
                  
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

                      {/* Advice content */}
                      {activeDoc.explanation ? (
                        <div className="flex-1 flex flex-col overflow-hidden">
                          {/* Inner Advice Scroll Box */}
                          <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4">
                            
                            {/* Standard text summary introduction */}
                            <div className="text-xs sm:text-sm leading-relaxed text-purple-100/90 space-y-3 font-medium mb-4">
                              <p className="italic text-amber-500/90 font-serif border-l-2 border-amber-600 pl-3">
                                &ldquo;Who are you?&rdquo; said the Caterpillar. 
                                This was not an encouraging opening. Nevertheless, he blew a puff of smoke and offered clear counsel...
                              </p>
                              {activeDoc.explanation.explanationText.split("\n\n").map((para, idx) => (
                                <p key={idx}>{para}</p>
                              ))}
                            </div>

                            {/* Dialogue rendering when focus script is present */}
                            {activeDoc.explanation.focusSessionScript && activeDoc.explanation.focusSessionScript.length > 0 && (
                              <div className="mt-6 border-t border-amber-500/10 pt-4 space-y-4">
                                <span className="font-serif text-xs uppercase tracking-widest text-amber-500/85 font-extrabold flex items-center gap-1.5 mb-2">
                                  {"☕ The Mad Hatter's Tea Time (Focus Session):"}
                                </span>
                                <div className="space-y-4 pr-1">
                                  {activeDoc.explanation.focusSessionScript.map((line, idx) => (
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
                            {activeDoc.explanation.glossary && activeDoc.explanation.glossary.length > 0 && (
                              <div className="mt-6 border-t border-amber-500/10 pt-4">
                                <h3 className="font-serif text-amber-500 text-xs font-bold uppercase tracking-wider mb-3">
                                  Glossary of Academic Glyphs:
                                </h3>
                                <div className="grid grid-cols-1 gap-2.5">
                                  {activeDoc.explanation.glossary.map((g, idx) => (
                                    <div key={idx} className="p-2 bg-emerald-950/30 border border-emerald-500/15 rounded-lg flex flex-col gap-0.5">
                                      <p className="text-[11px] font-bold text-amber-400 font-mono uppercase">{g.term}</p>
                                      <p className="text-[10px] text-purple-200/80 leading-relaxed">{g.definition}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Empty state: The Mad Hatter's Tea Time Trigger UI */
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
                                <span className="text-amber-400 font-bold font-serif">{focusTimeMinutes} Minutes</span>
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
                            onClick={handleConsultCaterpillar}
                            className="w-full max-w-xs py-3.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 border border-amber-400 text-purple-950 font-serif font-extrabold text-xs uppercase tracking-widest rounded-xl hover:from-amber-400 hover:to-amber-500 active:scale-97 shadow-xl shadow-amber-950/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Pour the Tea (Start Focus Session)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Back to upload trigger at bottom */}
              <div className="flex items-center justify-center mt-2 select-none">
                <button
                  onClick={handleResetToUpload}
                  className="text-xs text-amber-500/70 hover:text-amber-400 flex items-center gap-1 font-mono uppercase font-bold tracking-wider cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Erase and start a different study scroll
                </button>
              </div>

            </div>
          )}

        </section>

      </main>

    </div>
  );
}
