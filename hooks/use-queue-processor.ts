"use client";

import { useCallback } from "react";
import type { Song } from "@/types/domain";
import type { PlayerQueueTask } from "@/types/player";
import { useAuthCore } from "@/context/auth-context";
import { useQueueStore } from "@/features/music/stores/queue-store";
import { useLiveEvents } from "@/context/live-events-context";
import { useToast } from "@/components/ui/toast";
import { igniteApi } from "@/lib/ignite-api";
import { syncPlayerState } from "@/hooks/use-player-sync";

type AuthCore = ReturnType<typeof useAuthCore>;

/** Datos de sesión que la tarea necesita; se toman al encolar, no al ejecutar. */
interface TaskContext {
  selectedGuildId: AuthCore["selectedGuildId"];
  currentVoiceChannelId: AuthCore["currentVoiceChannelId"];
  user: AuthCore["user"];
  setIsBotOnline: AuthCore["setIsBotOnline"];
  addLiveEvent: ReturnType<typeof useLiveEvents>["addLiveEvent"];
  toast: ReturnType<typeof useToast>["toast"];
}

type SharedTask = PlayerQueueTask & { ctx: TaskContext };

/**
 * Cola única para TODA la app. Antes cada tarjeta creaba su propia cola, así que
 * pulsar "Cola" en varias canciones lanzaba las peticiones a la vez y el bot podía
 * recibirlas en otro orden. Ahora entran una a una, en el orden en que se pulsaron.
 */
const sharedQueue: SharedTask[] = [];
let isDraining = false;

async function runTask(task: SharedTask): Promise<void> {
  const { song, mode, resolve, reject, ctx } = task;
  const { selectedGuildId, currentVoiceChannelId, user, setIsBotOnline, addLiveEvent, toast } = ctx;
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
      const isVoiceErr = res.error?.includes("canal de voz") || res.error?.includes("voice channel");
      if (!isVoiceErr) {
        igniteApi
          .getHealth()
          .then((h) => {
            if (!h) setIsBotOnline(false);
          })
          .catch(() => setIsBotOnline(false));
      }
      const displayErr = isVoiceErr
        ? "No se pudo conectar al canal de voz de Discord. Verifica que el bot tenga permisos para entrar o intenta reconectarte al canal."
        : res.error || `No se pudo añadir "${song.title}". El bot no está disponible.`;
      toast(displayErr, "error");
      reject(new Error(displayErr));
      return;
    }

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
  } catch (err) {
    setIsBotOnline(false);
    toast("Error al conectar con el servicio del bot.", "error");
    reject(err instanceof Error ? err : new Error("Bot request failed"));
  } finally {
    useQueueStore.getState().setPendingSongAction(song.id, null);
  }
}

async function drainSharedQueue(): Promise<void> {
  if (isDraining) return;
  isDraining = true;

  let lastGuildId: string | null = null;
  try {
    while (sharedQueue.length > 0) {
      const task = sharedQueue.shift();
      if (!task) break;
      lastGuildId = task.ctx.selectedGuildId;
      await runTask(task);
    }
    if (lastGuildId) await syncPlayerState(lastGuildId);
  } finally {
    isDraining = false;
    if (sharedQueue.length > 0) void drainSharedQueue();
  }
}

/**
 * Devuelve `enqueue(task, { priority })`. `priority: true` pone la tarea al frente
 * (usado por "Siguiente"). Cada tarea guarda la sesión con la que se encoló.
 */
export function useQueueProcessor(): (task: PlayerQueueTask, opts?: { priority?: boolean }) => void {
  const { selectedGuildId, currentVoiceChannelId, user, setIsBotOnline } = useAuthCore();
  const { addLiveEvent } = useLiveEvents();
  const { toast } = useToast();

  return useCallback(
    (task, opts) => {
      const shared: SharedTask = {
        ...task,
        ctx: { selectedGuildId, currentVoiceChannelId, user, setIsBotOnline, addLiveEvent, toast },
      };
      if (opts?.priority) sharedQueue.unshift(shared);
      else sharedQueue.push(shared);
      void drainSharedQueue();
    },
    [selectedGuildId, currentVoiceChannelId, user, setIsBotOnline, addLiveEvent, toast]
  );
}
