"use client";

import { useMemo, useState } from "react";
import { usePlayerStore } from "@/features/music/stores/player-store";
import { useFavorites } from "@/context/favorites-context";
import { useUrlImport } from "@/hooks/use-url-import";
import { usePlaylists } from "@/hooks/use-playlists";
import { useFavPlaylists } from "@/hooks/use-fav-playlists";
import type { UserPlaylist } from "@/types/domain";
import { PlaylistsToolbar } from "./playlists-toolbar";
import { PlaylistCard } from "./playlist-card";
import { PlaylistDetailModal } from "./playlist-detail-modal";
import { PlaylistFavModal } from "./playlist-fav-modal";
import { PlaylistDeleteModal } from "./playlist-delete-modal";
import { useToast } from "@/components/ui/toast";
import { ListMusic, Loader2 } from "lucide-react";

export function PlaylistsView() {
  const isPlayerBusy = usePlayerStore((s) => s.isPlayerBusy);
  const { importPlaylistToFavorites, removePlaylistFromFavorites, isFavorite } = useFavorites();
  const importUrlSong = useUrlImport();
  const { toast } = useToast();

  const {
    playlists,
    isLoading,
    importUrl,
    setImportUrl,
    importName,
    setImportName,
    isImporting,
    handleImport,
    handleDelete,
    selected,
    live,
    openPlaylist,
    closeModal,
  } = usePlaylists();

  const { favPlaylistIds, saveFavPlaylistIds, isPlaylistFav } = useFavPlaylists(isFavorite);

  const [search, setSearch] = useState("");
  const [importingFavId, setImportingFavId] = useState<string | null>(null);
  const [playlistToDelete, setPlaylistToDelete] = useState<UserPlaylist | null>(null);
  const [favConfirmPlaylist, setFavConfirmPlaylist] = useState<UserPlaylist | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [queueingId, setQueueingId] = useState<string | null>(null);
  const [playNextId, setPlayNextId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return playlists;
    return playlists.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.source.toLowerCase().includes(q) ||
        p.tracks.some((t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q))
    );
  }, [playlists, search]);

  const handlePlayPlaylist = async (pl: UserPlaylist) => {
    if (isPlayerBusy || playingId !== null) return;
    setPlayingId(pl.id);
    try {
      const res = await importUrlSong(pl.url, { skip: true });
      toast(res.success ? `Reproduciendo "${pl.name}".` : res.message, res.success ? "success" : "error");
    } finally {
      setPlayingId(null);
    }
  };

  const handlePlayNextPlaylist = async (pl: UserPlaylist) => {
    if (playingId !== null || playNextId === pl.id) return;
    setPlayNextId(pl.id);
    try {
      const res = await importUrlSong(pl.url, { next: true });
      toast(res.success ? `"${pl.name}" se reproducirá a continuación.` : res.message, res.success ? "success" : "error");
    } finally {
      setPlayNextId(null);
    }
  };

  const handleQueuePlaylist = async (pl: UserPlaylist) => {
    if (playingId !== null || queueingId === pl.id) return;
    setQueueingId(pl.id);
    try {
      const res = await importUrlSong(pl.url);
      toast(res.success ? `"${pl.name}" añadida a la cola.` : res.message, res.success ? "success" : "error");
    } finally {
      setQueueingId(null);
    }
  };

  const handleImportFavorites = async (pl: UserPlaylist) => {
    if (importingFavId) return;
    setImportingFavId(pl.id);
    try {
      const res = await importPlaylistToFavorites({ name: pl.name, url: pl.url });
      if (res.error) {
        toast(res.error, "error");
      } else {
        const next = new Set(favPlaylistIds);
        next.add(pl.id);
        saveFavPlaylistIds(next);
        toast(
          res.added === 0
            ? `Playlist "${pl.name}" marcada en favoritos.`
            : `${res.added} tema(s) guardados en favoritos.`,
          "success"
        );
      }
    } finally {
      setImportingFavId(null);
    }
  };

  const handleRemoveFavorites = async (pl: UserPlaylist) => {
    if (importingFavId) return;
    setImportingFavId(pl.id);
    try {
      const res = await removePlaylistFromFavorites({ url: pl.url, tracks: pl.tracks });
      if (res.error) {
        toast(res.error, "error");
      } else {
        const next = new Set(favPlaylistIds);
        next.delete(pl.id);
        saveFavPlaylistIds(next);
        toast(`Playlist "${pl.name}" quitada de favoritos.`, "success");
      }
    } finally {
      setImportingFavId(null);
    }
  };

  const handleFavConfirm = async () => {
    const target = favConfirmPlaylist;
    if (!target) return;
    const removing = isPlaylistFav(target);
    setFavConfirmPlaylist(null);
    if (removing) {
      await handleRemoveFavorites(target);
    } else {
      await handleImportFavorites(target);
    }
  };

  return (
    <div className="space-y-4">
      <PlaylistsToolbar
        search={search}
        onSearchChange={setSearch}
        importUrl={importUrl}
        onImportUrlChange={setImportUrl}
        importName={importName}
        onImportNameChange={setImportName}
        isImporting={isImporting}
        onImport={handleImport}
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
          <Loader2 size={32} className="animate-spin text-purple-500" />
          <p className="text-xs">Cargando tus playlists...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-8 text-center rounded-2xl flex flex-col items-center gap-2">
          <ListMusic size={32} className="text-slate-400" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {search ? "No se encontraron playlists" : "No tienes playlists guardadas"}
          </p>
          <p className="text-xs text-slate-500 max-w-sm">
            {search
              ? "Prueba con otro término de búsqueda."
              : "Importa una playlist de Spotify o YouTube con la barra superior para acceder a ella rápidamente."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((pl) => (
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
              onOpen={() => openPlaylist(pl)}
              onPlay={() => handlePlayPlaylist(pl)}
              onQueue={() => handleQueuePlaylist(pl)}
              onToggleFav={() => setFavConfirmPlaylist(pl)}
              onDelete={() => setPlaylistToDelete(pl)}
            />
          ))}
        </div>
      )}

      <PlaylistDetailModal
        playlist={selected}
        live={live}
        onClose={closeModal}
        isFav={!!selected && isPlaylistFav(selected)}
        favGlobalBusy={!!importingFavId}
        favProcessingId={importingFavId}
        queueingId={queueingId}
        playNextId={playNextId}
        playingId={playingId}
        onToggleFav={setFavConfirmPlaylist}
        onQueuePlaylist={handleQueuePlaylist}
        onPlayNextPlaylist={handlePlayNextPlaylist}
        onPlayPlaylist={handlePlayPlaylist}
      />

      <PlaylistFavModal
        playlist={favConfirmPlaylist}
        isFav={!!favConfirmPlaylist && isPlaylistFav(favConfirmPlaylist)}
        isProcessing={!!importingFavId}
        onClose={() => setFavConfirmPlaylist(null)}
        onConfirm={handleFavConfirm}
      />

      <PlaylistDeleteModal
        playlist={playlistToDelete}
        onClose={() => setPlaylistToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
