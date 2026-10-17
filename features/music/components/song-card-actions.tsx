"use client";

import type { Song } from "@/types/domain";
import type { FeedbackStatus } from "./song-cover-overlays";
import { Play, Plus, ListPlus, Loader2, Check } from "lucide-react";

export interface SongCardActionsProps {
  song: Song;
  isPlaying: boolean;
  isActionDisabled: boolean;
  isLoadingPlay: boolean;
  isLoadingNext: boolean;
  isLoadingQueue: boolean;
  nextFeedback: FeedbackStatus;
  queueFeedback: FeedbackStatus;
  onPlay: () => void;
  onPlayNext: () => void;
  onAddToQueue: () => void;
}

/**
 * Botones de acción de la tarjeta de canción, con diseño estilizado idéntico
 * a las tarjetas de playlist: Cola (+), Siguiente (ListPlus) y Reproducir (Play).
 */
export function SongCardActions({
  song,
  isPlaying,
  isActionDisabled,
  isLoadingPlay,
  isLoadingNext,
  isLoadingQueue,
  nextFeedback,
  queueFeedback,
  onPlay,
  onPlayNext,
  onAddToQueue,
}: SongCardActionsProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
      {/* 1. Botón Añadir a la cola (+) */}
      <button
        type="button"
        onClick={onAddToQueue}
        disabled={isActionDisabled}
        title={queueFeedback !== "idle" ? "¡Añadida a la cola!" : "Añadir a la cola"}
        aria-label={`Añadir ${song.title} a la cola`}
        className={`h-7.5 w-7.5 sm:h-8 sm:w-8 rounded-xl text-xs font-bold disabled:opacity-50 flex items-center justify-center transition-all duration-500 ease-out cursor-pointer disabled:cursor-not-allowed shadow-xs shrink-0 ${
          queueFeedback === "visible"
            ? "bg-[#1ed760] text-black scale-105"
            : queueFeedback === "fading"
            ? "bg-[#1db954] text-black scale-100"
            : "bg-[#1db954] hover:bg-[#1ed760] text-black"
        }`}
      >
        {isLoadingQueue ? (
          <Loader2 size={13} className="animate-spin text-black" />
        ) : queueFeedback !== "idle" ? (
          <Check
            size={14}
            strokeWidth={3}
            className={`text-black transition-all duration-700 ease-out ${
              queueFeedback === "fading" ? "opacity-0 scale-75" : "animate-in zoom-in opacity-100"
            }`}
          />
        ) : (
          <Plus size={15} strokeWidth={2.5} />
        )}
      </button>

      {/* 2. Botón Siguiente (en la mitad) con spinner durante carga y confirmación progresiva */}
      <button
        type="button"
        onClick={onPlayNext}
        disabled={isActionDisabled}
        title={
          nextFeedback !== "idle"
            ? "¡Añadido como siguiente!"
            : isLoadingNext
            ? "Poniendo siguiente..."
            : "Reproducir siguiente (salta la cola)"
        }
        aria-label={`Reproducir ${song.title} a continuación`}
        className={`h-7.5 w-7.5 sm:h-8 sm:w-8 rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-500 ease-out cursor-pointer disabled:cursor-not-allowed shrink-0 ${
          nextFeedback === "visible"
            ? "bg-purple-600/30 text-purple-300 border border-purple-500/50 ring-1 ring-purple-500/40 scale-105"
            : nextFeedback === "fading"
            ? "bg-purple-600/10 text-purple-300/60 border border-purple-500/20 scale-100"
            : "glass-btn text-slate-600 dark:text-slate-300 hover:text-purple-400 hover:border-purple-500/30"
        }`}
      >
        {isLoadingNext ? (
          <Loader2 size={13} className="animate-spin text-purple-400" />
        ) : nextFeedback !== "idle" ? (
          <Check
            size={13}
            className={`text-purple-300 transition-all duration-700 ease-out ${
              nextFeedback === "fading" ? "opacity-0 scale-75" : "animate-in zoom-in opacity-100"
            }`}
          />
        ) : (
          <ListPlus size={14} />
        )}
      </button>

      {/* 3. Botón Reproducir (Play, donde en playlist está fav) */}
      <button
        type="button"
        onClick={onPlay}
        disabled={isActionDisabled}
        title={
          isLoadingPlay
            ? "Cargando audio..."
            : isPlaying
            ? "Sonando ahora"
            : "Reproducir ahora (inmediato)"
        }
        aria-label={`Reproducir ${song.title}`}
        className={`h-7.5 w-7.5 sm:h-8 sm:w-8 rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shrink-0 ${
          isPlaying
            ? "border-[#1db954]/50 bg-[#1db954]/20 text-[#1ed760] shadow-xs ring-1 ring-[#1db954]/30"
            : "glass-btn text-slate-600 dark:text-slate-300 hover:text-[#1ed760] hover:border-[#1db954]/30"
        }`}
      >
        {isLoadingPlay ? (
          <Loader2 size={13} className="animate-spin text-[#1ed760]" />
        ) : (
          <Play size={13} className="fill-current text-slate-700 dark:text-slate-200 ml-0.5" />
        )}
      </button>
    </div>
  );
}
