"use client";

import type { Song, UserPlaylist } from "@/types/domain";
import type { SearchScope } from "@/types/music";
import type { usePlaylists } from "@/hooks/use-playlists";
import { SongCard, SongCardSkeleton } from "../song-card";
import { PlaylistCard, PlaylistCardSkeleton } from "../playlists/playlist-card";
import { PlaylistDetailModal } from "../playlists/playlist-detail-modal";
import { PlaylistDeleteModal } from "../playlists/playlist-delete-modal";
import { PlaylistFavModal } from "../playlists/playlist-fav-modal";
import { usePlaylistActions } from "@/features/music/hooks/use-playlist-actions";
import { Pagination } from "./pagination";
import { SONG_GRID, PLAYLIST_GRID } from "@/components/ui/grids";
import { Search, Star, ListMusic } from "lucide-react";

export interface SearchResultsSectionProps {
  query: string;
  scope: SearchScope;
  /** Cuántas son favoritas/guardadas y cuántas solo de YouTube (para la línea de resumen). */
  favoritesCount: number;
  youtubeCount: number;
  /** Canciones paginadas (cuando scope !== "playlists"). */
  paginatedSongs?: Song[];
  /** Playlists paginadas (cuando scope === "playlists"). */
  paginatedPlaylists?: UserPlaylist[];
  /** Estado de playlists para abrir modal y sincronizar tracks. */
  playlistsState?: ReturnType<typeof usePlaylists>;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  /** YouTube todavía está respondiendo. */
  isSearching: boolean;
  onPageChange: (page: number) => void;
  onScopeChange: (scope: SearchScope) => void;
}

function summaryText(scope: SearchScope, favorites: number, youtube: number): string {
  if (scope === "favorites") return `${favorites} ${favorites === 1 ? "favorita" : "favoritas"}`;
  if (scope === "youtube") return `${youtube} de YouTube`;
  if (scope === "playlists") {
    if (favorites > 0 && youtube > 0) {
      return `${favorites} ${favorites === 1 ? "guardada" : "guardadas"} · ${youtube} de YouTube`;
    }
    if (favorites > 0) {
      return `${favorites} ${favorites === 1 ? "playlist guardada" : "playlists guardadas"}`;
    }
    return `${youtube} ${youtube === 1 ? "playlist de YouTube" : "playlists de YouTube"}`;
  }
  return `${favorites} ${favorites === 1 ? "favorita" : "favoritas"} · ${youtube} de YouTube`;
}

/**
 * Resultados de la búsqueda como tarjetas.
 * Si scope === "playlists": muestra playlists guardadas + YouTube en PLAYLIST_GRID.
 * Si scope !== "playlists": muestra favoritas + canciones de YouTube en SONG_GRID.
 */
export function SearchResultsSection({
  query,
  scope,
  favoritesCount,
  youtubeCount,
  paginatedSongs = [],
  paginatedPlaylists = [],
  playlistsState,
  totalItems,
  currentPage,
  totalPages,
  itemsPerPage,
  isSearching,
  onPageChange,
  onScopeChange,
}: SearchResultsSectionProps) {
  const isPlaylistScope = scope === "playlists";
  const items = isPlaylistScope ? paginatedPlaylists : paginatedSongs;
  const targetTotal = isPlaylistScope ? 5 : 12;
  const skeletonCount = isSearching ? Math.max(0, targetTotal - items.length) : 0;
  const isEmpty = !isSearching && totalItems === 0;

  const {
    isPlayerBusy,
    playingId,
    queueingId,
    playNextId,
    importingFavId,
    playlistToDelete,
    favConfirmPlaylist,
    setPlaylistToDelete,
    setFavConfirmPlaylist,
    isPlaylistFav,
    handlePlayPlaylist,
    handlePlayNextPlaylist,
    handleQueuePlaylist,
    handleFavConfirm,
  } = usePlaylistActions(playlistsState?.handleDelete);

  return (
    <div className="space-y-3" aria-busy={isSearching}>
      <div className="flex items-center gap-2 px-1 text-[11px] text-slate-500 dark:text-slate-400">
        <Search size={12} className="text-purple-400" />
        <span>
          Resultados para <span className="font-semibold text-slate-700 dark:text-slate-200">&ldquo;{query}&rdquo;</span>
        </span>
        <span aria-hidden="true">·</span>
        <span>
          {isSearching && scope !== "favorites"
            ? isPlaylistScope
              ? "Buscando playlists en YouTube…"
              : "Buscando en YouTube…"
            : summaryText(scope, favoritesCount, youtubeCount)}
        </span>
      </div>

      {isEmpty ? (
        <div className="p-12 text-center glass-panel border border-dashed border-black/10 dark:border-white/10">
          {isPlaylistScope ? (
            <ListMusic size={32} className="mx-auto text-purple-400/50 mb-3" />
          ) : (
            <Star size={32} className="mx-auto text-amber-400/40 mb-3" />
          )}
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {scope === "favorites"
              ? `Ninguna favorita coincide con “${query}”`
              : isPlaylistScope
              ? `Sin playlists para “${query}”`
              : `Sin resultados para “${query}”`}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {scope === "favorites"
              ? "Prueba a buscar también en YouTube."
              : isPlaylistScope
              ? "Prueba con otro término de búsqueda o revisa el nombre de la playlist."
              : "Prueba con otro nombre, o pega un enlace de YouTube o Spotify."}
          </p>
          {(scope === "favorites" || isPlaylistScope) && (
            <button
              type="button"
              onClick={() => onScopeChange("all")}
              className="mt-4 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 cursor-pointer"
            >
              {isPlaylistScope ? "Buscar canciones" : "Buscar en todo"}
            </button>
          )}
        </div>
      ) : isPlaylistScope ? (
        <>
          <div className={PLAYLIST_GRID}>
            {paginatedPlaylists.map((pl) => (
              <PlaylistCard
                key={pl.id}
                playlist={pl}
                isFav={isPlaylistFav(pl)}
                isPlaying={playingId === pl.id}
                isQueueing={queueingId === pl.id}
                isAnyPlayBusy={playingId !== null}
                isPlayerBusy={isPlayerBusy}
                isFavProcessing={importingFavId === pl.id}
                favGlobalBusy={!!importingFavId}
                onOpen={() => playlistsState?.openPlaylist(pl)}
                onPlay={() => handlePlayPlaylist(pl)}
                onQueue={() => handleQueuePlaylist(pl)}
                onToggleFav={() => setFavConfirmPlaylist(pl)}
                onDelete={pl.user_id ? () => setPlaylistToDelete(pl) : undefined}
              />
            ))}
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <PlaylistCardSkeleton key={`pl-sk-${i}`} />
            ))}
          </div>

          {totalItems > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={onPageChange}
            />
          )}

          {playlistsState && (
            <>
              <PlaylistDetailModal
                playlist={playlistsState.selected}
                live={playlistsState.live}
                isFav={playlistsState.selected ? isPlaylistFav(playlistsState.selected) : false}
                favGlobalBusy={!!importingFavId}
                favProcessingId={importingFavId}
                queueingId={queueingId}
                playNextId={playNextId}
                playingId={playingId}
                onClose={playlistsState.closeModal}
                onToggleFav={() => playlistsState.selected && setFavConfirmPlaylist(playlistsState.selected)}
                onQueuePlaylist={handleQueuePlaylist}
                onPlayNextPlaylist={handlePlayNextPlaylist}
                onPlayPlaylist={handlePlayPlaylist}
              />

              <PlaylistDeleteModal
                playlist={playlistToDelete}
                onClose={() => setPlaylistToDelete(null)}
                onConfirm={async (id, name) => {
                  if (playlistsState.handleDelete) {
                    await playlistsState.handleDelete(id, name);
                  }
                }}
              />

              <PlaylistFavModal
                playlist={favConfirmPlaylist}
                isFav={favConfirmPlaylist ? isPlaylistFav(favConfirmPlaylist) : false}
                isProcessing={!!importingFavId}
                onClose={() => setFavConfirmPlaylist(null)}
                onConfirm={handleFavConfirm}
              />
            </>
          )}
        </>
      ) : (
        <>
          <div className={SONG_GRID}>
            {paginatedSongs.map((song) => (
              <SongCard key={song.id || song.url} song={song} />
            ))}
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <SongCardSkeleton key={`sk-${i}`} />
            ))}
          </div>

          {totalItems > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={onPageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
