"use client";

import { useState } from "react";
import { Song } from "@/lib/mock-data";
import { useBot } from "@/context/bot-context";
import { Play, Plus, ListPlus, Clock, Disc3, Loader2, Star, Check } from "lucide-react";

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

const SOURCE_COLORS: Record<Song["source"], { label: string; bg: string; text: string }> = {
  youtube: { label: "YouTube", bg: "bg-red-500/10", text: "text-red-500 border-red-500/20" },
  spotify: { label: "Spotify", bg: "bg-emerald-500/10", text: "text-emerald-500 border-emerald-500/20" },
};

export function SongCard({ song }: { song: Song }) {
  const {
    currentSong,
    isPlaying,
    playSong,
    playNext,
    addToQueue,
    pendingSongActions,
    isFavorite,
    toggleFavorite,
  } = useBot();

  const [showNextFeedback, setShowNextFeedback] = useState(false);
  const [showQueueFeedback, setShowQueueFeedback] = useState(false);

  const isCurrent = currentSong?.id === song.id;
  const isFav = isFavorite(song.id) || isFavorite(song.url);
  const songPendingAction = pendingSongActions?.[song.id];
  const isLoadingThisSongPlay = songPendingAction === "play";
  const isLoadingThisSongNext = songPendingAction === "playNext";
  const isLoadingThisSongQueue = songPendingAction === "queue";
  const isThisSongBusy = !!songPendingAction;
  const isActionDisabled = isThisSongBusy;

  const handlePlayNext = async () => {
    if (isActionDisabled) return;
    setShowNextFeedback(true);
    try {
      await playNext(song);
    } finally {
      setTimeout(() => {
        setShowNextFeedback(false);
      }, 2600);
    }
  };

  const handleAddToQueue = async () => {
    if (isActionDisabled) return;
    try {
      await addToQueue(song);
      setShowQueueFeedback(true);
      setTimeout(() => {
        setShowQueueFeedback(false);
      }, 2600);
    } catch {}
  };

  return (
    <div
      className={`group relative glass-panel p-3 transition-all duration-200 flex flex-col justify-between hover:shadow-lg ${
        isCurrent
          ? "border-[#1db954]/50 bg-[#1db954]/5 dark:bg-[#1db954]/5 ring-1 ring-[#1db954]/30"
          : "hover:border-purple-500/30 dark:hover:border-purple-500/30"
      }`}
    >
      <div>
        {/* Album Artwork with add-to-queue overlay */}
        <div
          onClick={() => !isActionDisabled && handleAddToQueue()}
          className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-black/10 dark:bg-white/5 cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={song.albumArt}
            alt={song.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Rank Badge */}
          {typeof song.rank === "number" && (
            <span
              className={`absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-full border backdrop-blur-md z-10 shadow-sm ${
                song.rank === 1
                  ? "bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/50"
                  : song.rank === 2
                  ? "bg-slate-200 text-slate-900 border-slate-300"
                  : song.rank === 3
                  ? "bg-amber-700/90 text-amber-100 border-amber-600"
                  : "bg-black/60 text-slate-200 border-white/10"
              }`}
            >
              #{song.rank}
            </span>
          )}

          {/* Source badge */}
          <span
            className={`absolute ${typeof song.rank === "number" ? "top-8" : "top-2"} left-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border backdrop-blur-md ${SOURCE_COLORS[song.source].bg} ${SOURCE_COLORS[song.source].text}`}
          >
            {SOURCE_COLORS[song.source].label}
          </span>

          {/* Lyric Badge */}
          {song.isLyric && (
            <span
              title="Video con letra"
              className={`absolute ${typeof song.rank === "number" ? "top-14" : "top-9"} left-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border backdrop-blur-md bg-sky-500/10 text-sky-500 border-sky-500/20`}
            >
              Lyric
            </span>
          )}

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(song);
            }}
            title={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
            className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer z-10 ${
              isFav
                ? "bg-amber-400/20 text-amber-400 border border-amber-400/30 opacity-100 scale-105"
                : "bg-black/40 text-white/70 hover:text-amber-400 hover:bg-black/60 opacity-0 group-hover:opacity-100"
            }`}
          >
            <Star size={12} className={isFav ? "fill-amber-400" : ""} />
          </button>

          {/* Play Count Badge (Bottom-left of cover) */}
          {typeof song.playCount === "number" && song.playCount > 0 && (
            <span
              title={`${song.playCount} ${song.playCount === 1 ? "reproducción" : "reproducciones"}`}
              className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-amber-400 border border-amber-400/30 flex items-center gap-1 shadow-md z-10 pointer-events-none"
            >
              🔥 {song.playCount}
            </span>
          )}

          {/* 1. Loading Overlay when Play is clicked (con tinte esmeralda/verde, spinner grande directo sin texto) */}
          {isLoadingThisSongPlay && (
            <div className="absolute inset-0 bg-emerald-950/75 backdrop-blur-xs flex items-center justify-center z-20 animate-in fade-in duration-150">
              <Loader2 size={38} className="animate-spin text-[#1ed760] drop-shadow-[0_0_14px_rgba(30,215,96,0.7)]" />
            </div>
          )}

          {/* 2. Visual feedback animation when "Sig" is clicked (mismo estilo de icono que cargando) */}
          {showNextFeedback && !isLoadingThisSongPlay && (
            <div className="absolute inset-0 bg-purple-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20 animate-in zoom-in-95 fade-in duration-150 pointer-events-none">
              <ListPlus size={38} className="text-purple-300 drop-shadow-[0_0_14px_rgba(192,132,252,0.8)] animate-bounce" />
              <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-purple-200 border border-purple-400/30 text-[10px] font-bold tracking-wide shadow-md">
                ¡Siguiente en cola!
              </span>
            </div>
          )}

          {/* 3. Visual feedback animation when "Añadir a la cola" completes (Point 4) */}
          {showQueueFeedback && !isLoadingThisSongPlay && !showNextFeedback && (
            <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20 animate-in zoom-in-95 fade-in duration-150 pointer-events-none">
              <Plus size={38} strokeWidth={3} className="text-[#1ed760] drop-shadow-[0_0_14px_rgba(30,215,96,0.8)] animate-bounce" />
              <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-emerald-200 border border-emerald-400/30 text-[10px] font-bold tracking-wide shadow-md">
                ¡Añadido a la cola!
              </span>
            </div>
          )}

          {/* 4. Equalizer overlay when playing (5 barras dinámicas centradas, sin texto de sonando) */}
          {isCurrent && isPlaying && !isLoadingThisSongPlay && !showQueueFeedback && !showNextFeedback && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-10 animate-in fade-in duration-200 pointer-events-none">
              <div className="flex items-end justify-center gap-1.5 h-8">
                <span className="w-1.5 bg-[#1ed760] rounded-full cover-eq-1 shadow-[0_0_8px_rgba(30,215,96,0.7)]" />
                <span className="w-1.5 bg-[#1ed760] rounded-full cover-eq-2 shadow-[0_0_8px_rgba(30,215,96,0.7)]" />
                <span className="w-1.5 bg-purple-400 rounded-full cover-eq-3 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                <span className="w-1.5 bg-[#1ed760] rounded-full cover-eq-4 shadow-[0_0_8px_rgba(30,215,96,0.7)]" />
                <span className="w-1.5 bg-purple-400 rounded-full cover-eq-5 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
              </div>
            </div>
          )}

          {/* Quick Add-to-Queue Hover Button (Spotify Green with Plus) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddToQueue();
            }}
            aria-label={`Añadir ${song.title} a la cola`}
            title="Añadir a la cola"
            className={`absolute bottom-2.5 right-2.5 h-9 w-9 rounded-full bg-[#1db954] text-black shadow-lg shadow-[#1db954]/25 flex items-center justify-center transition-all transform cursor-pointer ${
              isLoadingThisSongQueue || showQueueFeedback
                ? "opacity-100 scale-105"
                : isActionDisabled || isLoadingThisSongPlay || showNextFeedback
                ? "opacity-0 pointer-events-none"
                : "opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 hover:scale-105 hover:bg-[#1ed760]"
            }`}
          >
            {isLoadingThisSongQueue ? (
              <Loader2 size={16} className="animate-spin text-black" />
            ) : showQueueFeedback ? (
              <Check size={18} strokeWidth={3} className="text-black animate-in zoom-in" />
            ) : (
              <Plus size={18} strokeWidth={2.5} />
            )}
          </button>
        </div>

        {/* Info */}
        <h3
          onClick={() => !isActionDisabled && handleAddToQueue()}
          className="font-semibold text-xs text-slate-900 dark:text-white truncate transition-colors cursor-pointer hover:text-[#1ed760]"
          title={`Añadir a la cola: ${song.title}`}
        >
          {song.title}
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={song.artist}>
          {song.artist}
        </p>
      </div>

      {/* Footer & Actions */}
      <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2 text-xs">
        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono tabular-nums shrink-0">
          <Clock size={10} />
          {formatDuration(song.duration)}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Play Button: Bloqueado mientras carga pero sin spinner (ya está en la carátula) */}
          <button
            onClick={() => !isActionDisabled && playSong(song)}
            title={isLoadingThisSongPlay ? "Cargando audio..." : "Reproducir ahora (inmediato)"}
            className={`glass-btn px-2 py-0.5 text-[10px] flex items-center gap-1 transition-all ${
              isActionDisabled
                ? "opacity-50 cursor-not-allowed"
                : "text-slate-600 dark:text-slate-300 hover:text-[#1ed760] hover:border-[#1db954]/30 cursor-pointer"
            }`}
          >
            <Play size={10} className="fill-current ml-0.5" />
            <span>Play</span>
          </button>

          {/* Sig Button with instant feedback & persistent pointer */}
          <button
            onClick={handlePlayNext}
            title={
              showNextFeedback
                ? "¡Añadido como siguiente!"
                : isLoadingThisSongNext
                ? "Poniendo siguiente"
                : "Reproducir siguiente (salta la cola)"
            }
            className={`glass-btn px-2 py-0.5 text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
              showNextFeedback
                ? "bg-purple-600/30 text-purple-300 border-purple-500/50 ring-1 ring-purple-500/40 scale-105"
                : isLoadingThisSongNext
                ? "text-purple-400 border-purple-500/30"
                : isActionDisabled
                ? "opacity-50"
                : "text-slate-600 dark:text-slate-300 hover:text-purple-400 hover:border-purple-500/30"
            }`}
          >
            {showNextFeedback ? (
              <>
                <Check size={11} className="text-purple-300 animate-in zoom-in" />
                <span className="font-semibold text-purple-300">¡Listo!</span>
              </>
            ) : isLoadingThisSongNext ? (
              <>
                <Loader2 size={11} className="animate-spin text-purple-400" />
                <span>Sig</span>
              </>
            ) : (
              <>
                <ListPlus size={11} />
                <span>Sig</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
