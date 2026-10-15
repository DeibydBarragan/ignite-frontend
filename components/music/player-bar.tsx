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
  Square,
  ListPlus,
  SlidersHorizontal,
  Check,
  ListMusic,
  ExternalLink,
  Loader2,
  Star,
  User,
  ChevronDown,
  ChevronUp,
  Minimize2,
} from "lucide-react";
import { AUDIO_FILTERS, AUDIO_FILTER_LABELS } from "@/lib/audio-filters";

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
    stopPlayback,
    autoplay,
    toggleAutoplay,
    isPlayerCollapsed,
    setIsPlayerCollapsed,
    currentFilter,
    setFilter,
    isPlayerBusy,
    pendingAction,
    isFavorite,
    toggleFavorite,
  } = useBot();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isFxOpen, setIsFxOpen] = useState(false);

  if (!currentSong) return null;

  const isFav = isFavorite(currentSong.id) || isFavorite(currentSong.url);

  const currentDuration = currentSong.duration || 180;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / currentDuration) * 100));

  // Reproductor contraído: botón flotante animado en la esquina con mini controles al pasar el cursor
  if (isPlayerCollapsed) {
    return (
      <>
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
            {/* Portada giratoria / Mini Vinilo */}
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shrink-0 shadow-md ring-1 ring-black/10 dark:ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentSong.albumArt}
                alt={currentSong.title}
                className={`w-full h-full object-cover rounded-full ${
                  isPlaying ? "animate-[spin_10s_linear_infinite]" : ""
                }`}
              />
              {/* Agujero central de vinilo */}
              <div className="absolute inset-0 m-auto w-2.5 h-2.5 rounded-full bg-slate-900 border border-white/40 shadow-inner" />
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

        <QueueDrawer isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
      </>
    );
  }

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
                            ? "Reanudando..."
                            : "Pausando..."
                          : pendingAction === "stop"
                          ? "Deteniendo..."
                          : "Cargando..."}
                      </span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  <span className="truncate">{currentSong.artist}</span>
                  {currentSong.requestedBy?.username && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600 shrink-0">•</span>
                      <span
                        className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium shrink-0"
                        title={`Pedido por ${currentSong.requestedBy.username}`}
                      >
                        {currentSong.requestedBy.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={currentSong.requestedBy.avatar}
                            alt={currentSong.requestedBy.username}
                            className="w-3 h-3 rounded-full object-cover inline-block shrink-0"
                          />
                        ) : (
                          <User size={10} className="inline-block shrink-0" />
                        )}
                        <span className="truncate max-w-[80px] sm:max-w-[120px]">{currentSong.requestedBy.username}</span>
                      </span>
                    </>
                  )}
                </div>
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

              <button
                type="button"
                onClick={() => setIsPlayerCollapsed(true)}
                title="Contraer reproductor"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0 md:hidden"
                aria-label="Contraer reproductor"
              >
                <ChevronDown size={18} />
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

            {/* Right: FX, Autoplay, Stop, Queue */}
            <div className="flex items-center justify-end gap-2 w-full md:w-1/4 flex-wrap">
              {/* FX / Filtros de audio */}
              <div className="relative">
                <button
                  onClick={() => setIsFxOpen((prev) => !prev)}
                  disabled={isPlayerBusy}
                  title={currentFilter ? `Filtro: ${AUDIO_FILTER_LABELS[currentFilter as keyof typeof AUDIO_FILTER_LABELS] ?? currentFilter}` : "Efectos de audio (8D, bassboost...)"}
                  className={`glass-btn px-2.5 py-1.5 text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 ${
                    currentFilter
                      ? "text-purple-600 dark:text-purple-400 border-purple-500/40 bg-purple-500/10"
                      : "text-slate-700 dark:text-slate-200 hover:border-purple-500/30"
                  }`}
                >
                  <SlidersHorizontal size={14} />
                  <span className="hidden lg:inline">{currentFilter ? (AUDIO_FILTER_LABELS[currentFilter as keyof typeof AUDIO_FILTER_LABELS] ?? currentFilter) : "FX"}</span>
                </button>

                {isFxOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsFxOpen(false)} />
                    <div className="glass-dropdown absolute right-0 bottom-full mb-2 w-48 p-1.5 z-40 bg-white/55 dark:bg-[#12151f]/55 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl max-h-64 overflow-y-auto custom-scrollbar">
                      <button
                        onClick={() => {
                          setFilter("none");
                          setIsFxOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          !currentFilter
                            ? "bg-purple-600/15 text-purple-600 dark:text-purple-400 font-semibold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
                        }`}
                      >
                        <span>Sin filtro</span>
                        {!currentFilter && <Check size={13} className="text-purple-500" />}
                      </button>
                      {AUDIO_FILTERS.map((name) => {
                        const isActive = currentFilter === name;
                        return (
                          <button
                            key={name}
                            onClick={() => {
                              setFilter(name);
                              setIsFxOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                              isActive
                                ? "bg-purple-600/15 text-purple-600 dark:text-purple-400 font-semibold"
                                : "text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
                            }`}
                          >
                            <span>{AUDIO_FILTER_LABELS[name]}</span>
                            {isActive && <Check size={13} className="text-purple-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Autoplay */}
              <button
                onClick={toggleAutoplay}
                disabled={isPlayerBusy}
                title={autoplay ? "Autoplay activado" : "Autoplay desactivado"}
                className={`glass-btn p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 ${
                  autoplay
                    ? "text-[#1ed760] bg-[#1db954]/15"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <ListPlus size={15} />
              </button>

              {/* Stop */}
              <button
                onClick={stopPlayback}
                disabled={isPlayerBusy}
                title="Detener y salir del canal de voz"
                className="glass-btn p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-40"
              >
                {pendingAction === "stop" ? (
                  <Loader2 size={14} className="animate-spin text-rose-400" />
                ) : (
                  <Square size={14} className="fill-current" />
                )}
              </button>

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

              {/* Contraer a la esquina (Desktop) */}
              <button
                type="button"
                onClick={() => setIsPlayerCollapsed(true)}
                title="Contraer reproductor a la esquina"
                className="glass-btn p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:border-purple-500/30 transition-colors cursor-pointer hidden md:flex items-center justify-center"
                aria-label="Contraer reproductor a la esquina"
              >
                <Minimize2 size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <QueueDrawer isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
    </>
  );
}
