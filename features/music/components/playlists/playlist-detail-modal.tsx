"use client";

import type { UserPlaylist } from "@/types/domain";
import type { PlaylistLiveState } from "@/types/music";
import { usePlayerStore } from "@/features/music/stores/player-store";
import { useQueueStore } from "@/features/music/stores/queue-store";
import { useFavorites } from "@/context/favorites-context";
import { useQueueActions } from "@/hooks/use-queue-actions";
import { formatDuration, timeAgo, totalDuration } from "@/lib/formatters";
import { GlassModal } from "@/components/ui/glass-modal";
import { TrackSkeletonRows } from "../music-view/track-skeleton-rows";
import { PlaylistTrackRow } from "./playlist-track-row";
import {
  ListMusic,
  Loader2,
  ExternalLink,
  Star,
  Play,
  ListPlus,
  Plus,
  AlertCircle,
} from "lucide-react";

export interface PlaylistDetailModalProps {
  playlist: UserPlaylist | null;
  live: PlaylistLiveState | null;
  isFav: boolean;
  favGlobalBusy: boolean;
  favProcessingId: string | null;
  queueingId: string | null;
  playNextId?: string | null;
  playingId: string | null;
  onClose: () => void;
  onToggleFav: (playlist: UserPlaylist) => void;
  onQueuePlaylist: (playlist: UserPlaylist) => void;
  onPlayNextPlaylist?: (playlist: UserPlaylist) => void;
  onPlayPlaylist: (playlist: UserPlaylist) => void;
}

export function PlaylistDetailModal({
  playlist: selected,
  live,
  isFav,
  favGlobalBusy,
  favProcessingId,
  queueingId,
  playNextId,
  playingId,
  onClose,
  onToggleFav,
  onQueuePlaylist,
  onPlayNextPlaylist,
  onPlayPlaylist,
}: PlaylistDetailModalProps) {
  const isPlayerBusy = usePlayerStore((s) => s.isPlayerBusy);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const pendingSongActions = useQueueStore((s) => s.pendingSongActions);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { playSong, playNext, addToQueue } = useQueueActions();

  // Si se presiona Play, se bloquean todas las canciones mientras carga.
  // Si se presiona Añadir a la cola o Siguiente, solo se bloquea la actual.
  const isAnyPlayBusy =
    isPlayerBusy ||
    playingId !== null ||
    Object.values(pendingSongActions).some((a) => a === "play");

  const modalTracks =
    live?.status === "ok" && selected && live.playlistId === selected.id
      ? live.tracks
      : selected?.tracks || [];
  const isSyncing = !!selected && (!live || live.playlistId !== selected.id || live.status === "loading");
  const syncFailed = !!selected && !!live && live.playlistId === selected.id && live.status === "error";

  return (
    <GlassModal
      isOpen={!!selected}
      onClose={onClose}
      maxWidth="3xl"
      icon={<ListMusic size={20} />}
      title={selected?.name || "Playlist"}
      subtitle={
        selected
          ? isSyncing
            ? "Sincronizando con el estado actual de la playlist…"
            : `${modalTracks.length} temas — ~${formatDuration(totalDuration(modalTracks))} — ${selected.source} · ${timeAgo(selected.synced_at)}`
          : undefined
      }
      footer={
        selected && !isSyncing && modalTracks.length > 0 ? (
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
            {/* Botones secundarios (favs, link externo) */}
            <div className="flex items-center gap-2 justify-between sm:justify-start w-full sm:w-auto">
              <a
                href={selected.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`Abrir playlist en ${selected.source}`}
                className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium glass-btn text-slate-400 hover:text-slate-100 flex items-center justify-center gap-1.5 transition-colors shrink-0"
              >
                <ExternalLink size={13} />
                <span className="hidden md:inline">Abrir en {selected.source}</span>
              </a>

              {/* Botón Favoritos con estado coloreado */}
              <button
                type="button"
                onClick={() => selected && onToggleFav(selected)}
                disabled={favGlobalBusy}
                title={isFav ? "Quitar playlist de favoritos" : "Guardar todos los temas en favoritos"}
                className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors whitespace-nowrap ${
                  isFav
                    ? "bg-amber-400/20 text-amber-400 border border-amber-400/40 hover:bg-amber-400/30"
                    : "glass-btn text-slate-700 dark:text-slate-200 hover:text-amber-400"
                }`}
              >
                {favProcessingId === selected.id ? (
                  <Loader2 size={13} className="animate-spin text-amber-400" />
                ) : (
                  <Star size={13} className={isFav ? "fill-amber-400 text-amber-400" : ""} />
                )}
                <span>{isFav ? "En favoritos" : "Favoritos"}</span>
              </button>
            </div>

            {/* Botones de acción: Añadir cola (principal), Siguiente, Reproducir todo */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              {/* Botón 1: Añadir a la cola (ancho completo en móvil como acción primaria) */}
              <button
                type="button"
                onClick={() => onQueuePlaylist(selected)}
                disabled={isAnyPlayBusy || queueingId === selected.id}
                className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-xl text-xs font-bold bg-[#1db954] hover:bg-[#1ed760] text-black shadow-md shadow-[#1db954]/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all whitespace-nowrap active:scale-[0.98]"
              >
                {queueingId === selected.id ? (
                  <Loader2 size={14} className="animate-spin text-black" />
                ) : (
                  <Plus size={15} strokeWidth={2.5} />
                )}
                <span>Añadir a la cola</span>
              </button>

              {/* Sub-fila de reproducción en móvil (Siguiente / Reproducir todo) */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Botón 2: Siguiente */}
                {onPlayNextPlaylist && (
                  <button
                    type="button"
                    onClick={() => onPlayNextPlaylist(selected)}
                    disabled={isAnyPlayBusy || playNextId === selected.id}
                    className="flex-1 sm:flex-none px-3 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-semibold glass-btn text-slate-900 dark:text-white hover:text-purple-400 hover:border-purple-500/40 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all whitespace-nowrap active:scale-[0.98]"
                  >
                    {playNextId === selected.id ? (
                      <Loader2 size={14} className="animate-spin text-purple-400" />
                    ) : (
                      <ListPlus size={15} />
                    )}
                    <span>Siguiente</span>
                  </button>
                )}

                {/* Botón 3: Reproducir todo */}
                <button
                  type="button"
                  onClick={() => {
                    onPlayPlaylist(selected);
                    onClose();
                  }}
                  disabled={isAnyPlayBusy || playingId === selected.id}
                  className="flex-1 sm:flex-none px-3 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-semibold glass-btn text-slate-900 dark:text-white hover:text-purple-400 hover:border-purple-500/40 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all whitespace-nowrap active:scale-[0.98]"
                >
                  {playingId === selected.id ? (
                    <Loader2 size={14} className="animate-spin text-purple-400" />
                  ) : (
                    <Play size={14} className="fill-current text-purple-400" />
                  )}
                  <span>Reproducir<span className="hidden min-[380px]:inline"> todo</span></span>
                </button>
              </div>
            </div>
          </div>
        ) : undefined
      }
    >
      {selected && (
        <div className="space-y-1.5">
          {isSyncing ? (
            <div className="space-y-3 py-2">
              <TrackSkeletonRows />
            </div>
          ) : (
            <>
              {syncFailed && (
                <div className="px-3 py-2 rounded-lg text-[11px] flex items-center gap-2 bg-amber-500/10 text-amber-500 border border-amber-500/25 mb-1">
                  <AlertCircle size={13} />
                  <span>
                    No se pudo actualizar{selected.synced_at ? ` (última versión: ${timeAgo(selected.synced_at)})` : ""}. Mostrando última versión conocida.
                  </span>
                </div>
              )}
              {modalTracks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No se encontraron temas. Revisa que la playlist sea pública.
                </p>
              ) : (
                modalTracks.map((track, idx) => (
                  <PlaylistTrackRow
                    key={track.id + "-" + idx}
                    track={track}
                    index={idx}
                    isFavorite={isFavorite(track.id) || isFavorite(track.url)}
                    isCurrent={currentSong?.id === track.id || currentSong?.url === track.url}
                    isPlaying={isPlaying}
                    isAnyPlayBusy={isAnyPlayBusy}
                    pendingAction={pendingSongActions[track.id] ?? null}
                    onToggleFavorite={toggleFavorite}
                    onPlay={playSong}
                    onPlayNext={playNext}
                    onAddToQueue={addToQueue}
                  />
                ))
              )}
            </>
          )}
        </div>
      )}
    </GlassModal>
  );
}
