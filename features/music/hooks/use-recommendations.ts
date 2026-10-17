"use client";

import { useState, useEffect } from "react";
import { igniteApi } from "@/lib/ignite-api";
import { MOCK_SONGS } from "@/lib/mock-data";
import { logger } from "@/lib/logger";
import type { Song } from "@/types/domain";
import type { MusicSubTab, RecommendationsSubTab } from "@/types/music";

export function useRecommendations({
  activeTab,
  recSubTab,
  selectedGuildId,
  radioSongKey,
}: {
  activeTab: MusicSubTab;
  recSubTab: RecommendationsSubTab;
  selectedGuildId?: string;
  radioSongKey?: string;
}) {
  const [recSongs, setRecSongs] = useState<Song[]>([]);
  const [basedOnSong, setBasedOnSong] = useState<Song | null>(null);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [recsRefreshKey, setRecsRefreshKey] = useState(0);

  useEffect(() => {
    if (activeTab !== "catalog" || !selectedGuildId) return;
    let cancelled = false;
    const mode = recSubTab;
    const load = async () => {
      setIsLoadingRecs(true);
      try {
        if (mode === "radio") {
          const res = await igniteApi.getRecommendations(selectedGuildId);
          if (cancelled) return;
          if (res.success && res.songs.length > 0) {
            setRecSongs(res.songs);
            setBasedOnSong(res.basedOn);
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
          } else {
            setRecSongs([]);
          }
          setBasedOnSong(null);
        }
      } catch (err) {
        logger.error("Error loading recommendations:", err);
        if (!cancelled) {
          if (mode === "radio") {
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
  }, [activeTab, recSubTab, radioSongKey, recsRefreshKey, selectedGuildId]);

  const refresh = () => setRecsRefreshKey((k) => k + 1);

  return { recSongs, basedOnSong, isLoadingRecs, refresh };
}
