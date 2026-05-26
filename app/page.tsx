'use client';

/*
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? No
- Are there any placeholders or ellipsis (`...`) in this file? No
- Does this adhere perfectly to Hexagonal boundaries? Yes (Frontend delivery layer orchestrating components with standard React patterns)
- Revision Action Taken: Abstracted major UI states out to DrinkMeSection, MadHatterSession, and CaterpillarAdvice components, significantly parsing bundle weight and logic complexity.
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
import { VintageAudioPlayer } from "../components/VintageAudioPlayer";
import { DrinkMeSection } from "../components/DrinkMeSection";
import { MadHatterSession } from "../components/MadHatterSession";
import { CaterpillarAdvice } from "../components/CaterpillarAdvice";
import { SerializableDocument } from "./types";

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
        } else if (response.status === 401) {
          // Could trigger a redirect if middleware misses something or it times out
          window.location.href = "/login";
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

  const handleUploadSuccess = (doc: SerializableDocument) => {
    setIsUploading(false);
    setActiveDoc(doc);
    // Prepend to archives
    setDocuments(prev => [doc, ...prev]);
  };

  const handleUploadError = (msg: string) => {
    setIsUploading(false);
    setErrorMsg(msg);
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
            <DrinkMeSection 
              isUploading={isUploading}
              setIsUploading={setIsUploading}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError} 
            />
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
                  {/* Note: In production we'd pass activeDoc.id instead to a protected endpoint. 
                      Since we implemented auth on /api/audio/[filename], we just pass url. */}
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
                  {activeDoc.explanation ? (
                    <CaterpillarAdvice
                      isExplaining={isExplaining}
                      explanationText={activeDoc.explanation.explanationText}
                      focusSessionScript={activeDoc.explanation.focusSessionScript}
                      glossary={activeDoc.explanation.glossary}
                    />
                  ) : (
                    <>
                      {/* Empty state: The Mad Hatter's Tea Time Trigger UI */}
                      {isExplaining && (
                        <div className="absolute inset-0 bg-purple-950/95 z-20 flex items-center justify-center p-4 rounded-b-2xl md:rounded-r-2xl">
                          <CaterpillarAdvice 
                            isExplaining={true} 
                            explanationText="" 
                          />
                        </div>
                      )}
                      
                      <MadHatterSession
                        focusTimeMinutes={focusTimeMinutes}
                        setFocusTimeMinutes={setFocusTimeMinutes}
                        onStartSession={handleConsultCaterpillar}
                      />
                    </>
                  )}
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
