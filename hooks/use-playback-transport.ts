"use client";

import { useCallback } from "react";
import { useAuthCore } from "@/context/auth-context";
import { usePlayerStore } from "@/features/music/stores/player-store";
import { useQueueStore } from "@/features/music/stores/queue-store";
import { useLiveEvents } from "@/context/live-events-context";
import { useToast } from "@/components/ui/toast";
import { igniteApi } from "@/lib/ignite-api";
import { syncPlayerState } from "@/hooks/use-player-sync";

export interface PlaybackTransportValue {
  togglePlayPause: () => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;
  seekTo: (seconds: number) => void;
  stopPlayback: () => Promise<void>;
}

export function usePlaybackTransport(): PlaybackTransportValue {
  const { isLoggedIn, selectedGuildId, setIsBotOnline } = useAuthCore();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isPlayerBusy = usePlayerStore((s) => s.isPlayerBusy);
  const { addLiveEvent } = useLiveEvents();
  const { toast } = useToast();

  const togglePlayPause = useCallback(async () => {
    if (!isLoggedIn || isPlayerBusy) return;
    usePlayerStore.getState().setPendingAction("toggle");
    const prevPlaying = isPlaying;
    usePlayerStore.getState().setPlayerSnapshot({ isPlaying: !prevPlaying });
    try {
      const res = await igniteApi.control(selectedGuildId, "toggle");
      if (!res.success) {
        usePlayerStore.getState().setPlayerSnapshot({ isPlaying: prevPlaying });
        setIsBotOnline(false);
        toast(res.error || "El servicio del bot está desconectado o no responde.", "error");
        return;
      }
      setIsBotOnline(true);
      await syncPlayerState(selectedGuildId);
    } catch {
      usePlayerStore.getState().setPlayerSnapshot({ isPlaying: prevPlaying });
      setIsBotOnline(false);
      toast("Error al conectar con el bot de música.", "error");
    } finally {
      usePlayerStore.getState().setPendingAction(null);
    }
  }, [isLoggedIn, selectedGuildId, setIsBotOnline, isPlayerBusy, isPlaying, toast]);

  const skipNext = useCallback(async () => {
    if (!isLoggedIn || isPlayerBusy) return;
    usePlayerStore.getState().setPendingAction("skip");
    try {
      const res = await igniteApi.control(selectedGuildId, "skip");
      if (!res.success) {
        setIsBotOnline(false);
        toast(res.error || "No se pudo saltar la pista.", "error");
      } else {
        setIsBotOnline(true);
      }
      await syncPlayerState(selectedGuildId);
    } catch {
      setIsBotOnline(false);
      toast("Error al conectar con el bot de música.", "error");
    } finally {
      usePlayerStore.getState().setPendingAction(null);
    }
  }, [isLoggedIn, selectedGuildId, setIsBotOnline, isPlayerBusy, toast]);

  const skipPrevious = useCallback(async () => {
    if (!isLoggedIn || isPlayerBusy) return;
    usePlayerStore.getState().setPendingAction("previous");
    try {
      const res = await igniteApi.control(selectedGuildId, "previous");
      if (!res.success) {
        setIsBotOnline(false);
        toast(res.error || "No se pudo volver a la pista anterior.", "error");
      } else {
        setIsBotOnline(true);
      }
      await syncPlayerState(selectedGuildId);
    } catch {
      setIsBotOnline(false);
      toast("Error al conectar con el bot de música.", "error");
    } finally {
      usePlayerStore.getState().setPendingAction(null);
    }
  }, [isLoggedIn, selectedGuildId, setIsBotOnline, isPlayerBusy, toast]);

  const seekTo = useCallback(
    (seconds: number) => {
      if (!isLoggedIn || !currentSong) return;
      const clamped = Math.max(0, Math.min(seconds, currentSong.duration));
      usePlayerStore.getState().setCurrentTime(clamped);
      igniteApi.control(selectedGuildId, "seek", clamped);
    },
    [isLoggedIn, selectedGuildId, currentSong]
  );

  const stopPlayback = useCallback(async () => {
    if (!isLoggedIn || isPlayerBusy) return;
    usePlayerStore.getState().setPendingAction("stop");
    try {
      const res = await igniteApi.control(selectedGuildId, "stop");
      if (!res.success) {
        setIsBotOnline(false);
        toast(res.error || "No se pudo detener el reproductor.", "error");
      } else {
        setIsBotOnline(true);
        usePlayerStore.getState().setPlayerSnapshot({
          currentSong: null,
          isPlaying: false,
          currentTime: 0,
        });
        useQueueStore.getState().setQueue([]);
        toast("Reproductor detenido y bot desconectado del canal de voz.", "info", { duration: 3500 });
        addLiveEvent({
          type: "voice_trigger",
          title: "Reproductor Detenido",
          description: "Reproducción finalizada y bot desconectado del canal de voz",
        });
      }
      await syncPlayerState(selectedGuildId);
    } catch {
      setIsBotOnline(false);
      toast("Error al conectar con el servicio del bot.", "error");
    } finally {
      usePlayerStore.getState().setPendingAction(null);
    }
  }, [isLoggedIn, selectedGuildId, setIsBotOnline, isPlayerBusy, addLiveEvent, toast]);

  return { togglePlayPause, skipNext, skipPrevious, seekTo, stopPlayback };
}
