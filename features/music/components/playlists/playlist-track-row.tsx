"use client";

import { memo, useState } from "react";
import type { Song } from "@/types/domain";
import { formatDuration } from "@/lib/formatters";
import { CoverImage } from "@/components/ui/cover-image";
import { Star, Play, ListPlus, Plus, Loader2 } from "lucide-react";

export interface PlaylistTrackRowProps {
  track: Song;
  index: number;
  isFavorite: boolean;
  isCurrent: boolean;
  isPlaying: boolean;
  isAnyPlayBusy: boolean;
  pendingAction: "play" | "playNext" | "queue" | null;
  onToggleFavorite: (track: Song) => void;
  onPlay: (track: Song) => Promise<void>;
  onPlayNext: (track: Song) => Promise<void>;
  onAddToQueue: (track: Song) => Promise<void>;
}

export const PlaylistTrackRow = memo(function PlaylistTrackRow({
  track,
  index,
  isFavorite: isFav,
  isCurrent,
  isPlaying,
  isAnyPlayBusy,
  pendingAction,
  onToggleFavorite,
  onPlay,
  onPlayNext,
  onAddToQueue,
}: PlaylistTrackRowProps) {
  const [localAction, setLocalAction] = useState<"play" | "playNext" | "queue" | null>(null);

  const activeAction = localAction ?? pendingAction;
  const isLoadingPlay = activeAction === "play";
  const isLoadingNext = activeAction === "playNext";
  const isLoadingQueue = activeAction === "queue";
  const isThisTrackBusy = activeAction !== null && activeAction !== undefined;

  // Si se presiona Play, se bloquean todas las canciones mientras carga.
  // Si se presiona Añadir a la cola o Siguiente, solo se bloquea la actual.
  const isBlocked = isAnyPlayBusy || isThisTrackBusy;

  const handlePlay = async () => {
    if (isBlocked) return;
    setLocalAction("play");
    try {
      await onPlay(track);
    } finally {
      setLocalAction(null);
    }
  };

  const handlePlayNext = async () => {
    if (isBlocked) return;
    setLocalAction("playNext");
    try {
      await onPlayNext(track);
    } finally {
      setLocalAction(null);
    }
  };

  const handleAddToQueue = async () => {
    if (isBlocked) return;
    setLocalAction("queue");
    try {
      await onAddToQueue(track);
    } finally {
      setLocalAction(null);
    }
  };

  return (
    <div
      className={`flex items-center justify-between gap-3 p-2 rounded-xl border transition-colors ${
        isCurrent
          ? "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10"
          : "hover:bg-black/5 dark:hover:bg-white/5 border-transparent hover:border-black/5 dark:hover:border-white/5"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-[11px] font-mono text-slate-400 w-6 text-center shrink-0">
          {index + 1}
        </span>
        <CoverImage
          src={track.albumArt}
          alt={track.title}
          sizes="36px"
          className="w-9 h-9 rounded-lg shrink-0"
        />
        <div className="min-w-0">
          <p
            className={`text-xs font-semibold truncate ${
              isCurrent ? "text-[#1ed760]" : "text-slate-900 dark:text-white"
            }`}
          >
            {track.title}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            {track.artist} · {formatDuration(track.duration)}
          </p>
        </div>
      </div>

      {/* Orden de botones como en las tarjetas: Añadir a la cola (principal), Siguiente, Play, Favoritos */}
      <div className="flex items-center gap-1 shrink-0">
        {/* 1. Añadir a la cola (principal) */}
        <button
          type="button"
          onClick={handleAddToQueue}
          disabled={isBlocked}
          title={isLoadingQueue ? "Añadiendo a la cola..." : "Añadir a la cola"}
          aria-label={`Añadir ${track.title} a la cola`}
          className="p-1.5 rounded-lg bg-[#1db954] hover:bg-[#1ed760] text-black transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-bold"
        >
          {isLoadingQueue ? (
            <Loader2 size={13} className="animate-spin text-black" />
          ) : (
            <Plus size={13} strokeWidth={2.5} />
          )}
        </button>

        {/* 2. Siguiente */}
        <button
          type="button"
          onClick={handlePlayNext}
          disabled={isBlocked}
          title={
            isLoadingNext
              ? "Poniendo siguiente..."
              : "Reproducir a continuación (saltar cola)"
          }
          aria-label={`Reproducir ${track.title} a continuación`}
          className="p-1.5 rounded-lg hover:bg-purple-500/15 text-slate-400 hover:text-purple-300 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoadingNext ? (
            <Loader2 size={13} className="animate-spin text-purple-400" />
          ) : (
            <ListPlus size={13} />
          )}
        </button>

        {/* 3. Play */}
        <button
          type="button"
          onClick={handlePlay}
          disabled={isBlocked}
          title={
            isLoadingPlay
              ? "Cargando audio..."
              : isPlaying
              ? "Sonando ahora"
              : `Reproducir ${track.title}`
          }
          aria-label={`Reproducir ${track.title}`}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            isPlaying
              ? "bg-[#1db954]/20 text-[#1ed760]"
              : "hover:bg-[#1db954]/15 text-slate-400 hover:text-[#1ed760]"
          }`}
        >
          {isLoadingPlay ? (
            <Loader2 size={13} className="animate-spin text-[#1ed760]" />
          ) : (
            <Play size={13} className={isPlaying ? "fill-current text-[#1ed760]" : ""} />
          )}
        </button>

        {/* 4. Favoritos */}
        <button
          type="button"
          onClick={() => onToggleFavorite(track)}
          disabled={isBlocked}
          title={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
          aria-label={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            isFav
              ? "text-amber-400 hover:text-amber-500"
              : "hover:bg-amber-500/15 text-slate-400 hover:text-amber-400"
          }`}
        >
          <Star size={13} className={isFav ? "fill-amber-400" : ""} />
        </button>
      </div>
    </div>
  );
});
