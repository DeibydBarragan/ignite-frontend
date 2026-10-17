"use client";

import { useCallback, useRef, type MutableRefObject } from "react";
import type { Song } from "@/types/domain";
import type { PlayerQueueTask } from "@/types/player";
import { useAuthCore } from "@/context/auth-context";
import { useQueueStore } from "@/features/music/stores/queue-store";
import { useLiveEvents } from "@/context/live-events-context";
import { useToast } from "@/components/ui/toast";
import { igniteApi } from "@/lib/ignite-api";
import { syncPlayerState } from "@/hooks/use-player-sync";

export function useQueueProcessor(taskQueueRef: MutableRefObject<PlayerQueueTask[]>): () => Promise<void> {
  const { selectedGuildId, currentVoiceChannelId, user, setIsBotOnline } = useAuthCore();
  const { addLiveEvent } = useLiveEvents();
  const { toast } = useToast();
  const isProcessingQueueRef = useRef(false);

  return useCallback(
    async function processQueue(): Promise<void> {
      if (isProcessingQueueRef.current) return;
      isProcessingQueueRef.current = true;

      try {
        while (taskQueueRef.current.length > 0) {
          const task = taskQueueRef.current.shift();
          if (!task) break;

          const { song, mode, resolve, reject } = task;
          const songWithRequester: Song = {
            ...song,
            requestedBy: user
              ? { id: user.id, username: user.username, avatar: user.avatar || null }
              : song.requestedBy || null,
          };

          try {
            const res = await igniteApi.play(selectedGuildId, {
              query: song.url || `${song.title} ${song.artist}`,
              voiceChannelId: currentVoiceChannelId || undefined,
              userId: user?.id || undefined,
              next: mode === "playNext",
              skip: false,
            });

            if (!res.success) {
              if (!res.error?.includes("canal de voz")) {
                setIsBotOnline(false);
              }
              toast(res.error || `No se pudo añadir "${song.title}". El bot no está disponible.`, "error");
              reject(new Error(res.error || "Error al añadir canción"));
            } else {
              setIsBotOnline(true);
              if (mode === "playNext") {
                useQueueStore.getState().setQueue((prev) => [songWithRequester, ...prev]);
              } else {
                useQueueStore.getState().setQueue((prev) => [...prev, songWithRequester]);
              }
              addLiveEvent({
                type: "music_play",
                title: mode === "playNext" ? "Siguiente en cola" : "Añadido a la cola",
                description:
                  mode === "playNext"
                    ? `'${song.title}' se reproducirá a continuación`
                    : `'${song.title}' añadida a la lista de espera`,
              });
              resolve();
            }
          } catch (err) {
            setIsBotOnline(false);
            toast("Error al conectar con el servicio del bot.", "error");
            reject(err instanceof Error ? err : new Error("Bot request failed"));
          } finally {
            useQueueStore.getState().setPendingSongAction(song.id, null);
          }
        }
        await syncPlayerState(selectedGuildId);
      } finally {
        isProcessingQueueRef.current = false;
        if (taskQueueRef.current.length > 0) {
          processQueue();
        }
      }
    },
    [user, selectedGuildId, currentVoiceChannelId, setIsBotOnline, taskQueueRef, toast, addLiveEvent]
  );
}
