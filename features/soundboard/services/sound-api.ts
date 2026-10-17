import type { SoundboardTrack, SoundPlayResult, VoiceItem } from "@/types/domain";
import { httpRequest } from "@/lib/http";
import {
  mutateSoundResponseSchema,
  playSoundResponseSchema,
  soundsResponseSchema,
  speakTtsResponseSchema,
  voicesResponseSchema,
} from "@/lib/schemas/sound";
import { logger } from "@/lib/logger";

export type { SoundboardTrack, SoundPlayResult, VoiceItem };
export { FALLBACK_VOICES } from "@/lib/sound-fallbacks";

function soundUrl(path: string): string {
  return `/api/sound/${path.replace(/^\/+/, "")}`;
}

class SoundApiClient {
  private currentAudio: HTMLAudioElement | null = null;

  async getVoices(): Promise<VoiceItem[]> {
    const { FALLBACK_VOICES } = await import("@/lib/sound-fallbacks");
    const res = await httpRequest(soundUrl("voices"), voicesResponseSchema, { method: "GET" });
    if (!res.ok || res.data.voices.length === 0) return FALLBACK_VOICES;
    return res.data.voices;
  }

  async speakTTS(params: {
    guildId?: string;
    channelId?: string;
    text: string;
    voice?: string;
    rate?: number | string;
    pitch?: number | string;
  }): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await httpRequest(soundUrl("tts/speak"), speakTtsResponseSchema, {
      method: "POST",
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      return { success: false, error: res.error || "Error al emitir en Discord." };
    }
    if (res.data.error) {
      return { success: false, error: res.data.error };
    }
    return { success: true, message: res.data.message };
  }

  async previewTTS(params: {
    text: string;
    voice?: string;
    rate?: number | string;
    pitch?: number | string;
  }): Promise<void> {
    try {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch(soundUrl("tts/preview"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error("No se pudo obtener el audio de previsualización.");
        }
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;

        await new Promise<void>((resolve) => {
          audio.onended = () => {
            this.currentAudio = null;
            resolve();
          };
          audio.onerror = () => {
            this.currentAudio = null;
            resolve();
          };
          audio.play().catch(() => {
            this.currentAudio = null;
            resolve();
          });
        });
      } finally {
        clearTimeout(timer);
      }
    } catch (err: unknown) {
      logger.error("[previewTTS] Error:", err);
      throw err instanceof Error ? err : new Error("No se pudo reproducir la vista previa.");
    }
  }

  async getSounds(): Promise<SoundboardTrack[] | null> {
    const res = await httpRequest(soundUrl("sounds"), soundsResponseSchema, { method: "GET" });
    if (!res.ok) return null;
    return res.data.sounds;
  }

  async playSoundOnDiscord(params: {
    guildId?: string;
    channelId?: string;
    soundId: string;
    volume?: number;
  }): Promise<SoundPlayResult> {
    const res = await httpRequest(soundUrl("sounds/play"), playSoundResponseSchema, {
      method: "POST",
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      return { success: false, error: res.error || "No se pudo conectar con el bot de sonido." };
    }
    return {
      success: res.data.success,
      code: res.data.code,
      message: res.data.message,
      error: res.data.error,
      channel: res.data.channel,
    };
  }

  async updateSound(
    id: string,
    data: { name?: string; emoji?: string; category?: string; uploadedBy?: string | null }
  ): Promise<{ success: boolean; sound?: SoundboardTrack; error?: string }> {
    const res = await httpRequest(soundUrl(`sounds/${encodeURIComponent(id)}`), mutateSoundResponseSchema, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      return { success: false, error: res.error || "Error al actualizar el sonido." };
    }
    if (!res.data.success) {
      return { success: false, error: res.data.error || "Error al actualizar el sonido." };
    }
    return { success: true, sound: res.data.sound };
  }

  async deleteSound(id: string): Promise<boolean> {
    const res = await fetch(soundUrl(`sounds/${encodeURIComponent(id)}`), {
      method: "DELETE",
      cache: "no-store",
    }).catch(() => null);
    return res?.ok ?? false;
  }

  async uploadSound(params: {
    name: string;
    emoji?: string;
    category?: string;
    duration?: number;
    file: File;
    userId?: string;
  }): Promise<{ success: boolean; sound?: SoundboardTrack; error?: string }> {
    try {
      const form = new FormData();
      form.append("name", params.name);
      if (params.emoji) form.append("emoji", params.emoji);
      if (params.category) form.append("category", params.category);
      if (params.duration) form.append("duration", String(params.duration));
      if (params.userId) form.append("userId", params.userId);
      form.append("file", params.file);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      try {
        const res = await fetch(soundUrl("sounds/upload"), {
          method: "POST",
          body: form,
          signal: controller.signal,
          cache: "no-store",
        });
        const data = (await res.json().catch(() => ({}))) as {
          sound?: SoundboardTrack;
          error?: string;
        };
        if (!res.ok) {
          return { success: false, error: data.error || "Error al subir el audio." };
        }
        return { success: true, sound: data.sound };
      } finally {
        clearTimeout(timer);
      }
    } catch {
      return { success: false, error: "No se pudo conectar con el bot de sonido." };
    }
  }

  async attachSoundFile(
    soundId: string,
    file: File
  ): Promise<{ success: boolean; sound?: SoundboardTrack; error?: string }> {
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(soundUrl(`sounds/${encodeURIComponent(soundId)}/file`), {
        method: "PUT",
        body: form,
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as {
        sound?: SoundboardTrack;
        error?: string;
      };
      if (!res.ok) {
        return { success: false, error: data.error || "Error al adjuntar el audio." };
      }
      return { success: true, sound: data.sound };
    } catch {
      return { success: false, error: "No se pudo conectar con el bot de sonido." };
    }
  }
}

export const soundApi = new SoundApiClient();
