"use client";

import { useCallback, useEffect, useRef } from "react";
import { igniteApi } from "@/lib/ignite-api";
import { usePlayerStore } from "@/features/music/stores/player-store";
import { useQueueStore } from "@/features/music/stores/queue-store";
import { useGuildStore } from "@/features/guild/guild-store";
import { usePlayerEvents } from "@/hooks/use-player-events";
import { usePoll } from "@/hooks/use-poll";
import { useToast } from "@/components/ui/toast";
import { useLiveEvents } from "@/context/live-events-context";
import { useAuthCore } from "@/context/auth-context";

/**
 * Función global de reconciliación rápida para uso en handlers y mutaciones optimistas.
 */
export async function syncPlayerState(guildId?: string): Promise<void> {
  const targetGuildId = guildId || useGuildStore.getState().selectedGuildId;
  if (!targetGuildId) return;

  try {
    const state = await igniteApi.getPlayerState(targetGuildId);
    if (!state) {
      useGuildStore.getState().setIsBotOnline(false);
      return;
    }

    useGuildStore.getState().setIsBotOnline(true);

    if (state.hasQueue && state.currentSong) {
      usePlayerStore.getState().setPlayerSnapshot({
        currentSong: state.currentSong,
        isPlaying: state.isPlaying,
        currentTime: state.currentTime,
        volume: state.volume,
        repeatMode: state.repeatMode,
        autoplay: state.autoplay,
        activeFilter: state.filter ?? null,
      });
      useQueueStore.getState().setQueue(state.queue);
      useGuildStore.getState().setIsVoiceConnected(true);
      if (state.voiceChannel) {
        useGuildStore.getState().setBotVoiceChannel(state.voiceChannel);
      }
    } else if (!state.hasQueue) {
      usePlayerStore.getState().setPlayerSnapshot({
        currentSong: null,
        isPlaying: false,
        currentTime: 0,
        autoplay: state.autoplay,
        activeFilter: null,
      });
      useQueueStore.getState().setQueue([]);
      useGuildStore.getState().setBotVoiceChannel(null);
    }
  } catch {
    useGuildStore.getState().setIsBotOnline(false);
  }
}

/**
 * Hook central de sincronización reactiva con SSE, polling inteligente y reloj desacoplado.
 */
export function usePlayerSync(): { sync: () => Promise<void>; isLive: boolean } {
  const { isLoggedIn, selectedGuildId } = useAuthCore();
  const { toast } = useToast();
  const { addLiveEvent } = useLiveEvents();
  const knownSongIdsRef = useRef<Set<string>>(new Set());
  const lastNotifiedDisconnectRef = useRef<string | null>(null);

  const sync = useCallback(async () => {
    if (!isLoggedIn || !selectedGuildId) return;
    try {
      const state = await igniteApi.getPlayerState(selectedGuildId);
      if (!state) {
        useGuildStore.getState().setIsBotOnline(false);
        return;
      }
      useGuildStore.getState().setIsBotOnline(true);

      if (state.hasQueue && state.currentSong) {
        usePlayerStore.getState().setPlayerSnapshot({
          currentSong: state.currentSong,
          isPlaying: state.isPlaying,
          currentTime: state.currentTime,
          volume: state.volume,
          repeatMode: state.repeatMode,
          autoplay: state.autoplay,
          activeFilter: state.filter ?? null,
        });
        useQueueStore.getState().setQueue(state.queue);
        useGuildStore.getState().setIsVoiceConnected(true);
        if (state.voiceChannel) {
          useGuildStore.getState().setBotVoiceChannel(state.voiceChannel);
        }

        const allSongs = [state.currentSong, ...(state.queue || [])];
        for (const s of allSongs) {
          if (s.isAutoplay && !knownSongIdsRef.current.has(s.id)) {
            knownSongIdsRef.current.add(s.id);
            toast(`Autoplay: canción recomendada añadida ("${s.title}")`, "info", { duration: 4000 });
            addLiveEvent({
              type: "music_play",
              title: "Autoplay",
              description: `Canción recomendada añadida: '${s.title}'`,
            });
          } else {
            knownSongIdsRef.current.add(s.id);
          }
        }
      } else if (!state.hasQueue) {
        usePlayerStore.getState().setPlayerSnapshot({
          currentSong: null,
          isPlaying: false,
          currentTime: 0,
          autoplay: state.autoplay,
          activeFilter: null,
        });
        useQueueStore.getState().setQueue([]);
        useGuildStore.getState().setBotVoiceChannel(null);
      }

      if (state.disconnectReason && lastNotifiedDisconnectRef.current !== state.disconnectReason) {
        lastNotifiedDisconnectRef.current = state.disconnectReason;
        const msg =
          state.disconnectReason === "inactivity_empty"
            ? "El bot se desconectó del canal de voz porque no quedaba nadie en la sala."
            : "El bot se desconectó por inactividad tras finalizar la música.";
        toast(msg, "info", { duration: 6000 });
        addLiveEvent({
          type: "voice_trigger",
          title: "Desconexión por inactividad",
          description: msg,
        });
      } else if (!state.disconnectReason) {
        lastNotifiedDisconnectRef.current = null;
      }
    } catch {
      useGuildStore.getState().setIsBotOnline(false);
    }
  }, [isLoggedIn, selectedGuildId, toast, addLiveEvent]);

  // SSE Stream
  const { isLive } = usePlayerEvents({
    enabled: isLoggedIn,
    guildId: selectedGuildId,
    onSync: () => void sync(),
  });

  // Polling inteligente con Page Visibility API y backoff adaptativo
  usePoll(
    () => sync(),
    {
      enabled: isLoggedIn && Boolean(selectedGuildId),
      intervalMs: isLive ? 15000 : 2000,
      immediate: true,
    }
  );

  // Reloj de scrubber (1 segundo) desacoplado de los componentes de renderizado (se pausa en segundo plano)
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      const { isPlaying, currentSong } = usePlayerStore.getState();
      if (isPlaying && currentSong) {
        usePlayerStore.getState().tickSecond();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return { sync, isLive };
}
