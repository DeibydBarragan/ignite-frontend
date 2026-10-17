"use client";

import { usePlayerStore } from "@/features/music/stores/player-store";
import { usePlaybackControls } from "@/hooks/use-playback-controls";
import { ScrubberTimeline } from "./scrubber-timeline";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Loader2,
} from "lucide-react";

export function PlayerTransport() {
  const hasSong = usePlayerStore((s) => s.currentSong !== null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isPlayerBusy = usePlayerStore((s) => s.isPlayerBusy);
  const pendingAction = usePlayerStore((s) => s.pendingAction);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);

  const {
    togglePlayPause,
    skipNext,
    skipPrevious,
    seekTo,
    toggleRepeat,
    toggleShuffle,
  } = usePlaybackControls();

  if (!hasSong) return null;

  return (
    <div className="flex flex-col items-center gap-1.5 w-full md:w-2/4">
      {/* Transport Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleShuffle}
          disabled={isPlayerBusy}
          title="Modo aleatorio"
          className={`p-1.5 rounded-lg transition-colors ${
            isPlayerBusy
              ? "opacity-40 cursor-not-allowed"
              : "cursor-pointer"
          } ${
            shuffle
              ? "text-[#1ed760] bg-[#1db954]/15"
              : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          <Shuffle size={14} />
        </button>

        <button
          onClick={skipPrevious}
          disabled={isPlayerBusy}
          title="Pista anterior / Reiniciar"
          className={`p-1.5 rounded-lg transition-colors ${
            isPlayerBusy
              ? "opacity-40 cursor-not-allowed"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
          }`}
        >
          {pendingAction === "previous" ? (
            <Loader2 size={17} className="animate-spin text-purple-400" />
          ) : (
            <SkipBack size={17} />
          )}
        </button>

        <button
          onClick={togglePlayPause}
          disabled={isPlayerBusy}
          aria-label={isPlaying ? "Pausar" : "Reproducir"}
          className={`h-10 w-10 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-lg shadow-[#1db954]/30 transition-all ${
            isPlayerBusy
              ? "opacity-60 cursor-not-allowed"
              : "hover:bg-[#1ed760] hover:scale-105 active:scale-95 cursor-pointer"
          }`}
        >
          {pendingAction === "toggle" ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={18} className="fill-current" />
          ) : (
            <Play size={18} className="fill-current ml-0.5" />
          )}
        </button>

        <button
          onClick={skipNext}
          disabled={isPlayerBusy}
          title="Siguiente pista (Skip)"
          className={`p-1.5 rounded-lg transition-colors ${
            isPlayerBusy
              ? "opacity-40 cursor-not-allowed"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
          }`}
        >
          {pendingAction === "skip" ? (
            <Loader2 size={17} className="animate-spin text-purple-400" />
          ) : (
            <SkipForward size={17} />
          )}
        </button>

        <button
          onClick={toggleRepeat}
          disabled={isPlayerBusy}
          title={
            repeatMode === "off"
              ? "Bucle desactivado"
              : repeatMode === "track"
              ? "Repetir tema actual"
              : "Repetir cola"
          }
          className={`p-1.5 rounded-lg transition-colors ${
            isPlayerBusy
              ? "opacity-40 cursor-not-allowed"
              : "cursor-pointer"
          } ${
            repeatMode !== "off"
              ? "text-[#1ed760] bg-[#1db954]/15"
              : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          {repeatMode === "track" ? <Repeat1 size={14} /> : <Repeat size={14} />}
        </button>
      </div>

      {/* Time Scrubber (Decoupled to ScrubberTimeline) */}
      <ScrubberTimeline onSeek={seekTo} />
    </div>
  );
}
