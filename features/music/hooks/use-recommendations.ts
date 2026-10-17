"use client";

import { useState, useEffect, useRef } from "react";
import { igniteApi } from "@/lib/ignite-api";
import { MOCK_SONGS } from "@/lib/mock-data";
import { logger } from "@/lib/logger";
import type { Song } from "@/types/domain";
import type { MusicSubTab, TopSubTab } from "@/types/music";

interface RadioCacheEntry {
  songs: Song[];
  basedOn: Song | null;
  timestamp: number;
}

interface TopCacheEntry {
  songs: Song[];
  timestamp: number;
}

export const RADIO_CACHE_TTL_MS = 20 * 60 * 1000; // 20 min
export const TOP_CACHE_TTL_MS = 5 * 60 * 1000;    // 5 min
const MAX_CACHE_ENTRIES = 50;

export const radioMemoryCache = new Map<string, RadioCacheEntry>();
export const topMemoryCache = new Map<string, TopCacheEntry>();

export function clearRecommendationsCache(): void {
  radioMemoryCache.clear();
  topMemoryCache.clear();
}

function trimCache<K, V>(map: Map<K, V>, max: number): void {
  while (map.size > max) {
    const firstKey = map.keys().next().value;
    if (firstKey !== undefined) map.delete(firstKey);
    else break;
  }
}

export function useRecommendations({
  activeTab,
  topSubTab,
  selectedGuildId,
  radioSongKey,
}: {
  activeTab: MusicSubTab;
  topSubTab: TopSubTab;
  selectedGuildId?: string;
  radioSongKey?: string;
}) {
  const [recSongs, setRecSongs] = useState<Song[]>([]);
  const [basedOnSong, setBasedOnSong] = useState<Song | null>(null);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [recsRefreshKey, setRecsRefreshKey] = useState(0);
  const isForcedRef = useRef(false);

  useEffect(() => {
    if ((activeTab !== "radio" && activeTab !== "top") || !selectedGuildId) return;
    let cancelled = false;
    const isRadio = activeTab === "radio";
    const mode = topSubTab;
    const isForced = isForcedRef.current;
    isForcedRef.current = false;

    const load = async () => {
      // Si no es un refresco forzado manual, revisar caché en memoria primero
      if (!isForced) {
        if (isRadio && radioSongKey) {
          const cacheKey = `${selectedGuildId}:${radioSongKey}`;
          const cached = radioMemoryCache.get(cacheKey);
          if (cached && Date.now() - cached.timestamp < RADIO_CACHE_TTL_MS) {
            setRecSongs(cached.songs);
            setBasedOnSong(cached.basedOn);
            setIsLoadingRecs(false);
            return;
          }
        } else if (!isRadio) {
          const cacheKey = `${selectedGuildId}:${mode}`;
          const cached = topMemoryCache.get(cacheKey);
          if (cached && Date.now() - cached.timestamp < TOP_CACHE_TTL_MS) {
            setRecSongs(cached.songs);
            setBasedOnSong(null);
            setIsLoadingRecs(false);
            return;
          }
        }
      }

      setIsLoadingRecs(true);
      try {
        if (isRadio) {
          const res = await igniteApi.getRecommendations(selectedGuildId, { force: isForced });
          if (cancelled) return;
          if (res.success && res.songs.length > 0) {
            setRecSongs(res.songs);
            setBasedOnSong(res.basedOn);
            if (radioSongKey) {
              trimCache(radioMemoryCache, MAX_CACHE_ENTRIES);
              radioMemoryCache.set(`${selectedGuildId}:${radioSongKey}`, {
                songs: res.songs,
                basedOn: res.basedOn,
                timestamp: Date.now(),
              });
            }
          } else {
            const fallback = process.env.NEXT_PUBLIC_USE_MOCKS === "true" ? MOCK_SONGS : [];
            setRecSongs(fallback);
            setBasedOnSong(null);
          }
        } else {
          const res = await igniteApi.getTopSongs(selectedGuildId, mode);
          if (cancelled) return;
          if (res.success && res.songs.length > 0) {
            setRecSongs(res.songs);
            trimCache(topMemoryCache, MAX_CACHE_ENTRIES);
            topMemoryCache.set(`${selectedGuildId}:${mode}`, {
              songs: res.songs,
              timestamp: Date.now(),
            });
          } else {
            setRecSongs([]);
          }
          setBasedOnSong(null);
        }
      } catch (err) {
        logger.error("Error loading recommendations:", err);
        if (!cancelled) {
          if (isRadio) {
            const fallback = process.env.NEXT_PUBLIC_USE_MOCKS === "true" ? MOCK_SONGS : [];
            setRecSongs(fallback);
          } else {
            setRecSongs([]);
          }
        }
      } finally {
        if (!cancelled) setIsLoadingRecs(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [activeTab, topSubTab, radioSongKey, recsRefreshKey, selectedGuildId]);

  const refresh = () => {
    isForcedRef.current = true;
    if (activeTab === "radio" && radioSongKey && selectedGuildId) {
      radioMemoryCache.delete(`${selectedGuildId}:${radioSongKey}`);
    } else if (activeTab === "top" && selectedGuildId) {
      topMemoryCache.delete(`${selectedGuildId}:${topSubTab}`);
    }
    setRecsRefreshKey((k) => k + 1);
  };

  return { recSongs, basedOnSong, isLoadingRecs, refresh };
}
