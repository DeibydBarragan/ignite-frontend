"use client";

import type { Song } from "@/types/domain";
import { Play, Plus, ListPlus, Loader2, Check } from "lucide-react";

export interface SongCardActionsProps {
  song: Song;
  isPlaying: boolean;
  isActionDisabled: boolean;
  isLoadingPlay: boolean;
  isLoadingNext: boolean;
  isLoadingQueue: boolean;
  showNextFeedback: boolean;
  showQueueFeedback: boolean;
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
  showNextFeedback,
  showQueueFeedback,
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
        title={showQueueFeedback ? "¡Añadida a la cola!" : "Añadir a la cola"}
        aria-label={`Añadir ${song.title} a la cola`}
        className="h-7.5 w-7.5 sm:h-8 sm:w-8 rounded-xl text-xs font-bold bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-50 text-black flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs shrink-0"
      >
        {isLoadingQueue ? (
          <Loader2 size={13} className="animate-spin text-black" />
        ) : showQueueFeedback ? (
          <Check size={14} strokeWidth={3} className="text-black animate-in zoom-in" />
        ) : (
          <Plus size={15} strokeWidth={2.5} />
        )}
      </button>

      {/* 2. Botón Siguiente (en la mitad) */}
      <button
        type="button"
        onClick={onPlayNext}
        disabled={isActionDisabled}
        title={
          showNextFeedback
            ? "¡Añadido como siguiente!"
            : isLoadingNext
            ? "Poniendo siguiente..."
            : "Reproducir siguiente (salta la cola)"
        }
        aria-label={`Reproducir ${song.title} a continuación`}
        className={`h-7.5 w-7.5 sm:h-8 sm:w-8 rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shrink-0 ${
          showNextFeedback
            ? "bg-purple-600/30 text-purple-300 border border-purple-500/50 ring-1 ring-purple-500/40 scale-105"
            : "glass-btn text-slate-600 dark:text-slate-300 hover:text-purple-400 hover:border-purple-500/30"
        }`}
      >
        {showNextFeedback ? (
          <Check size={13} className="text-purple-300 animate-in zoom-in" />
        ) : isLoadingNext ? (
          <Loader2 size={13} className="animate-spin text-purple-400" />
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
