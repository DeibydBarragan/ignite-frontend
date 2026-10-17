"use client";

import { usePlayerStore } from "@/features/music/stores/player-store";
import { usePlaybackControls } from "@/hooks/use-playback-controls";
import { CoverImage } from "@/components/ui/cover-image";
import { Play, Pause, SkipBack, SkipForward, Loader2, ChevronUp } from "lucide-react";

export function PlayerCollapsedBar() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isPlayerBusy = usePlayerStore((s) => s.isPlayerBusy);
  const pendingAction = usePlayerStore((s) => s.pendingAction);
  const setIsPlayerCollapsed = usePlayerStore((s) => s.setIsPlayerCollapsed);
  const { togglePlayPause, skipNext, skipPrevious } = usePlaybackControls();

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-6 z-40 flex items-center gap-2 group select-none">
      {/* Mini dock de controles: aparece al pasar el cursor por encima (hover) */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-full glass-panel border border-black/10 dark:border-white/10 shadow-2xl backdrop-blur-2xl opacity-0 pointer-events-none translate-x-3 scale-95 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:scale-100 transition-all duration-200 ease-out">
        {/* Canción anterior */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            skipPrevious();
          }}
          disabled={isPlayerBusy}
          title="Canción anterior / reiniciar"
          className="h-8 w-8 rounded-full glass-btn flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-purple-400 hover:border-purple-500/30 transition-all active:scale-90 disabled:opacity-40 cursor-pointer"
          aria-label="Canción anterior"
        >
          {pendingAction === "previous" ? (
            <Loader2 size={13} className="animate-spin text-purple-400" />
          ) : (
            <SkipBack size={13} />
          )}
        </button>

        {/* Pausar / Reanudar */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlayPause();
          }}
          disabled={isPlayerBusy}
          title={isPlaying ? "Pausar reproducción" : "Reanudar reproducción"}
          className="h-8 w-8 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-md shadow-[#1db954]/30 transition-all active:scale-90 disabled:opacity-50 cursor-pointer"
          aria-label={isPlaying ? "Pausar" : "Reanudar"}
        >
          {pendingAction === "toggle" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={14} className="fill-current" />
          ) : (
            <Play size={14} className="fill-current ml-0.5" />
          )}
        </button>

        {/* Siguiente canción */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            skipNext();
          }}
          disabled={isPlayerBusy}
          title="Siguiente canción (Skip)"
          className="h-8 w-8 rounded-full glass-btn flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-purple-400 hover:border-purple-500/30 transition-all active:scale-90 disabled:opacity-40 cursor-pointer"
          aria-label="Siguiente canción"
        >
          {pendingAction === "skip" ? (
            <Loader2 size={13} className="animate-spin text-purple-400" />
          ) : (
            <SkipForward size={13} />
          )}
        </button>
      </div>

      {/* Botón flotante animado (Clic para abrir/expandir) */}
      <button
        type="button"
        onClick={() => setIsPlayerCollapsed(false)}
        title={`Abrir reproductor • ${currentSong.title}`}
        aria-label={`Abrir reproductor: ${currentSong.title}`}
        className={`relative flex items-center gap-2.5 p-1.5 pr-3.5 rounded-full glass-panel border shadow-2xl backdrop-blur-2xl transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 ${
          isPlaying
            ? "border-[#1db954]/50 shadow-[#1db954]/25 ring-1 ring-[#1db954]/30"
            : "border-black/10 dark:border-white/10 hover:border-purple-500/40"
        }`}
      >
        <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shrink-0 shadow-md ring-1 ring-black/10 dark:ring-white/10">
          <CoverImage
            src={currentSong.albumArt}
            alt={currentSong.title}
            className="w-full h-full rounded-full"
            imgClassName={isPlaying ? "animate-[spin_10s_linear_infinite]" : ""}
          />
          {/* Agujero central de vinilo */}
          <div className="absolute inset-0 m-auto w-2.5 h-2.5 rounded-full bg-slate-900 border border-white/40 shadow-inner z-20 pointer-events-none" />
        </div>

        {/* Contenido: Título e Icono animado */}
        <div className="flex flex-col items-start min-w-0 pr-1 text-left">
          <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate max-w-[90px] sm:max-w-[130px] leading-tight mb-0.5">
            {currentSong.title}
          </span>

          <div className="flex items-center gap-1.5">
            {/* Barras animadas de ecualizador según si suena algo o no */}
            <div
              className="flex items-end gap-[2px] h-3.5 w-3.5 justify-center shrink-0"
              title={isPlaying ? "Sonando ahora" : "En pausa"}
            >
              {isPlaying ? (
                <>
                  <span className="w-[2.5px] bg-[#1ed760] rounded-full ignite-eq-1" />
                  <span className="w-[2.5px] bg-[#1ed760] rounded-full ignite-eq-2" />
                  <span className="w-[2.5px] bg-[#1ed760] rounded-full ignite-eq-3" />
                  <span className="w-[2.5px] bg-[#1ed760] rounded-full ignite-eq-4" />
                </>
              ) : (
                <>
                  <span className="w-[2.5px] h-1 bg-slate-400 dark:bg-slate-500 rounded-full" />
                  <span className="w-[2.5px] h-2 bg-slate-400 dark:bg-slate-500 rounded-full" />
                  <span className="w-[2.5px] h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" />
                  <span className="w-[2.5px] h-1 bg-slate-400 dark:bg-slate-500 rounded-full" />
                </>
              )}
            </div>

            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono leading-none">
              {isPlaying ? "Sonando" : "En pausa"}
            </span>

            <ChevronUp size={12} className="text-slate-400 group-hover:text-purple-400 transition-colors ml-0.5" />
          </div>
        </div>
      </button>
    </div>
  );
}
