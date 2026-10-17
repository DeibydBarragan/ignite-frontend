"use client";

import { useCallback } from "react";
import type { Song } from "@/types/domain";
import { useAuthCore } from "@/context/auth-context";
import { usePlayerStore } from "@/features/music/stores/player-store";
import { useQueueStore } from "@/features/music/stores/queue-store";
import { useLiveEvents } from "@/context/live-events-context";
import { useToast } from "@/components/ui/toast";
import { igniteApi } from "@/lib/ignite-api";
import { useVoiceCheck } from "@/hooks/use-voice-check";
import { syncPlayerState } from "@/hooks/use-player-sync";

export interface ImportUrlResult {
  success: boolean;
  message: string;
  song?: Song;
}

const FALLBACK_ART = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80";

export function useUrlImport(): (url: string, opts?: { skip?: boolean; next?: boolean }) => Promise<ImportUrlResult> {
  const auth = useAuthCore();
  const { addLiveEvent } = useLiveEvents();
  const { toast } = useToast();

  const checkVoiceRequirement = useVoiceCheck({
    isLoggedIn: auth.isLoggedIn,
    user: auth.user,
    selectedGuildId: auth.selectedGuildId,
    isBotOnline: auth.isBotOnline,
    setIsBotOnline: auth.setIsBotOnline,
    applyVoiceStatus: auth.applyVoiceStatus,
    toast,
  });

  return useCallback(
    async (url: string, opts?: { skip?: boolean; next?: boolean }): Promise<ImportUrlResult> => {
      if (!auth.isLoggedIn) {
        return { success: false, message: "Debes iniciar sesión con Discord para reproducir canciones." };
      }
      const trimmed = url.trim();
      if (!trimmed) {
        return { success: false, message: "Por favor introduce un enlace o nombre válido." };
      }
      if (trimmed.toLowerCase().includes("soundcloud.com")) {
        return {
          success: false,
          message: "SoundCloud ya no está soportado. Usa un enlace de YouTube o Spotify, o busca por nombre.",
        };
      }

      const voiceCheck = await checkVoiceRequirement();
      if (!voiceCheck.canPlay) {
        return { success: false, message: voiceCheck.reason || "El bot de música no está disponible." };
      }

      usePlayerStore.getState().setPendingAction(opts?.skip ? "play" : opts?.next ? "playNext" : "queue");

      try {
        const res = await igniteApi.play(auth.selectedGuildId, {
          query: trimmed,
          voiceChannelId: auth.currentVoiceChannelId || undefined,
          userId: auth.user?.id || undefined,
          next: opts?.next,
          skip: opts?.skip,
        });

        if (!res.success) {
          if (!res.error?.includes("canal de voz")) {
            auth.setIsBotOnline(false);
          }
          return {
            success: false,
            message: res.error || "No se pudo encolar la pista.",
          };
        }

        auth.setIsBotOnline(true);

        if (res.song) {
          const songWithRequester: Song = {
            ...res.song,
            requestedBy: auth.user
              ? { id: auth.user.id, username: auth.user.username, avatar: auth.user.avatar || null }
              : res.song.requestedBy || null,
          };

          if (opts?.skip) {
            usePlayerStore.getState().setPlayerSnapshot({
              currentSong: songWithRequester,
              currentTime: 0,
              isPlaying: true,
            });
          } else if (opts?.next) {
            useQueueStore.getState().setQueue((prev: Song[]) => [songWithRequester, ...prev]);
          } else {
            useQueueStore.getState().setQueue((prev: Song[]) => [...prev, songWithRequester]);
          }

          addLiveEvent({
            type: "music_play",
            title: opts?.skip ? "Reproduciendo" : opts?.next ? "Siguiente en cola" : "Añadido a la cola",
            description: `'${songWithRequester.title}' (${songWithRequester.source})`,
          });
          await syncPlayerState(auth.selectedGuildId);

          return {
            success: true,
            message: opts?.skip
              ? `¡Reproduciendo "${songWithRequester.title}"!`
              : opts?.next
              ? `¡"${songWithRequester.title}" será la siguiente!`
              : `¡"${songWithRequester.title}" añadida a la cola!`,
            song: songWithRequester,
          };
        }

        const isSpotify = trimmed.includes("spotify.com");
        const source = isSpotify ? "spotify" : "youtube";
        const title = isSpotify ? "Pista de Spotify" : "Video de YouTube";

        const newSong: Song = {
          id: `custom-${Date.now()}`,
          title,
          artist: isSpotify ? "Artista en Spotify" : "Canal de YouTube",
          albumArt: FALLBACK_ART,
          duration: 210,
          source,
          url: trimmed,
          category: "hits",
          requestedBy: auth.user
            ? { id: auth.user.id, username: auth.user.username, avatar: auth.user.avatar || null }
            : null,
        };

        useQueueStore.getState().setQueue((prev: Song[]) => [...prev, newSong]);
        await syncPlayerState(auth.selectedGuildId);

        return { success: true, message: `¡"${title}" añadida a la cola!`, song: newSong };
      } catch (err: unknown) {
        auth.setIsBotOnline(false);
        const errMsg = err instanceof Error ? err.message : "Error al encolar la canción.";
        toast(errMsg, "error");
        return { success: false, message: errMsg };
      } finally {
        usePlayerStore.getState().setPendingAction(null);
      }
    },
    [auth, checkVoiceRequirement, addLiveEvent, toast]
  );
}
