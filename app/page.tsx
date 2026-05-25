'use client';

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
import { CaterpillarAdvice } from "../components/CaterpillarAdvice";
import { SerializableDocument } from "./types";

export default function Home() {
  const [documents, setDocuments] = useState<SerializableDocument[]>([]);
  const [activeDoc, setActiveDoc] = useState<SerializableDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [focusTimeMinutes, setFocusTimeMinutes] = useState<number>(10);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch("/api/documents");
        if (response.ok) {
          const data = await response.json();
          setDocuments(data);
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
      const response = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
        if (activeDoc?.id === id) setActiveDoc(null);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focusTimeMinutes })
      });
      const updatedDoc = await response.json();
      if (!response.ok) throw new Error(updatedDoc.error || "The Wise Caterpillar could not be reached.");
      setActiveDoc(updatedDoc);
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
      <div className="absolute top-24 left-1/4 w-72 h-72 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-24 right-1/4 w-96 h-96 bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />

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

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 pt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">

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
                  onClick={() => { setActiveDoc(doc); setErrorMsg(null); }}
                  className={`w-full group text-left cursor-pointer p-3 rounded-xl border transition-all duration-300 relative flex items-center justify-between overflow-hidden ${
                    activeDoc?.id === doc.id
                      ? "border-amber-500 bg-linear-to-r from-purple-950 to-emerald-950/40 shadow-md"
                      : "border-amber-600/10 hover:border-amber-500/40 bg-purple-950/20 hover:bg-purple-900/10"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className={`text-xs font-serif truncate font-bold ${activeDoc?.id === doc.id ? "text-amber-400" : "text-purple-100"}`}>
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
                  {doc.explanation && (
                    <div className="absolute right-1 top-1 w-1.5 h-1.5 bg-emerald-500 rounded-full" title="Caterpillar Explained" />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-3 flex flex-col justify-center">
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

          {!activeDoc ? (
            <div className="flex flex-col items-center justify-center p-4">
              <DrinkMeSection
                isUploading={isUploading}
                onUploadStart={() => setIsUploading(true)}
                onUploadSuccess={(doc) => {
                  setIsUploading(false);
                  setActiveDoc(doc);
                  setDocuments(prev => [doc, ...prev]);
                }}
                onUploadError={(msg) => {
                  setIsUploading(false);
                  setErrorMsg(msg);
                }}
              />
            </div>
          ) : (
            <div className="relative w-full flex flex-col gap-6 animate-fade-in">
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
                <div className="self-center flex items-center justify-center shrink-0">
                  <VintageAudioPlayer audioUrl={activeDoc.audioUrl} />
                </div>
              </div>

              <div
                id="story-leather-book"
                className="grid grid-cols-1 md:grid-cols-2 gap-px bg-amber-900/30 rounded-3xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-amber-800/40 relative overflow-hidden backdrop-blur-xs min-h-[500px]"
              >
                <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 bg-linear-to-r from-black/40 via-black/10 to-black/40 border-x border-amber-950/20 z-10" />

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
                  <div className="flex-1 overflow-y-auto whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed text-purple-100/90 pr-2 space-y-4">
                    {activeDoc.extractedText}
                  </div>
                </div>

                <CaterpillarAdvice
                  document={activeDoc}
                  isExplaining={isExplaining}
                  focusTimeMinutes={focusTimeMinutes}
                  onSetFocusTimeMinutes={setFocusTimeMinutes}
                  onConsult={handleConsultCaterpillar}
                />
              </div>

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
