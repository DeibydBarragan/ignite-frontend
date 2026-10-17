"use client";

import { useCallback, useRef } from "react";
import type { Song } from "@/types/domain";
import type { PlayerQueueTask } from "@/types/player";
import { useAuthCore } from "@/context/auth-context";
import { usePlayerStore } from "@/features/music/stores/player-store";
import { useQueueStore } from "@/features/music/stores/queue-store";
import { useLiveEvents } from "@/context/live-events-context";
import { useToast } from "@/components/ui/toast";
import { igniteApi } from "@/lib/ignite-api";
import { useVoiceCheck } from "@/hooks/use-voice-check";
import { useQueueProcessor } from "@/hooks/use-queue-processor";
import { syncPlayerState } from "@/hooks/use-player-sync";

export interface QueueActionsValue {
  playSong: (song: Song) => Promise<void>;
  addToQueue: (song: Song) => Promise<void>;
  playNext: (song: Song) => Promise<void>;
}

export function useQueueActions(): QueueActionsValue {
  const auth = useAuthCore();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const { addLiveEvent } = useLiveEvents();
  const { toast } = useToast();

  const taskQueueRef = useRef<PlayerQueueTask[]>([]);
  const pendingSongIdsRef = useRef<Set<string>>(new Set());
  const processNextTask = useQueueProcessor(taskQueueRef);

  const checkVoiceRequirement = useVoiceCheck({
    isLoggedIn: auth.isLoggedIn,
    user: auth.user,
    selectedGuildId: auth.selectedGuildId,
    isBotOnline: auth.isBotOnline,
    setIsBotOnline: auth.setIsBotOnline,
    applyVoiceStatus: auth.applyVoiceStatus,
    toast,
  });

  const playSong = useCallback(
    async (song: Song) => {
      if (!auth.isLoggedIn) return;

      const voiceCheck = await checkVoiceRequirement();
      if (!voiceCheck.canPlay) return;

      if (currentSong && (currentSong.id === song.id || currentSong.url === song.url) && !isPlaying) {
        usePlayerStore.getState().setPlayerSnapshot({ isPlaying: true, currentTime: 0 });
        try {
          await igniteApi.control(auth.selectedGuildId, "seek", 0).catch(() => {});
          const res = await igniteApi.control(auth.selectedGuildId, "resume");
          if (!res.success) {
            await igniteApi.control(auth.selectedGuildId, "toggle");
          }
          await syncPlayerState(auth.selectedGuildId);
        } catch {
          toast("Error al reanudar la reproducción.", "error");
        }
        return;
      }

      pendingSongIdsRef.current.add(song.id);
      useQueueStore.getState().setPendingSongAction(song.id, "play");

      try {
        const res = await igniteApi.play(auth.selectedGuildId, {
          query: song.url || `${song.title} ${song.artist}`,
          voiceChannelId: auth.currentVoiceChannelId || undefined,
          userId: auth.user?.id || undefined,
          skip: true,
        });

        if (!res.success) {
          if (!res.error?.includes("canal de voz")) {
            auth.setIsBotOnline(false);
          }
          toast(res.error || "No se pudo reproducir la canción. El bot no está disponible.", "error");
          return;
        }

        auth.setIsBotOnline(true);
        const songWithRequester: Song = {
          ...(res.song || song),
          requestedBy: auth.user
            ? { id: auth.user.id, username: auth.user.username, avatar: auth.user.avatar || null }
            : song.requestedBy || null,
        };
        usePlayerStore.getState().setPlayerSnapshot({
          currentSong: songWithRequester,
          currentTime: 0,
          isPlaying: true,
        });

        if (!isPlaying) {
          await igniteApi.control(auth.selectedGuildId, "resume").catch(() => {});
        }

        addLiveEvent({
          type: "music_play",
          title: "Reproduciendo",
          description: `'${song.title} - ${song.artist}' enviada al bot`,
        });
        await syncPlayerState(auth.selectedGuildId);
      } catch {
        auth.setIsBotOnline(false);
        toast("Error al conectar con el servicio del bot.", "error");
      } finally {
        pendingSongIdsRef.current.delete(song.id);
        useQueueStore.getState().setPendingSongAction(song.id, null);
      }
    },
    [auth, checkVoiceRequirement, currentSong, isPlaying, addLiveEvent, toast]
  );

  const addToQueue = useCallback(
    async (song: Song) => {
      if (!auth.isLoggedIn || pendingSongIdsRef.current.has(song.id)) return;

      const voiceCheck = await checkVoiceRequirement();
      if (!voiceCheck.canPlay) return;

      pendingSongIdsRef.current.add(song.id);
      useQueueStore.getState().setPendingSongAction(song.id, "queue");

      return new Promise<void>((resolve, reject) => {
        taskQueueRef.current.push({ song, mode: "queue", resolve, reject });
        processNextTask();
      });
    },
    [auth.isLoggedIn, checkVoiceRequirement, processNextTask]
  );

  const playNext = useCallback(
    async (song: Song) => {
      if (!auth.isLoggedIn || pendingSongIdsRef.current.has(song.id)) return;

      const voiceCheck = await checkVoiceRequirement();
      if (!voiceCheck.canPlay) return;

      pendingSongIdsRef.current.add(song.id);
      useQueueStore.getState().setPendingSongAction(song.id, "playNext");

      return new Promise<void>((resolve, reject) => {
        taskQueueRef.current.unshift({ song, mode: "playNext", resolve, reject });
        processNextTask();
      });
    },
    [auth.isLoggedIn, checkVoiceRequirement, processNextTask]
  );

  return { playSong, addToQueue, playNext };
}
