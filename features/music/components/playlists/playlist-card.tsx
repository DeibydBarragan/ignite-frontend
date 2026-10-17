"use client";

import type { UserPlaylist } from "@/types/domain";
import { formatDuration, timeAgo, totalDuration } from "@/lib/formatters";
import { CoverImage } from "@/components/ui/cover-image";
import { playlistSourceTheme } from "./playlist-source-theme";
import { Music2, Plus, Loader2, Play, Eye, Clock, Trash2, Star } from "lucide-react";

export interface PlaylistCardProps {
  playlist: UserPlaylist;
  isPlaying: boolean;
  isQueueing: boolean;
  isAnyPlayBusy: boolean;
  isFavProcessing: boolean;
  isPlayerBusy: boolean;
  isFav: boolean;
  favGlobalBusy: boolean;
  onOpen: () => void;
  onPlay: () => void;
  onQueue: () => void;
  onToggleFav: () => void;
  onDelete: () => void;
}

export function PlaylistCard({
  playlist: pl,
  isPlaying: isPlayingThis,
  isQueueing: isQueueingThis,
  isAnyPlayBusy,
  isFavProcessing: isImportingThisFav,
  isPlayerBusy,
  isFav,
  favGlobalBusy,
  onOpen,
  onPlay,
  onQueue,
  onToggleFav,
  onDelete,
}: PlaylistCardProps) {
  const isThisCardBusy = isPlayingThis || isQueueingThis || isImportingThisFav;
  const isPlayDisabled = isAnyPlayBusy || isPlayerBusy || isThisCardBusy;
  const isQueueDisabled = isAnyPlayBusy || isQueueingThis || isPlayingThis;
  const isFavDisabled = isAnyPlayBusy || isThisCardBusy || favGlobalBusy;
  const isDeleteDisabled = isAnyPlayBusy || isThisCardBusy;

  const neverSynced = pl.tracks.length === 0;
  const sourceTheme = playlistSourceTheme(pl.source);

  return (
    <div
      className={`group relative glass-panel p-3.5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5 ${
        isPlayingThis
          ? "border-[#1db954]/50 bg-[#1db954]/5 ring-1 ring-[#1db954]/30"
          : "hover:border-purple-500/40"
      }`}
    >
      <div>
        {/* Artwork Banner Container */}
        <div
          onClick={onOpen}
          className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden mb-3 bg-black/10 dark:bg-black/30 cursor-pointer select-none"
        >
          <CoverImage
            src={pl.cover}
            alt={pl.name}
            className="w-full h-full"
            iconSize={36}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            imgClassName="group-hover:scale-105 transition-transform duration-500 ease-out"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

          {/* Source Badge */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border md:backdrop-blur-md flex items-center gap-1 shadow-xs ${sourceTheme.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${sourceTheme.dot}`} />
              {sourceTheme.label}
            </span>
          </div>

          {/* Delete Action Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            disabled={isDeleteDisabled}
            title="Eliminar playlist"
            className={`absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/70 hover:bg-rose-500/80 text-white/70 hover:text-white md:backdrop-blur-md border border-white/10 hover:border-rose-400/50 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 shadow-xs ${
              isDeleteDisabled ? "cursor-not-allowed opacity-30 pointer-events-none" : "cursor-pointer"
            }`}
          >
            <Trash2 size={13} />
          </button>

          {/* Track count pill */}
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 z-10 pointer-events-none">
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-black/80 md:backdrop-blur-md text-white/90 border border-white/10 flex items-center gap-1 shadow-xs">
              <Music2 size={11} className="text-purple-400" />
              {neverSynced ? "Sin sincronizar" : `${pl.tracks.length} temas`}
            </span>
          </div>

          {/* Equalizer overlay when playing */}
          {isPlayingThis && (
            <div className="absolute inset-0 bg-black/70 md:bg-black/60 md:backdrop-blur-xs flex items-center justify-center gap-1.5 z-10">
              <span className="w-1.5 h-6 bg-[#1ed760] rounded-full animate-pulse" />
              <span className="w-1.5 h-8 bg-purple-400 rounded-full animate-pulse [animation-delay:150ms]" />
              <span className="w-1.5 h-5 bg-[#1ed760] rounded-full animate-pulse [animation-delay:300ms]" />
            </div>
          )}
        </div>

        {/* Title & Metadata */}
        <div className="mb-2">
          <h4
            onClick={onOpen}
            className="text-sm font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-purple-400 dark:hover:text-purple-300 transition-colors"
            title={pl.name}
          >
            {pl.name}
          </h4>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
            {!neverSynced ? (
              <span className="flex items-center gap-1 text-slate-400 dark:text-slate-400">
                <Clock size={11} />
                ~{formatDuration(totalDuration(pl.tracks))}
              </span>
            ) : (
              <span className="text-amber-500/90 dark:text-amber-400/90 text-[10px]">
                No sincronizada
              </span>
            )}
            {pl.synced_at && (
              <span className="text-[10px] text-slate-400/70 dark:text-slate-500">
                {timeAgo(pl.synced_at)}
              </span>
            )}
          </div>
        </div>

        {/* Top Tracks preview */}
        {pl.tracks.length > 0 ? (
          <p
            className="text-[11px] text-slate-500 dark:text-slate-400/80 truncate mb-3"
            title={pl.tracks.slice(0, 4).map((t) => t.title).join(" • ")}
          >
            {pl.tracks.slice(0, 3).map((t) => t.title).join(" • ")}
          </p>
        ) : (
          <p className="text-[11px] text-slate-400/60 dark:text-slate-500 italic truncate mb-3">
            Abre la playlist para sincronizar sus temas
          </p>
        )}
      </div>

      {/* Streamlined Action Buttons: Orden: Añadir cola (principal), Siguiente, Play, Favoritos */}
      <div className="flex items-center gap-1.5 sm:gap-2 pt-2.5 border-t border-black/5 dark:border-white/5 mt-auto">
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-medium bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap min-w-0"
          title="Ver temas de la playlist"
        >
          <Eye size={13} className="shrink-0" />
          <span className="truncate">Ver temas</span>
        </button>

        {/* Botón 1: Añadir a la cola (+) (principal coloreado) */}
        <button
          type="button"
          onClick={onQueue}
          disabled={isQueueDisabled}
          title="Añadir toda la playlist a la cola"
          aria-label={`Añadir ${pl.name} a la cola`}
          className="h-8.5 w-8.5 rounded-xl text-xs font-bold bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-50 text-black flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs shrink-0"
        >
          {isQueueingThis ? <Loader2 size={14} className="animate-spin text-black" /> : <Plus size={16} strokeWidth={2.5} />}
        </button>

        {/* Botón 2: Reproducir (Play) */}
        <button
          type="button"
          onClick={onPlay}
          disabled={isPlayDisabled}
          title={isPlayingThis ? "Sonando ahora" : "Reproducir playlist ahora"}
          aria-label={`Reproducir ${pl.name}`}
          className="h-8.5 w-8.5 rounded-xl text-xs font-semibold glass-btn text-slate-600 dark:text-slate-300 hover:text-purple-400 hover:border-purple-500/30 disabled:opacity-50 flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          {isPlayingThis ? <Loader2 size={14} className="animate-spin text-purple-400" /> : <Play size={14} className="fill-current text-slate-700 dark:text-slate-200 ml-0.5" />}
        </button>

        {/* Botón 4: Favoritos (Star) CUARTO */}
        <button
          type="button"
          onClick={onToggleFav}
          disabled={isFavDisabled}
          title={isFav ? "Quitar playlist de favoritos" : "Guardar todos los temas en favoritos"}
          aria-label={isFav ? `Quitar temas de ${pl.name} de favoritos` : `Guardar temas de ${pl.name} en favoritos`}
          className={`h-8.5 w-8.5 rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
            isFav
              ? "bg-amber-400/20 text-amber-400 border border-amber-400/40 hover:bg-amber-400/30 shadow-xs"
              : "glass-btn text-slate-500 dark:text-slate-300 hover:text-amber-400 hover:border-amber-400/30"
          }`}
        >
          {isImportingThisFav ? <Loader2 size={14} className="animate-spin text-amber-400" /> : <Star size={14} className={isFav ? "fill-amber-400 text-amber-400" : ""} />}
        </button>
      </div>
    </div>
  );
}
