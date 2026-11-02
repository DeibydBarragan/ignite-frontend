"use client";

import { usePlayerStore } from "@/features/music/stores/player-store";
import type { Song } from "@/types/domain";
import { formatDuration, getSongExternalUrl } from "@/lib/formatters";
import { CoverImage } from "@/components/ui/cover-image";
import { LiveEqualizer } from "@/components/ui/live-equalizer";
import { Loader2, ExternalLink, User, Star, ChevronDown } from "lucide-react";

const SOURCE_BADGES: Record<Song["source"], { label: string; className: string }> = {
  youtube: {
    label: "YouTube",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  spotify: {
    label: "Spotify",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
};

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

  const sourceConfig = SOURCE_BADGES[song.source] || {
    label: song.source,
    className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };

  const fullTrackLabel = `${song.title} — ${song.artist}`;
  const externalUrl = getSongExternalUrl(song);

  return (
    <div className="flex items-center gap-3 w-full md:w-[35%] lg:w-[38%] min-w-0 shrink-0">
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`Abrir en ${song.source === "spotify" ? "Spotify" : "YouTube"} • ${fullTrackLabel}`}
        aria-label={`Abrir en ${song.source === "spotify" ? "Spotify" : "YouTube"}: ${fullTrackLabel}`}
        className="relative group shrink-0 block w-12 h-12 rounded-xl overflow-hidden ring-1 ring-black/10 dark:ring-white/10 shadow-md hover:ring-2 hover:ring-[#1db954] cursor-pointer transition-all duration-200"
      >
        <CoverImage
          src={song.albumArt}
          alt={song.title}
          sizes="48px"
          className="w-full h-full"
        />
        <div className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ExternalLink size={16} className="text-white drop-shadow-md" />
        </div>
      </a>
      <div className="min-w-0 flex-1" title={fullTrackLabel}>
        <div className="flex items-center gap-1.5 min-w-0" title={fullTrackLabel}>
          {isPlaying && (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#1db954]/10 border border-[#1db954]/25 shrink-0"
              title="Sonando en Discord"
            >
              <LiveEqualizer size="xs" variant="spotify" isPlaying={isPlaying} />
              <span className="text-[9px] font-bold text-[#1ed760] uppercase tracking-wider hidden xl:inline">
                En Vivo
              </span>
            </div>
          )}
          <h4
            title={fullTrackLabel}
            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate min-w-0 flex-1 cursor-default"
          >
            {song.title}
          </h4>
          {isPlayerBusy && (
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-500 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 animate-pulse shrink-0">
              <Loader2 size={9} className="animate-spin" />
              <span className="hidden sm:inline">
                {pendingAction === "skip"
                  ? "Saltando..."
                  : pendingAction === "previous"
                  ? "Anterior..."
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
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={fullTrackLabel}>
          <span className="truncate cursor-default" title={fullTrackLabel}>{song.artist}</span>
          <span className="text-slate-300 dark:text-slate-600 shrink-0">•</span>
          <span
            className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border shadow-2xs shrink-0 ${sourceConfig.className}`}
          >
            {sourceConfig.label}
          </span>
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
                    sizes="16px"
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
