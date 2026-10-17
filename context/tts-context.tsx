"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { TTSMessage } from "@/types/domain";
import { soundApi } from "@/lib/sound-api";
import { useAuthCore } from "@/context/auth-context";
import { useLiveEvents } from "@/context/live-events-context";

export interface TTSResult {
  success: boolean;
  error?: string;
}

export interface TTSContextValue {
  recentTTS: TTSMessage[];
  sendTTS: (text: string, voice: string, pitch: number, rate: number) => Promise<TTSResult>;
}

const TTSContext = createContext<TTSContextValue | null>(null);

const INITIAL_TTS: TTSMessage[] = [
  {
    id: "tts-1",
    text: "¡Partida iniciada, buena suerte a todos!",
    voice: "Jorge (Español)",
    pitch: 1.0,
    rate: 1.0,
    channelName: "General (Voz)",
    timestamp: "Hace 15 min",
  },
  {
    id: "tts-2",
    text: "El bot de música está listo para recibir comandos.",
    voice: "Lucía (Español)",
    pitch: 1.1,
    rate: 1.0,
    channelName: "General (Voz)",
    timestamp: "Hace 32 min",
  },
];

export function TTSProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, selectedGuild, currentVoiceChannel } = useAuthCore();
  const { addLiveEvent } = useLiveEvents();
  const [recentTTS, setRecentTTS] = useState<TTSMessage[]>(INITIAL_TTS);

  const sendTTS = useCallback(
    async (text: string, voice: string, pitch: number, rate: number): Promise<TTSResult> => {
      const trimmed = text.trim();
      if (!isLoggedIn) {
        return { success: false, error: "Debes iniciar sesión con Discord para emitir TTS." };
      }
      if (!trimmed) {
        return { success: false, error: "Escribe un mensaje antes de emitir." };
      }

      const res = await soundApi.speakTTS({
        guildId: selectedGuild?.id,
        channelId: currentVoiceChannel?.id,
        text: trimmed,
        voice,
        pitch,
        rate,
      });

      if (!res.success) {
        return { success: false, error: res.error || "Error al emitir en Discord." };
      }

      const newMessage: TTSMessage = {
        id: "tts-" + Date.now(),
        text: trimmed,
        voice,
        pitch,
        rate,
        channelName: currentVoiceChannel ? currentVoiceChannel.name : "Canal de Voz",
        timestamp: "Ahora mismo",
      };

      setRecentTTS((prev) => [newMessage, ...prev.slice(0, 9)]);
      addLiveEvent({
        type: "tts",
        title: "TTS Reproducido",
        description: `'${trimmed.slice(0, 40)}${trimmed.length > 40 ? "..." : ""}' emitido con voz ${voice}`,
      });

      return { success: true };
    },
    [isLoggedIn, selectedGuild, currentVoiceChannel, addLiveEvent]
  );

  const value = useMemo(() => ({ recentTTS, sendTTS }), [recentTTS, sendTTS]);

  return <TTSContext.Provider value={value}>{children}</TTSContext.Provider>;
}

export function useTTS(): TTSContextValue {
  const ctx = useContext(TTSContext);
  if (!ctx) throw new Error("useTTS must be used within a TTSProvider");
  return ctx;
}
