'use client';

import React from "react";
import { Sparkles } from "lucide-react";
import { DrinkMeUpload } from "./DrinkMeUpload";
import { SerializableDocument } from "../app/types";

interface DrinkMeSectionProps {
  isUploading: boolean;
  onUploadStart: () => void;
  onUploadSuccess: (doc: SerializableDocument) => void;
  onUploadError: (msg: string) => void;
}

export function DrinkMeSection({ isUploading, onUploadStart, onUploadSuccess, onUploadError }: DrinkMeSectionProps) {
  if (isUploading) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <div className="relative w-24 h-24 mb-6">
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
    );
  }

  return (
    <div className="w-full max-w-lg flex flex-col items-center">
      <div className="text-center mb-6">
        <h2 className="font-serif text-2xl text-amber-500 font-bold mb-2">Curiouser and Curiouser!</h2>
        <p className="text-xs text-purple-200/70 max-w-md mx-auto leading-relaxed">
          Adult students returning to college often face frighteningly dense textbooks. Pour a textbook screenshot below to easily read, listen, and dissect scholarly prose.
        </p>
      </div>
      <DrinkMeUpload
        onUploadStart={onUploadStart}
        onUploadSuccess={onUploadSuccess}
        onUploadError={onUploadError}
      />
    </div>
  );
}
