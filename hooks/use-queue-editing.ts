"use client";

import { useCallback } from "react";
import { useAuthCore } from "@/context/auth-context";
import { useQueueStore } from "@/features/music/stores/queue-store";
import { usePlayerStore } from "@/features/music/stores/player-store";
import { useToast } from "@/components/ui/toast";
import { igniteApi } from "@/lib/ignite-api";
import { logger } from "@/lib/logger";
import { syncPlayerState } from "@/hooks/use-player-sync";

export interface QueueEditingValue {
  removeFromQueue: (songId: string) => Promise<void>;
  moveQueueSong: (fromIndex: number, toIndex: number) => Promise<void>;
  jumpToQueueSong: (index: number) => Promise<void>;
  clearQueue: () => Promise<void>;
}

export function useQueueEditing(): QueueEditingValue {
  const { isLoggedIn, selectedGuildId, user } = useAuthCore();
  const queue = useQueueStore((s) => s.queue);
  const removingSongId = useQueueStore((s) => s.removingSongId);
  const isPlayerBusy = usePlayerStore((s) => s.isPlayerBusy);
  const { toast } = useToast();

  const removeFromQueue = useCallback(
    async (songId: string) => {
      if (!isLoggedIn || removingSongId === songId) return;
      useQueueStore.getState().setRemovingSongId(songId);
      try {
        const song = queue.find((s) => s.id === songId);
        const idx = queue.findIndex((s) => s.id === songId);
        useQueueStore.getState().setQueue((prev) => prev.filter((s) => s.id !== songId));
        if (song?.trackId) {
          await igniteApi.removeTrackFromQueue(selectedGuildId, song.trackId);
          await syncPlayerState(selectedGuildId);
        } else if (idx !== -1) {
          await igniteApi.removeFromQueue(selectedGuildId, idx + 1);
          await syncPlayerState(selectedGuildId);
        }
      } catch (err) {
        logger.error("Error removing from queue:", err);
      } finally {
        useQueueStore.getState().setRemovingSongId(null);
      }
    },
    [isLoggedIn, queue, removingSongId, selectedGuildId]
  );

  const moveQueueSong = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (!isLoggedIn || isPlayerBusy) return;
      if (fromIndex === toIndex) return;
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= queue.length || toIndex >= queue.length) return;

      usePlayerStore.getState().setPendingAction("reorder");
      useQueueStore.getState().setIsReordering(true);

      const previousQueue = [...queue];

      useQueueStore.getState().setQueue((prev) => {
        const next = [...prev];
        const [song] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, song);
        return next;
      });

      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(35);
      }

      try {
        const res = await igniteApi.moveInQueue(selectedGuildId, fromIndex + 1, toIndex + 1);
        if (res && res.success === false) {
          throw new Error(res.error || "No se pudo actualizar el orden en la cola.");
        }
        await syncPlayerState(selectedGuildId);
      } catch (err: unknown) {
        logger.error("Error moving song in queue:", err);
        useQueueStore.getState().setQueue(previousQueue);
        const message =
          err instanceof Error
            ? err.message
            : "No se pudo cambiar el orden en la cola. Inténtalo de nuevo.";
        toast(message, "error");
        await syncPlayerState(selectedGuildId);
      } finally {
        usePlayerStore.getState().setPendingAction(null);
        useQueueStore.getState().setIsReordering(false);
      }
    },
    [isLoggedIn, isPlayerBusy, queue, selectedGuildId, toast]
  );

  const jumpToQueueSong = useCallback(
    async (index: number) => {
      if (!isLoggedIn || isPlayerBusy) return;
      if (index < 0 || index >= queue.length) return;
      usePlayerStore.getState().setPendingAction("skip");
      try {
        await igniteApi.jumpInQueue(selectedGuildId, index + 1);
        await syncPlayerState(selectedGuildId);
      } catch (err) {
        logger.error("Error jumping in queue:", err);
      } finally {
        usePlayerStore.getState().setPendingAction(null);
      }
    },
    [isLoggedIn, isPlayerBusy, queue.length, selectedGuildId]
  );

  const clearQueue = useCallback(async () => {
    if (!isLoggedIn || isPlayerBusy || queue.length === 0) return;
    usePlayerStore.getState().setPendingAction("clear");
    const backupQueue = [...queue];
    try {
      useQueueStore.getState().setQueue([]);
      await igniteApi.clearQueue(selectedGuildId);
      await syncPlayerState(selectedGuildId);

      toast(
        `Cola vaciada (${backupQueue.length} ${backupQueue.length === 1 ? "canción" : "canciones"}).`,
        "info",
        {
          duration: 7000,
          action: {
            label: "Deshacer",
            loadingLabel: "Restaurando...",
            loadingMessage: `Restaurando ${backupQueue.length} ${backupQueue.length === 1 ? "canción" : "canciones"} en la cola...`,
            successMessage: "Cola restaurada exitosamente.",
            onClick: async () => {
              usePlayerStore.getState().setPendingAction("reorder");
              useQueueStore.getState().setQueue(backupQueue);
              try {
                const undoRes = await igniteApi.undoClearQueue(selectedGuildId);
                if (!undoRes.success) {
                  for (const song of backupQueue) {
                    await igniteApi.play(selectedGuildId, {
                      query: song.url || `${song.title} ${song.artist}`,
                      userId: song.requestedBy?.id || user?.id || undefined,
                      skip: false,
                    });
                  }
                }
                await syncPlayerState(selectedGuildId);
              } finally {
                usePlayerStore.getState().setPendingAction(null);
              }
            },
          },
        }
      );
    } catch (err) {
      logger.error("Error clearing queue:", err);
    } finally {
      usePlayerStore.getState().setPendingAction(null);
    }
  }, [isLoggedIn, isPlayerBusy, queue, selectedGuildId, user?.id, toast]);

  return { removeFromQueue, moveQueueSong, jumpToQueueSong, clearQueue };
}
