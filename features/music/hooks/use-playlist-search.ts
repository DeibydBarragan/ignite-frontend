"use client";

import { useState, useEffect } from "react";
import { igniteApi } from "@/lib/ignite-api";
import type { PlaylistSearchResult } from "@/types/domain";
import type { SearchScope } from "@/types/music";

export const PLAYLIST_SEARCH_LIMIT = 12;
const DEBOUNCE_MS = 350;

/**
 * Búsqueda en vivo de playlists de YouTube.
 *
 * - Se activa cuando el scope es "playlists", no es URL y el query tiene 2+ caracteres.
 * - Debounce de 350ms con cancelación si cambia la búsqueda.
 */
export function usePlaylistSearch(searchInput: string, isUrl: boolean, scope: SearchScope) {
  const query = searchInput.trim();
  const enabled = !isUrl && query.length >= 2 && scope === "playlists";
  const [state, setState] = useState<{ query: string | null; results: PlaylistSearchResult[] }>({
    query: null,
    results: [],
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      let items: PlaylistSearchResult[] = [];
      try {
        items = await igniteApi.searchPlaylists(query, PLAYLIST_SEARCH_LIMIT);
      } catch {
        items = [];
      }
      if (!cancelled) setState({ query, results: items });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, query]);

  const isFresh = enabled && state.query === query;
  return {
    playlistResults: isFresh ? state.results : [],
    isSearchingPlaylists: enabled && !isFresh,
  };
}
