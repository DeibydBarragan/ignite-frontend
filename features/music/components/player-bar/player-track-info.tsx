"use client";

import { usePlayerStore } from "@/features/music/stores/player-store";
import type { Song } from "@/types/domain";
import { CoverImage } from "@/components/ui/cover-image";
import { Loader2, ExternalLink, User, Star, ChevronDown } from "lucide-react";

export interface PlayerTrackInfoProps {
  song: Song;
  isFav: boolean;
  onToggleFavorite: (song: Song) => void;
  onCollapse: () => void;
}

export function PlayerTrackInfo({
  song,
  isFav,
  onToggleFavorite,
  onCollapse,
}: PlayerTrackInfoProps) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isPlayerBusy = usePlayerStore((s) => s.isPlayerBusy);
  const pendingAction = usePlayerStore((s) => s.pendingAction);

  return (
    <div className="flex items-center gap-3 w-full md:w-1/4 min-w-0">
      <div className="relative group shrink-0">
        <CoverImage
          src={song.albumArt}
          alt={song.title}
          className="w-12 h-12 rounded-xl ring-1 ring-black/10 dark:ring-white/10 shadow-md"
        />
        <a
          href={song.url}
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
            {song.title}
          </h4>
          <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
            {song.source}
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
          <span className="truncate">{song.artist}</span>
          {song.requestedBy?.username && (
            <>
              <span className="text-slate-300 dark:text-slate-600 shrink-0">•</span>
              <span
                className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium shrink-0"
                title={`Pedido por ${song.requestedBy.username}`}
              >
                {song.requestedBy.avatar ? (
                  <CoverImage
                    src={song.requestedBy.avatar}
                    alt={song.requestedBy.username}
                    className="w-3 h-3 rounded-full inline-block shrink-0"
                  />
                ) : (
                  <User size={10} className="inline-block shrink-0" />
                )}
                <span className="truncate max-w-[80px] sm:max-w-[120px]">{song.requestedBy.username}</span>
              </span>
            </>
          )}
        </div>
      </div>

      <button
        onClick={() => onToggleFavorite(song)}
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
        onClick={onCollapse}
        title="Contraer reproductor"
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0 md:hidden"
        aria-label="Contraer reproductor"
      >
        <ChevronDown size={18} />
      </button>
    </div>
  );
}
