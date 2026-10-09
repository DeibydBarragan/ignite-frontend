"use client";

import { useBot } from "@/context/bot-context";
import { useState } from "react";
import { QueueDrawer } from "@/components/music/queue-drawer";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  ListMusic,
  ExternalLink,
  Loader2,
  Star,
} from "lucide-react";

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function PlayerBar() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    repeatMode,
    shuffle,
    queue,
    togglePlayPause,
    skipNext,
    skipPrevious,
    seekTo,
    toggleRepeat,
    toggleShuffle,
    isPlayerBusy,
    pendingAction,
    isFavorite,
    toggleFavorite,
  } = useBot();

  const [isQueueOpen, setIsQueueOpen] = useState(false);

  if (!currentSong) return null;

  const isFav = isFavorite(currentSong.id) || isFavorite(currentSong.url);

  const currentDuration = currentSong.duration || 180;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / currentDuration) * 100));

  return (
    <>
      <div className="fixed bottom-3 inset-x-3 sm:inset-x-6 z-40 max-w-7xl mx-auto">
        <div className="glass-panel p-3 sm:py-2.5 sm:px-4 border border-black/10 dark:border-white/10 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6">
            {/* Left: Song Info */}
            <div className="flex items-center gap-3 w-full md:w-1/4 min-w-0">
              <div className="relative group shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentSong.albumArt}
                  alt={currentSong.title}
                  className="w-12 h-12 rounded-xl object-cover ring-1 ring-black/10 dark:ring-white/10 shadow-md"
                />
                <a
                  href={currentSong.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Abrir enlace original"
                  className="absolute inset-0 bg-black/50 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {currentSong.title}
                  </h4>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                    {currentSong.source}
                  </span>
                  {isPlayerBusy && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-500 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 animate-pulse shrink-0">
                      <Loader2 size={9} className="animate-spin" />
                      <span>
                        {pendingAction === "skip"
                          ? "Saltando pista..."
                          : pendingAction === "previous"
                          ? "Pista anterior..."
                          : pendingAction === "toggle"
                          ? isPlaying
                            ? "Pausando..."
                            : "Reanudando..."
                          : "Cargando..."}
                      </span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {currentSong.artist}
                </p>
              </div>

              <button
                onClick={() => toggleFavorite(currentSong)}
                title={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                  isFav
                    ? "text-amber-400 bg-amber-400/10 hover:bg-amber-400/20"
                    : "text-slate-400 hover:text-amber-400 hover:bg-amber-400/10"
                }`}
              >
                <Star size={16} className={isFav ? "fill-amber-400" : ""} />
              </button>
            </div>

            {/* Center: Controls + Time Scrubber */}
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

              {/* Time Scrubber (Minute & Second Counter) */}
              <div className="w-full flex items-center gap-2.5 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                <span className="w-9 text-right font-medium">
                  {formatDuration(currentTime)}
                </span>

                <div className="relative flex-1 group flex items-center">
                  <input
                    type="range"
                    min={0}
                    max={currentDuration}
                    value={currentTime}
                    disabled={isPlayerBusy}
                    onChange={(e) => seekTo(Number(e.target.value))}
                    className={`w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full appearance-none accent-[#1db954] focus:outline-none ${
                      isPlayerBusy ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    }`}
                    style={{
                      background: `linear-gradient(to right, #1db954 ${progressPercent}%, rgba(255,255,255,0.1) ${progressPercent}%)`,
                    }}
                  />
                </div>

                <span className="w-9 text-left font-medium">
                  {formatDuration(currentDuration)}
                </span>
              </div>
            </div>

            {/* Right: Queue Button */}
            <div className="flex items-center justify-end gap-3 w-full md:w-1/4">
              <button
                onClick={() => setIsQueueOpen(true)}
                className="glass-btn px-2.5 py-1.5 text-xs flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:border-purple-500/30 cursor-pointer"
              >
                <ListMusic size={15} />
                <span>Cola</span>
                <span className="px-1.5 py-0.2 rounded-full bg-purple-600/20 text-purple-400 font-bold text-[10px] border border-purple-500/30">
                  {queue.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <QueueDrawer isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
    </>
  );
}
