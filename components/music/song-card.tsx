"use client";

import { Song } from "@/lib/mock-data";
import { useBot } from "@/context/bot-context";
import { Play, Plus, Clock, Disc3, Loader2, Star } from "lucide-react";

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

const SOURCE_COLORS: Record<Song["source"], { label: string; bg: string; text: string }> = {
  youtube: { label: "YouTube", bg: "bg-red-500/10", text: "text-red-500 border-red-500/20" },
  spotify: { label: "Spotify", bg: "bg-emerald-500/10", text: "text-emerald-500 border-emerald-500/20" },
  soundcloud: { label: "SoundCloud", bg: "bg-amber-500/10", text: "text-amber-500 border-amber-500/20" },
};

export function SongCard({ song }: { song: Song }) {
  const {
    currentSong,
    isPlaying,
    playSong,
    addToQueue,
    isPlayerBusy,
    pendingAction,
    loadingSongId,
    isFavorite,
    toggleFavorite,
  } = useBot();

  const isCurrent = currentSong?.id === song.id;
  const isFav = isFavorite(song.id) || isFavorite(song.url);
  const isLoadingThisSongPlay = loadingSongId === song.id && pendingAction === "play";
  const isLoadingThisSongQueue = loadingSongId === song.id && pendingAction === "queue";

  return (
    <div
      className={`group relative glass-panel p-3 transition-all duration-200 flex flex-col justify-between hover:shadow-lg ${
        isCurrent
          ? "border-[#1db954]/50 bg-[#1db954]/5 dark:bg-[#1db954]/5 ring-1 ring-[#1db954]/30"
          : "hover:border-purple-500/30 dark:hover:border-purple-500/30"
      }`}
    >
      <div>
        {/* Album Artwork with play overlay */}
        <div
          onClick={() => !isPlayerBusy && playSong(song)}
          className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-black/10 dark:bg-white/5 cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={song.albumArt}
            alt={song.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Source badge */}
          <span
            className={`absolute top-2 left-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border backdrop-blur-md ${SOURCE_COLORS[song.source].bg} ${SOURCE_COLORS[song.source].text}`}
          >
            {SOURCE_COLORS[song.source].label}
          </span>

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

          {/* Equalizer overlay when playing */}
          {isCurrent && isPlaying && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center gap-1">
              <span className="w-1 h-5 bg-[#1ed760] rounded-full animate-pulse" />
              <span className="w-1 h-7 bg-purple-400 rounded-full animate-pulse [animation-delay:150ms]" />
              <span className="w-1 h-4 bg-[#1ed760] rounded-full animate-pulse [animation-delay:300ms]" />
            </div>
          )}

          {/* Quick Play Hover Button (Spotify Green) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              playSong(song);
            }}
            disabled={isPlayerBusy}
            aria-label={`Reproducir ${song.title}`}
            className={`absolute bottom-2.5 right-2.5 h-9 w-9 rounded-full bg-[#1db954] text-black shadow-lg shadow-[#1db954]/25 flex items-center justify-center transition-all transform ${
              isLoadingThisSongPlay
                ? "opacity-100 scale-105 cursor-not-allowed"
                : isPlayerBusy
                ? "opacity-0 pointer-events-none"
                : "opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 hover:scale-105 hover:bg-[#1ed760] cursor-pointer"
            }`}
          >
            {isLoadingThisSongPlay ? (
              <Loader2 size={16} className="animate-spin text-black" />
            ) : (
              <Play size={16} className="fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Info */}
        <h3
          onClick={() => !isPlayerBusy && playSong(song)}
          className="font-semibold text-xs text-slate-900 dark:text-white truncate cursor-pointer hover:text-[#1ed760] transition-colors"
          title={song.title}
        >
          {song.title}
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={song.artist}>
          {song.artist}
        </p>
      </div>

      {/* Footer & Actions */}
      <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono tabular-nums">
          <Clock size={10} />
          {formatDuration(song.duration)}
        </span>

        <button
          onClick={() => addToQueue(song)}
          disabled={isPlayerBusy || isLoadingThisSongQueue}
          title={isLoadingThisSongQueue ? "Añadiendo a la cola..." : "Añadir a la cola"}
          className={`glass-btn px-2 py-0.5 text-[10px] flex items-center gap-1 transition-colors ${
            isLoadingThisSongQueue || isPlayerBusy
              ? "opacity-50 cursor-not-allowed"
              : "text-slate-600 dark:text-slate-300 hover:text-[#1ed760] hover:border-[#1db954]/30 cursor-pointer"
          }`}
        >
          {isLoadingThisSongQueue ? (
            <>
              <Loader2 size={11} className="animate-spin text-purple-400" />
              <span>Añadiendo...</span>
            </>
          ) : (
            <>
              <Plus size={11} />
              <span>Cola</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
