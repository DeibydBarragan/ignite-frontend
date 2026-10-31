"use client";

import { useState } from "react";
import { usePlayerStore } from "@/features/music/stores/player-store";
import { useFavorites } from "@/context/favorites-context";
import { useUrlImport } from "@/hooks/use-url-import";
import { useFavPlaylists } from "@/hooks/use-fav-playlists";
import { useToast } from "@/components/ui/toast";
import type { UserPlaylist } from "@/types/domain";

export function usePlaylistActions(onDeletePlaylist?: (id: string, name?: string) => Promise<void>) {
  const isPlayerBusy = usePlayerStore((s) => s.isPlayerBusy);
  const { importPlaylistToFavorites, removePlaylistFromFavorites, isFavorite } = useFavorites();
  const importUrlSong = useUrlImport();
  const { toast } = useToast();

  const { favPlaylistIds, saveFavPlaylistIds, isPlaylistFav } = useFavPlaylists(isFavorite);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [queueingId, setQueueingId] = useState<string | null>(null);
  const [playNextId, setPlayNextId] = useState<string | null>(null);
  const [importingFavId, setImportingFavId] = useState<string | null>(null);
  const [playlistToDelete, setPlaylistToDelete] = useState<UserPlaylist | null>(null);
  const [favConfirmPlaylist, setFavConfirmPlaylist] = useState<UserPlaylist | null>(null);

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

  const handleDeleteConfirm = async () => {
    const target = playlistToDelete;
    if (!target) return;
    setPlaylistToDelete(null);
    if (onDeletePlaylist) {
      await onDeletePlaylist(target.id, target.name);
    }
  };

  return {
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
    handleImportFavorites,
    handleRemoveFavorites,
    handleFavConfirm,
    handleDeleteConfirm,
  };
}
