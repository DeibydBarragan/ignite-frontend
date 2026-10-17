"use client";

import { useState, useCallback, useEffect, useRef, memo } from "react";
import type { Song } from "@/types/domain";
import { usePlayerStore } from "@/features/music/stores/player-store";
import { useQueueStore } from "@/features/music/stores/queue-store";
import { useQueueActions } from "@/hooks/use-queue-actions";
import { useFavorites } from "@/context/favorites-context";
import { formatDuration } from "@/lib/formatters";
import { CoverImage } from "@/components/ui/cover-image";
import { logger } from "@/lib/logger";
import { SongCoverOverlays, type FeedbackStatus } from "./song-cover-overlays";
import { SongCardActions } from "./song-card-actions";
import { Clock, Star } from "lucide-react";

const SOURCE_COLORS: Record<Song["source"], { label: string; bg: string; text: string }> = {
  youtube: { label: "YouTube", bg: "bg-red-500/10", text: "text-red-500 border-red-500/20" },
  spotify: { label: "Spotify", bg: "bg-emerald-500/10", text: "text-emerald-500 border-emerald-500/20" },
};

function useProgressiveFeedback(visibleMs = 1500, fadeMs = 700) {
  const [status, setStatus] = useState<FeedbackStatus>("idle");
  const timersRef = useRef<{ t1?: NodeJS.Timeout; t2?: NodeJS.Timeout }>({});

  const trigger = useCallback(() => {
    if (timersRef.current.t1) clearTimeout(timersRef.current.t1);
    if (timersRef.current.t2) clearTimeout(timersRef.current.t2);

    setStatus("visible");
    timersRef.current.t1 = setTimeout(() => {
      setStatus("fading");
      timersRef.current.t2 = setTimeout(() => {
        setStatus("idle");
      }, fadeMs);
    }, visibleMs);
  }, [visibleMs, fadeMs]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      if (timers.t1) clearTimeout(timers.t1);
      if (timers.t2) clearTimeout(timers.t2);
    };
  }, []);

  return [status, trigger] as const;
}

export const SongCard = memo(function SongCard({ song }: { song: Song }) {
  const isCurrent = usePlayerStore((s) => s.currentSong?.id === song.id);
  const isPlaying = usePlayerStore((s) => isCurrent && s.isPlaying);
  const songPendingAction = useQueueStore((s) => s.pendingSongActions[song.id]);
  const { playSong, playNext, addToQueue } = useQueueActions();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [nextFeedback, triggerNextFeedback] = useProgressiveFeedback();
  const [queueFeedback, triggerQueueFeedback] = useProgressiveFeedback();

  const isFav = isFavorite(song.id) || isFavorite(song.url);
  const isLoadingThisSongPlay = songPendingAction === "play";
  const isLoadingThisSongNext = songPendingAction === "playNext";
  const isLoadingThisSongQueue = songPendingAction === "queue";
  const isActionDisabled = !!songPendingAction;

  const handlePlayNext = async () => {
    if (isActionDisabled) return;
    try {
      await playNext(song);
      triggerNextFeedback();
    } catch (err) {
      logger.error("Error playing next song:", err);
    }
  };

  const handleAddToQueue = async () => {
    if (isActionDisabled) return;
    try {
      await addToQueue(song);
      triggerQueueFeedback();
    } catch (err) {
      logger.error("Error adding song to queue:", err);
    }
  };

  const sourceConfig = SOURCE_COLORS[song.source] || {
    label: song.source,
    bg: "bg-slate-500/10",
    text: "text-slate-500 border-slate-500/20",
  };

  return (
    <article
      aria-label={`${song.title} por ${song.artist}`}
      className={`group relative glass-panel p-2.5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5 ${
        isCurrent
          ? "border-[#1db954]/50 bg-[#1db954]/5 ring-1 ring-[#1db954]/30"
          : "hover:border-purple-500/40"
      }`}
    >
      <div>
        {/* Cover Container */}
        <div
          onClick={() => !isActionDisabled && playSong(song)}
          title={`Reproducir: ${song.title}`}
          className="relative aspect-square w-full rounded-2xl overflow-hidden mb-2 bg-black/20 dark:bg-black/40 shadow-inner group/cover cursor-pointer select-none"
        >
          <CoverImage
            src={song.albumArt}
            alt={song.title}
            className="w-full h-full"
            iconSize={32}
            imgClassName="group-hover:scale-105 transition-transform duration-500 ease-out"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

          {/* Badges (Top-Left): Source Badge & Rank */}
          <div className="absolute top-2 left-2 flex items-center gap-1 z-10 pointer-events-none">
            {typeof song.rank === "number" && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-black/80 md:backdrop-blur-md text-amber-400 border border-amber-400/30 font-mono">
                #{song.rank}
              </span>
            )}
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border md:backdrop-blur-md shadow-xs ${sourceConfig.bg} ${sourceConfig.text}`}
            >
              {sourceConfig.label}
            </span>
          </div>

          {/* Favorite Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(song);
            }}
            title={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
            className={`absolute top-2 right-2 p-1.5 rounded-full md:backdrop-blur-md transition-all cursor-pointer z-20 ${
              isFav
                ? "bg-amber-400/20 text-amber-400 border border-amber-400/30 opacity-100 scale-105"
                : "bg-black/60 text-white/70 hover:text-amber-400 hover:bg-black/80 opacity-0 group-hover:opacity-100"
            }`}
          >
            <Star size={12} className={isFav ? "fill-amber-400" : ""} />
          </button>

          {/* Play Count Badge (Bottom-left of cover) */}
          {typeof song.playCount === "number" && song.playCount > 0 && (
            <span
              title={`${song.playCount} ${song.playCount === 1 ? "reproducción" : "reproducciones"}`}
              className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/80 md:backdrop-blur-md text-amber-400 border border-amber-400/30 flex items-center gap-1 shadow-md z-10 pointer-events-none"
            >
              🔥 {song.playCount}
            </span>
          )}

          {/* Overlays: carga de play, feedback progresivo de Sig/cola y ecualizador */}
          <SongCoverOverlays
            isLoadingPlay={isLoadingThisSongPlay}
            nextFeedback={nextFeedback}
            queueFeedback={queueFeedback}
            showEqualizer={
              isCurrent && isPlaying && !isLoadingThisSongPlay
            }
          />
        </div>

        {/* Info */}
        <h3
          onClick={() => !isActionDisabled && handleAddToQueue()}
          className="font-semibold text-xs text-slate-900 dark:text-white truncate transition-colors cursor-pointer hover:text-[#1ed760]"
          title={`Añadir a la cola: ${song.title}`}
        >
          {song.title}
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={song.artist}>{song.artist}</p>
      </div>

      {/* Footer & Actions */}
      <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-1.5 text-xs">
        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono tabular-nums shrink-0">
          <Clock size={10} />
          {formatDuration(song.duration)}
        </span>

        <SongCardActions
          song={song}
          isPlaying={isPlaying}
          isActionDisabled={isActionDisabled}
          isLoadingPlay={isLoadingThisSongPlay}
          isLoadingNext={isLoadingThisSongNext}
          isLoadingQueue={isLoadingThisSongQueue}
          nextFeedback={nextFeedback}
          queueFeedback={queueFeedback}
          onPlay={() => !isActionDisabled && playSong(song)}
          onPlayNext={handlePlayNext}
          onAddToQueue={handleAddToQueue}
        />
      </div>
    </article>
  );
});
