"use client";

import { useCallback } from "react";
import type { Song } from "@/types/domain";
import { useAuthCore } from "@/context/auth-context";
import { igniteApi } from "@/lib/ignite-api";
import { insertFavoriteRows, deleteFavoritesByKeys } from "@/lib/favorites-service";

export interface PlaylistFavoritesValue {
  importPlaylistToFavorites: (input: {
    name: string;
    url: string;
  }) => Promise<{ added: number; skipped: number; total: number; error: string | null }>;
  removePlaylistFromFavorites: (input: {
    url: string;
    tracks?: Song[];
  }) => Promise<{ removed: number; error: string | null }>;
}

export function usePlaylistFavorites(
  favorites: Song[],
  setFavorites: React.Dispatch<React.SetStateAction<Song[]>>
): PlaylistFavoritesValue {
  const { isLoggedIn, user, selectedGuildId } = useAuthCore();

  const importPlaylistToFavorites = useCallback(
    async (input: { name: string; url: string }) => {
      if (!isLoggedIn || !user) {
        return { added: 0, skipped: 0, total: 0, error: "Debes iniciar sesión con Discord." };
      }
      const uid = user.id;
      const res = await igniteApi.resolvePlaylist(selectedGuildId, input.url);
      const tracks = res.success && res.tracks ? res.tracks : [];
      if (tracks.length === 0) {
        return {
          added: 0,
          skipped: 0,
          total: 0,
          error: res.error || "No se pudieron obtener los temas de esa playlist.",
        };
      }

      const fresh: Song[] = tracks
        .filter((t) => Boolean(t?.url) && !favorites.some((f) => f.id === t.id || f.url === t.url))
        .map((t) => ({
          id: t.id || t.url,
          title: t.title || "Sin título",
          artist: t.artist || "Desconocido",
          albumArt:
            t.albumArt ||
            "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
          duration: t.duration || 180,
          source: (t.source as Song["source"]) || "youtube",
          url: t.url,
          category: "hits" as const,
          isLyric: t.isLyric ?? false,
        }));

      if (fresh.length === 0) {
        return { added: 0, skipped: tracks.length, total: tracks.length, error: null };
      }

      setFavorites((prev) => [...fresh, ...prev]);

      try {
        await insertFavoriteRows(uid, fresh);
      } catch (err) {
        const { logger } = await import("@/lib/logger");
        logger.error("Error importing playlist to favorites:", err);
        const freshIds = new Set(fresh.map((s) => s.id));
        setFavorites((prev) => prev.filter((s) => !freshIds.has(s.id)));
        return {
          added: 0,
          skipped: tracks.length - fresh.length,
          total: tracks.length,
          error: "No se pudo guardar en Supabase. Revisa tu conexión e inténtalo de nuevo.",
        };
      }

      return {
        added: fresh.length,
        skipped: tracks.length - fresh.length,
        total: tracks.length,
        error: null,
      };
    },
    [isLoggedIn, user, favorites, selectedGuildId, setFavorites]
  );

  const removePlaylistFromFavorites = useCallback(
    async (input: { url: string; tracks?: Song[] }) => {
      if (!isLoggedIn || !user) {
        return { removed: 0, error: "Debes iniciar sesión con Discord." };
      }
      const uid = user.id;
      let targetTracks = input.tracks && input.tracks.length > 0 ? input.tracks : [];
      if (targetTracks.length === 0) {
        const res = await igniteApi.resolvePlaylist(selectedGuildId, input.url);
        if (res.success && res.tracks) {
          targetTracks = res.tracks;
        }
      }

      if (targetTracks.length === 0) {
        return { removed: 0, error: "No se encontraron temas en esa playlist." };
      }

      const targetUrls = new Set(targetTracks.map((t) => t.url).filter(Boolean));
      const targetIds = new Set(targetTracks.map((t) => t.id).filter(Boolean));

      const toRemove = favorites.filter((f) => targetUrls.has(f.url) || targetIds.has(f.id));
      if (toRemove.length === 0) {
        return { removed: 0, error: null };
      }

      setFavorites((prev) => prev.filter((f) => !targetUrls.has(f.url) && !targetIds.has(f.id)));

      try {
        await deleteFavoritesByKeys(uid, Array.from(targetUrls), Array.from(targetIds));
      } catch (err) {
        const { logger } = await import("@/lib/logger");
        logger.error("Error removing playlist favorites from Supabase:", err);
        setFavorites((prev) => [...toRemove, ...prev]);
        return { removed: 0, error: "Error al eliminar de favoritos. Inténtalo de nuevo." };
      }

      return { removed: toRemove.length, error: null };
    },
    [isLoggedIn, user, favorites, selectedGuildId, setFavorites]
  );

  return { importPlaylistToFavorites, removePlaylistFromFavorites };
}
