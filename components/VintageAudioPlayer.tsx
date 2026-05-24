'use client';

/*
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? No
- Are there any placeholders or ellipsis (`...`) in this file? No
- Does this adhere perfectly to Hexagonal boundaries? Yes (pure UI Presentation React Component, delegates audio file feeds to browser streaming tags)
- Revision Action Taken: Integrated circular standard SVG dash offsets, responsive HTML5 audio state listener hooks (timeupdate, loadedmetadata, ended), tick configurations, and a vintage watch chain link handle on top.
*/

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";

interface VintageAudioPlayerProps {
  audioUrl: string | undefined;
}

export function VintageAudioPlayer({ audioUrl }: VintageAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // SVG Progress Ring Parameters
  const radius = 68;
  const circumference = 2 * Math.PI * radius; // Approx 427.25
  const progressOffset = duration > 0 ? circumference - (currentTime / duration) * circumference : circumference;

  useEffect(() => {
    // Reset play state if Audio URL changes or triggers unmount asynchronously
    const t = setTimeout(() => {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }, 0);
    
    if (audioRef.current) {
      audioRef.current.load();
    }

    return () => clearTimeout(t);
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioUrl || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (!isPlaying) {
        audioRef.current.play()
          .then(() => setIsPlaying(true));
      }
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 px-4">
      {/* Underlying Audio Element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
        />
      )}

      {/* Pocket Watch Winding Loop Ring Ornament on Top */}
      <div className="w-10 h-8 border-4 border-amber-600 rounded-lg flex items-center justify-center -mb-2 z-10 bg-amber-500/20 shadow-lg">
        <div className="w-4 h-3 bg-amber-500 border border-amber-600 rounded-sm" />
      </div>

      {/* Master Pocket Watch Body */}
      <div
        id="pocket-watch-body"
        className="relative w-44 h-44 rounded-full bg-linear-to-b from-purple-950 via-purple-900 to-indigo-950 border-4 border-amber-500 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.35),inset_0_0_20px_rgba(0,0,0,0.6)]"
      >
        {/* Ornate Gold Outer Clock Dial Marker Lines */}
        <div className="absolute inset-0 rounded-full pointer-events-none p-1">
          <div className="relative w-full h-full">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1.5 left-1/2 w-0.5 h-2 bg-amber-500/45 origin-[center_78px] -translate-x-1/2"
                style={{ transform: `rotate(${i * 30}deg)` }}
              />
            ))}
          </div>
        </div>

        {/* Circular Progress Path Wrapper */}
        <svg className="absolute w-40 h-40 transform -rotate-90 pointer-events-none">
          {/* Static Background Rail */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="rgb(245 158 11 / 0.1)"
            strokeWidth="3.5"
          />
          {/* Animated Gold Ring indicating current track elapsed path */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="rgb(245 158 11)"
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Inner Clock Face details */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          
          {/* Ticking Pendulum Center Segment */}
          <div className="flex items-center gap-1.5 text-amber-500/80 mb-1.5">
            <button
              onClick={toggleMute}
              disabled={!audioUrl}
              className="p-1 hover:text-amber-400 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <span className="text-[10px] font-mono tracking-wider font-bold">
              {formatTime(currentTime)}
            </span>
          </div>

          {/* Master Circular Play/Pause Anchor */}
          <button
            onClick={togglePlay}
            disabled={!audioUrl}
            className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:bg-amber-700/30 disabled:text-amber-500/40 disabled:cursor-not-allowed flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 text-amber-950 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-1" />
            )}
          </button>

          {/* Restart Button & Duration Indicator */}
          <div className="flex items-center gap-1.5 text-amber-500/80 mt-1.5">
            <button
              onClick={handleRestart}
              disabled={!audioUrl}
              className="p-1 hover:text-amber-400 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              title="Restart Narrator"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono tracking-wider font-semibold opacity-70">
              {formatTime(duration)}
            </span>
          </div>

        </div>
      </div>

      {/* Decorative Brand Text Label underneath watch body */}
      <div className="text-center mt-3 select-none">
        <p className="font-serif text-[11px] text-amber-500 font-bold tracking-widest uppercase mb-0.5">
          THE GOLDEN HOUR
        </p>
        <p className="font-sans text-[9px] text-purple-200/50">
          {audioUrl ? "Spoken glyph audiobook narration ready" : "Awaiting screenshot distillation"}
        </p>
      </div>
    </div>
  );
}
