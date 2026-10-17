"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/context/auth-context";
import type { UserPlaylist } from "@/types/domain";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { logger } from "@/lib/logger";

export interface FavPlaylistsValue {
  favPlaylistIds: Set<string>;
  saveFavPlaylistIds: (newSet: Set<string>) => void;
  isPlaylistFav: (playlist: UserPlaylist) => boolean;
}

export function useFavPlaylists(
  isFavorite: (idOrUrl: string) => boolean
): FavPlaylistsValue {
  const { user } = useAuth();
  const userId = user?.id || "guest";

  // Set de IDs de playlists que el usuario tiene guardadas en favoritos
  const [favPlaylistIds, setFavPlaylistIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.favPlaylistsPrefix + userId);
      if (!stored) return new Set<string>();
      const parsed: unknown = JSON.parse(stored);
      return Array.isArray(parsed) ? new Set(parsed as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const saveFavPlaylistIds = useCallback(
    (newSet: Set<string>) => {
      setFavPlaylistIds(newSet);
      try {
        localStorage.setItem(
          STORAGE_KEYS.favPlaylistsPrefix + userId,
          JSON.stringify(Array.from(newSet))
        );
      } catch (e) {
        logger.warn("Error saving favorite playlists to localStorage", e);
      }
    },
    [userId]
  );

  // Helper para saber si una playlist está en favoritos
  const isPlaylistFav = useCallback(
    (pl: UserPlaylist) => {
      if (favPlaylistIds.has(pl.id)) return true;
      if (pl.tracks && pl.tracks.length > 0) {
        return pl.tracks.every((t) => isFavorite(t.id) || isFavorite(t.url));
      }
      return false;
    },
    [favPlaylistIds, isFavorite]
  );

  return { favPlaylistIds, saveFavPlaylistIds, isPlaylistFav };
}
