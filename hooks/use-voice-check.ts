"use client";

import { useCallback } from "react";
import type { DiscordUser } from "@/types/domain";
import { igniteApi } from "@/lib/ignite-api";
import type { AuthVoiceStatusLike } from "@/types/auth";
import type { VoiceCheckResult } from "@/types/player";
import type { ToastOptions, ToastType } from "@/components/ui/toast";

interface UseVoiceCheckParams {
  isLoggedIn: boolean;
  user: DiscordUser | null;
  selectedGuildId: string;
  isBotOnline: boolean;
  setIsBotOnline: (online: boolean) => void;
  applyVoiceStatus: (status: AuthVoiceStatusLike) => void;
  toast: (message: string, type?: ToastType, options?: ToastOptions) => void;
}

export function useVoiceCheck({
  isLoggedIn,
  user,
  selectedGuildId,
  isBotOnline,
  setIsBotOnline,
  applyVoiceStatus,
  toast,
}: UseVoiceCheckParams): () => Promise<VoiceCheckResult> {
  return useCallback(async (): Promise<VoiceCheckResult> => {
    if (!isLoggedIn || !user || !selectedGuildId) return { canPlay: true };

    if (!isBotOnline) {
      const health = await igniteApi.getHealth().catch(() => null);
      if (!health) {
        const msg = "El bot de música está desconectado. Inicia el bot para reproducir música.";
        toast(msg, "error");
        return { canPlay: false, reason: msg };
      }
      setIsBotOnline(true);
    }

    try {
      const status = await igniteApi.getVoiceStatus(selectedGuildId, user.id);
      if (!status) {
        setIsBotOnline(false);
        const msg = "El bot de música está desconectado. Inicia el bot para reproducir música.";
        toast(msg, "error");
        return { canPlay: false, reason: msg };
      }

      setIsBotOnline(true);
      applyVoiceStatus(status);

      if (!status.user) {
        const msg = "¡Debes estar en un canal de voz en Discord para reproducir música!";
        toast(msg, "error", { duration: 5000 });
        return { canPlay: false, reason: msg };
      }

      if (status.bot && status.user.id !== status.bot.id) {
        const msg = `¡Debes estar en el mismo canal de voz que el bot ("${status.bot.name}")! Estás en "${status.user.name}".`;
        toast(msg, "error", { duration: 5500 });
        return {
          canPlay: false,
          reason: `¡Debes estar en el mismo canal de voz que el bot ("${status.bot.name}")!`,
        };
      }

      return { canPlay: true };
    } catch {
      setIsBotOnline(false);
      const msg = "El bot de música está desconectado. Inicia el bot para reproducir música.";
      toast(msg, "error");
      return { canPlay: false, reason: msg };
    }
  }, [isLoggedIn, user, selectedGuildId, isBotOnline, setIsBotOnline, applyVoiceStatus, toast]);
}
