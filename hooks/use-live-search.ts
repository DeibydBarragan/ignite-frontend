"use client";

import { useState, useEffect, useRef } from "react";
import { igniteApi } from "@/lib/ignite-api";
import type { Song } from "@/types/domain";

export function useLiveSearch(searchInput: string, isUrl: boolean) {
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Búsqueda en vivo: Videos exactos de YouTube
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = searchInput.trim();
    if (isUrl || q.length < 2) {
      searchTimer.current = setTimeout(() => {
        setSearchResults([]);
        setShowSuggestions(false);
        setIsSearching(false);
      }, 0);
      return () => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
      };
    }

    searchTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const items = await igniteApi.searchVideos(q, 6);
        setSearchResults(items);
        setShowSuggestions(items.length > 0);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchInput, isUrl]);

  return { searchResults, setSearchResults, isSearching, showSuggestions, setShowSuggestions };
}
