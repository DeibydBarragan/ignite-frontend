"use client";

import { useCallback } from "react";
import { useAuthCore } from "@/context/auth-context";
import { usePlayerStore } from "@/features/music/stores/player-store";
import { useLiveEvents } from "@/context/live-events-context";
import { useToast } from "@/components/ui/toast";
import { igniteApi } from "@/lib/ignite-api";
import { AUDIO_FILTER_LABELS } from "@/lib/audio-filters";

export interface PlaybackMixValue {
  setVolumeLevel: (vol: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  toggleAutoplay: () => void;
  setFilter: (name: string) => void;
}

export function usePlaybackMix(): PlaybackMixValue {
  const auth = useAuthCore();
  const isMuted = usePlayerStore((s) => s.isMuted);
  const volume = usePlayerStore((s) => s.volume);
  const { addLiveEvent } = useLiveEvents();
  const { toast } = useToast();

  const setVolumeLevel = useCallback(
    (vol: number) => {
      if (!auth.isLoggedIn) return;
      usePlayerStore.getState().setVolume(vol);
      if (vol > 0 && isMuted) {
        usePlayerStore.getState().setIsMuted(false);
      }
      igniteApi.control(auth.selectedGuildId, "volume", vol);
    },
    [auth.isLoggedIn, auth.selectedGuildId, isMuted]
  );

  const toggleMute = useCallback(() => {
    if (!auth.isLoggedIn) return;
    const next = !isMuted;
    usePlayerStore.getState().setIsMuted(next);
    igniteApi.control(auth.selectedGuildId, "volume", next ? 0 : volume);
  }, [auth.isLoggedIn, auth.selectedGuildId, isMuted, volume]);

  const toggleRepeat = useCallback(() => {
    if (!auth.isLoggedIn) return;
    const current = usePlayerStore.getState().repeatMode;
    let next: "off" | "track" | "queue" = "off";
    if (current === "off") next = "track";
    else if (current === "track") next = "queue";
    usePlayerStore.getState().setPlayerSnapshot({ repeatMode: next });
    igniteApi.control(auth.selectedGuildId, "loop", next);
  }, [auth.isLoggedIn, auth.selectedGuildId]);

  const toggleShuffle = useCallback(() => {
    if (!auth.isLoggedIn) return;
    const next = !usePlayerStore.getState().shuffle;
    usePlayerStore.getState().setPlayerSnapshot({ shuffle: next });
    igniteApi.control(auth.selectedGuildId, "shuffle");
  }, [auth.isLoggedIn, auth.selectedGuildId]);

  const toggleAutoplay = useCallback(() => {
    if (!auth.isLoggedIn) return;
    const next = !usePlayerStore.getState().autoplay;
    usePlayerStore.getState().setPlayerSnapshot({ autoplay: next });
    igniteApi.control(auth.selectedGuildId, "autoplay");
  }, [auth.isLoggedIn, auth.selectedGuildId]);

  const setFilter = useCallback(
    (name: string) => {
      if (!auth.isLoggedIn) return;
      const filterKey = name === "none" ? null : name;
      usePlayerStore.getState().setPlayerSnapshot({ activeFilter: filterKey });
      igniteApi.control(auth.selectedGuildId, "filter", name);

      const filterLabel = AUDIO_FILTER_LABELS[name as keyof typeof AUDIO_FILTER_LABELS] || name;
      if (!filterKey) {
        toast("Filtros de audio desactivados.", "info", { duration: 2500 });
      } else {
        toast(`Efecto "${filterLabel}" activado en Discord.`, "info", { duration: 3000 });
      }

      addLiveEvent({
        type: "music_play",
        title: "Filtro de Audio",
        description: filterKey ? `Efecto '${filterLabel}' activado` : "Filtros de audio desactivados",
      });
    },
    [auth.isLoggedIn, auth.selectedGuildId, toast, addLiveEvent]
  );

  return { setVolumeLevel, toggleMute, toggleRepeat, toggleShuffle, toggleAutoplay, setFilter };
}
