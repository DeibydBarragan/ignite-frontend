"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Song } from "@/types/domain";
import { useAuthCore } from "@/context/auth-context";
import { usePlayerStore } from "@/features/music/stores/player-store";
import { useQueueActions } from "@/hooks/use-queue-actions";
import { usePlaylistFavorites } from "@/hooks/use-playlist-favorites";
import { fetchFavoriteSongs, insertFavorite, deleteFavorite } from "@/lib/favorites-service";
import { logger } from "@/lib/logger";

export interface FavoritesContextValue {
  favorites: Song[];
  isLoadingFavorites: boolean;
  isFavorite: (songIdOrUrl: string) => boolean;
  toggleFavorite: (song: Song) => Promise<void>;
  importPlaylistToFavorites: (input: {
    name: string;
    url: string;
  }) => Promise<{ added: number; skipped: number; total: number; error: string | null }>;
  removePlaylistFromFavorites: (input: {
    url: string;
    tracks?: Song[];
  }) => Promise<{ removed: number; error: string | null }>;
  playFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, user } = useAuthCore();
  const isPlayerBusy = usePlayerStore((s) => s.isPlayerBusy);
  const { playSong, addToQueue } = useQueueActions();
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!isLoggedIn || !user?.id) {
        if (!cancelled) {
          setFavorites([]);
          setIsLoadingFavorites(false);
        }
        return;
      }
      setIsLoadingFavorites(true);
      try {
        const songs = await fetchFavoriteSongs(user.id);
        if (!cancelled) setFavorites(songs);
      } catch (err) {
        logger.error("Error loading favorites from Supabase:", err);
      } finally {
        if (!cancelled) setIsLoadingFavorites(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, user?.id]);

  const isFavorite = useCallback(
    (songIdOrUrl: string) => favorites.some((f) => f.id === songIdOrUrl || f.url === songIdOrUrl),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (song: Song) => {
      if (!isLoggedIn || !user) return;
      const uid = user.id;
      const isAlready = favorites.some((f) => f.id === song.id || f.url === song.url);

      if (isAlready) {
        setFavorites((prev) => prev.filter((f) => f.id !== song.id && f.url !== song.url));
        try {
          await deleteFavorite(uid, song);
        } catch (err) {
          logger.error("Error removing favorite from Supabase:", err);
          setFavorites((prev) => [song, ...prev]);
        }
      } else {
        setFavorites((prev) => [song, ...prev]);
        try {
          await insertFavorite(uid, song);
        } catch (err) {
          logger.error("Error adding favorite to Supabase:", err);
          setFavorites((prev) => prev.filter((f) => f.id !== song.id && f.url !== song.url));
        }
      }
    },
    [isLoggedIn, user, favorites]
  );

  const playFavorites = useCallback(async () => {
    if (!isLoggedIn || !favorites.length || isPlayerBusy) return;
    const [first, ...rest] = favorites;
    await playSong(first);
    for (const song of rest) {
      await addToQueue(song);
    }
  }, [isLoggedIn, favorites, isPlayerBusy, playSong, addToQueue]);

  const { importPlaylistToFavorites, removePlaylistFromFavorites } = usePlaylistFavorites(
    favorites,
    setFavorites
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      isLoadingFavorites,
      isFavorite,
      toggleFavorite,
      importPlaylistToFavorites,
      removePlaylistFromFavorites,
      playFavorites,
    }),
    [
      favorites,
      isLoadingFavorites,
      isFavorite,
      toggleFavorite,
      importPlaylistToFavorites,
      removePlaylistFromFavorites,
      playFavorites,
    ]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within a FavoritesProvider");
  return ctx;
}
