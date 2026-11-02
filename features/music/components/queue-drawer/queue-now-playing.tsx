"use client";

import type { Song } from "@/types/domain";
import { usePlayerStore } from "@/features/music/stores/player-store";
import { formatDuration, getSongExternalUrl } from "@/lib/formatters";
import { CoverImage } from "@/components/ui/cover-image";
import { LiveEqualizer } from "@/components/ui/live-equalizer";
import { User, Star, ExternalLink } from "lucide-react";

export interface QueueNowPlayingProps {
  song: Song;
  isPlaying: boolean;
  currentTime?: number;
  isFav: boolean;
  onToggleFavorite: (song: Song) => void;
}

export function QueueNowPlaying({
  song,
  isPlaying,
  currentTime: propCurrentTime,
  isFav,
  onToggleFavorite,
}: QueueNowPlayingProps) {
  const storeCurrentTime = usePlayerStore((s) => s.currentTime);
  const currentTime = propCurrentTime !== undefined ? propCurrentTime : storeCurrentTime;
  const fullTrackLabel = `${song.title} — ${song.artist}`;
  const externalUrl = getSongExternalUrl(song);

  return (
    <div className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/[0.04] dark:bg-purple-950/20">
      <div className="text-[11px] font-medium text-purple-600 dark:text-purple-400 mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <LiveEqualizer size="xs" variant="spotify" isPlaying={isPlaying} />
          <span className="font-semibold text-slate-900 dark:text-white">Reproduciendo ahora</span>
        </span>
        <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
          {formatDuration(currentTime)} / {formatDuration(song.duration)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Abrir en ${song.source === "spotify" ? "Spotify" : "YouTube"} • ${fullTrackLabel}`}
          aria-label={`Abrir en ${song.source === "spotify" ? "Spotify" : "YouTube"}: ${fullTrackLabel}`}
          className="relative group shrink-0 block w-12 h-12 rounded-lg overflow-hidden cursor-pointer ring-1 ring-purple-500/30 hover:ring-2 hover:ring-[#1db954] transition-all"
        >
          <CoverImage
            src={song.albumArt}
            alt={song.title}
            sizes="48px"
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink size={16} className="text-white drop-shadow-sm" />
          </div>
        </a>
        <div className="min-w-0 flex-1" title={fullTrackLabel}>
          <h4
            title={fullTrackLabel}
            className="text-sm font-bold text-slate-900 dark:text-white truncate cursor-default"
          >
            {song.title}
          </h4>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 min-w-0" title={fullTrackLabel}>
            <span className="truncate cursor-default" title={fullTrackLabel}>{song.artist}</span>
            {song.requestedBy?.username && (
              <>
                <span className="text-slate-300 dark:text-slate-600 shrink-0">•</span>
                <span
                  className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium shrink-0 max-w-[160px]"
                  title={`Pedido por ${song.requestedBy.username}`}
                >
                  {song.requestedBy.avatar ? (
                    <CoverImage
                      src={song.requestedBy.avatar}
                      alt={song.requestedBy.username}
                      sizes="16px"
                      className="w-3.5 h-3.5 rounded-full inline-block shrink-0"
                    />
                  ) : (
                    <User size={11} className="inline-block shrink-0" />
                  )}
                  <span className="truncate">Pedido por {song.requestedBy.username}</span>
                </span>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggleFavorite(song)}
          title={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
          className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
            isFav
              ? "text-amber-400 bg-amber-400/10 hover:bg-amber-400/20"
              : "text-slate-400 hover:text-amber-400 hover:bg-black/5 dark:hover:bg-white/5"
          }`}
        >
          <Star size={16} className={isFav ? "fill-amber-400" : ""} />
        </button>
      </div>
    </div>
  );
}
