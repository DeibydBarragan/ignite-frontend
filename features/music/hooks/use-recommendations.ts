"use client";

import { useState, useEffect } from "react";
import { igniteApi } from "@/lib/ignite-api";
import { MOCK_SONGS } from "@/lib/mock-data";
import { logger } from "@/lib/logger";
import type { Song } from "@/types/domain";
import type { MusicSubTab, TopSubTab } from "@/types/music";

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

  useEffect(() => {
    if ((activeTab !== "radio" && activeTab !== "top") || !selectedGuildId) return;
    let cancelled = false;
    const isRadio = activeTab === "radio";
    const mode = topSubTab;
    const load = async () => {
      setIsLoadingRecs(true);
      try {
        if (isRadio) {
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

  const refresh = () => setRecsRefreshKey((k) => k + 1);

  return { recSongs, basedOnSong, isLoadingRecs, refresh };
}
