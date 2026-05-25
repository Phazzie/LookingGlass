'use client';

/*
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? No
- Are there any placeholders or ellipsis (`...`) in this file? No
- Does this adhere perfectly to Hexagonal boundaries? Yes (pure UI Presentation React Component, interacts with endpoints via standard fetch APIs)
- Revision Action Taken: Integrated drag-and-drop triggers, click execution, correct file validation schemas to restrict uploads exclusively to images, and clean visual feedback representing potion glowing effects.
*/

import React, { useState, useRef } from "react";
import { Upload, Sparkles, AlertCircle } from "lucide-react";

interface DrinkMeUploadProps {
  onUploadStart: () => void;
  onUploadSuccess: (documentData: any) => void;
  onUploadError: (errorMessage: string) => void;
}

export function DrinkMeUpload({
  onUploadStart,
  onUploadSuccess,
  onUploadError,
}: DrinkMeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (isProcessing) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processUploadFiles(Array.from(files));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processUploadFiles(Array.from(files));
    }
  };

  const triggerFileInput = () => {
    if (isProcessing) return;
    fileInputRef.current?.click();
  };

  const processUploadFiles = async (files: File[]) => {
    // 1. Verification of Image Type & Payload Bounds
    let totalSize = 0;
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        onUploadError("Only screenshot image files (PNG, JPEG, WebP) are allowed.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        onUploadError(`The scroll "${file.name}" is too heavy (Max 5MB per file).`);
        return;
      }
      totalSize += file.size;
    }

    if (totalSize > MAX_TOTAL_SIZE) {
       onUploadError("Your stack of scrolls is too thick! (Max 20MB total batch size).");
       return;
    }

    try {
      setIsProcessing(true);
      setUploadingCount(files.length);
      onUploadStart();

      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong during potion brewing.");
      }

      onUploadSuccess(data);
    } catch (error) {
      const msg = (error as Error).message || "Failed to process screenshots.";
      onUploadError(msg);
    } finally {
      setIsProcessing(false);
      setUploadingCount(0);
      // Reset input value to allow uploading same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Hidden File Input */}
      <input
        id="screenshot-file-input"
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Large Glowing Potion Bottle Container */}
      <div
        id="potion-bottle-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`relative cursor-pointer transition-all duration-500 rounded-3xl p-6 flex flex-col items-center justify-center border-2 border-dashed h-96 select-none bg-radial from-purple-950 via-purple-900 to-indigo-950 ${
          isDragging
            ? "border-amber-400 scale-102 shadow-[0_0_40px_rgba(245,158,11,0.5)] bg-purple-900"
            : "border-amber-600/40 hover:border-amber-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.25)] shadow-xl"
        }`}
      >
        {/* Glow core */}
        <div className="absolute inset-0 bg-amber-500/5 rounded-3xl pointer-events-none filter blur-xl animate-pulse" />

        {/* Potion Top / Cork */}
        <div className="w-12 h-6 bg-amber-700/80 border-2 border-amber-600 rounded-t-lg -mt-8 mb-2 flex items-center justify-center shadow-inner">
          <div className="w-8 h-2 bg-amber-950/40 rounded-full" />
        </div>
        <div className="w-6 h-6 bg-purple-950/60 border-x-2 border-amber-600 mb-1" />

        {/* Potion Liquid Graphic */}
        <div className="relative w-28 h-36 border-4 border-amber-500/80 rounded-b-full rounded-t-3xl overflow-hidden bg-purple-950/70 flex flex-col items-center justify-end shadow-2xl mb-4">
          {/* Animated Liquid level */}
          <div
            className={`absolute bottom-0 left-0 right-0 transition-all duration-700 ease-in-out bg-linear-to-t from-purple-900 via-indigo-950 to-purple-800 border-t-2 border-purple-400/40 ${
              isProcessing ? "h-[85%] animate-pulse" : isDragging ? "h-[70%]" : "h-[45%]"
            }`}
          >
            {/* Liquid Bubbles floating upward */}
            <div className="absolute bottom-2 left-6 w-2 h-2 rounded-full bg-purple-400/60 animate-bounce" />
            <div className="absolute bottom-6 right-8 w-1.5 h-1.5 rounded-full bg-amber-400/50 animate-ping" />
            <div className="absolute bottom-12 left-10 w-2.5 h-2.5 rounded-full bg-purple-300/40 animate-bounce [animation-delay:0.5s]" />
          </div>

          {/* DRINK ME label tied to the neck of bottle */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
            <div className="bg-amber-100 text-amber-950 border border-amber-800/60 text-[9px] font-serif uppercase py-1 px-3 rounded shadow-md transform -rotate-6 flex items-center gap-1 font-bold">
              <Sparkles className="w-2 h-2 text-amber-700 animate-pulse" />
              DRINK ME
              <Sparkles className="w-2 h-2 text-amber-700 animate-pulse" />
            </div>
            {/* Tag hanging string */}
            <div className="w-0.5 h-6 bg-amber-800 -mt-1" />
          </div>

          {/* Interactive Upload icons inside the bottle structure */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center z-20">
            <Upload
              className={`w-8 h-8 transition-all duration-300 ${
                isProcessing ? "text-amber-500 animate-bounce" : "text-amber-400/90"
              }`}
            />
          </div>
        </div>

        {/* Text descriptions underneath the graphic */}
        <div className="text-center z-10 px-2 mt-2">
          {isProcessing ? (
            <div>
              <p className="font-serif text-amber-500 text-sm animate-pulse flex items-center justify-center gap-1">
                {uploadingCount > 1 ? `Brewing a stack of ${uploadingCount} scrolls...` : "Distilling Screenshots..."}
              </p>
              <p className="text-[10px] text-purple-200/60 mt-1 max-w-[200px] mx-auto">
                {uploadingCount > 1 
                  ? `Gemini is transcribing these ${uploadingCount} textbook pages into a cohesive story.`
                  : "Gemini is transcribing scholarly glyphs with visual sorcery."}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-serif text-amber-500 text-sm font-semibold hover:text-amber-400 transition-colors">
                {isDragging ? "Drop your dense text here!" : "Pour in a Screenshot"}
              </p>
              <p className="text-[10px] text-purple-200/60 mt-1 max-w-[200px] mx-auto line-clamp-2">
                Drag textbook image files directly or click to pick from standard archives.
              </p>
            </div>
          )}
        </div>

        {/* Informative size limitations */}
        <div className="absolute bottom-3 text-[9px] text-purple-300/40">
          Accepts PNG, JPG, WebP images
        </div>
      </div>
    </div>
  );
}
