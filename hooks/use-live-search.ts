"use client";

import { useState, useEffect } from "react";
import { igniteApi } from "@/lib/ignite-api";
import type { Song } from "@/types/domain";
import type { SearchScope } from "@/types/music";

/** Cuántos resultados de YouTube se piden (el servidor admite hasta 15). */
export const SEARCH_LIMIT = 12;
const DEBOUNCE_MS = 350;

/**
 * Búsqueda en vivo en YouTube.
 *
 * - No pide nada si el texto es un enlace, tiene menos de 2 letras o el filtro es "favoritos".
 * - Los resultados se quedan mientras el texto no cambie: usar una tarjeta no los borra.
 * - Una respuesta de un texto anterior nunca se muestra (se compara con el texto actual).
 */
export function useLiveSearch(searchInput: string, isUrl: boolean, scope: SearchScope) {
  const query = searchInput.trim();
  const enabled = !isUrl && query.length >= 2 && scope !== "favorites" && scope !== "playlists";
  const [state, setState] = useState<{ query: string | null; results: Song[] }>({
    query: null,
    results: [],
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      let items: Song[] = [];
      try {
        items = await igniteApi.searchVideos(query, SEARCH_LIMIT);
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
    searchResults: isFresh ? state.results : [],
    isSearching: enabled && !isFresh,
  };
}
