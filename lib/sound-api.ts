export interface VoiceItem {
  id: string;
  name: string;
  gender: string;
  lang: string;
  flag: string;
  provider: string;
  description?: string;
}

export const FALLBACK_VOICES: VoiceItem[] = [
  {
    id: "loquendo",
    name: "Loquendo (Jorge)",
    gender: "Masculino",
    lang: "es-ES",
    flag: "🇪🇸",
    provider: "loquendo",
    description: "Voz clásica y legendaria de Jorge de Loquendo.",
  },
  {
    id: "loquendo-carlos",
    name: "Loquendo (Carlos)",
    gender: "Masculino",
    lang: "es-ES",
    flag: "🇪🇸",
    provider: "loquendo",
    description: "Voz clásica de Carlos de Loquendo.",
  },
  {
    id: "es-MX-DaliaNeural",
    name: "Dalia (México)",
    gender: "Femenino",
    lang: "es-MX",
    flag: "🇲🇽",
    provider: "edge",
    description: "Voz neuronal suave y ultra natural mexicana.",
  },
  {
    id: "es-MX-JorgeNeural",
    name: "Jorge Neural (México)",
    gender: "Masculino",
    lang: "es-MX",
    flag: "🇲🇽",
    provider: "edge",
    description: "Voz masculina mexicana cálida y formal.",
  },
  {
    id: "es-ES-AlvaroNeural",
    name: "Álvaro (España)",
    gender: "Masculino",
    lang: "es-ES",
    flag: "🇪🇸",
    provider: "edge",
    description: "Voz neuronal masculina natural de España.",
  },
  {
    id: "es-ES-ElviraNeural",
    name: "Elvira (España)",
    gender: "Femenino",
    lang: "es-ES",
    flag: "🇪🇸",
    provider: "edge",
    description: "Voz neuronal femenina expresiva de España.",
  },
  {
    id: "es-AR-TomasNeural",
    name: "Tomás (Argentina)",
    gender: "Masculino",
    lang: "es-AR",
    flag: "🇦🇷",
    provider: "edge",
    description: "Voz neuronal masculina con acento argentino.",
  },
  {
    id: "es-CO-GonzaloNeural",
    name: "Gonzalo (Colombia)",
    gender: "Masculino",
    lang: "es-CO",
    flag: "🇨🇴",
    provider: "edge",
    description: "Voz neuronal masculina colombiana.",
  },
  {
    id: "en-US-JennyNeural",
    name: "Jenny (EE. UU.)",
    gender: "Femenino",
    lang: "en-US",
    flag: "🇺🇸",
    provider: "edge",
    description: "Voz en inglés estándar de alta claridad.",
  },
  {
    id: "en-US-GuyNeural",
    name: "Guy (EE. UU.)",
    gender: "Masculino",
    lang: "en-US",
    flag: "🇺🇸",
    provider: "edge",
    description: "Voz masculina casual en inglés americano.",
  },
];

export interface SoundboardTrack {
  id: string;
  name: string;
  emoji?: string;
  category: string;
  duration: number;
  preset?: string;
  playsCount: number;
  file?: string | null;
  hasFile?: boolean;
}

export interface SoundPlayResult {
  success: boolean;
  code?: string;
  message?: string;
  error?: string;
  channel?: { id: string; name: string };
}

const SOUND_API_URL =
  process.env.NEXT_PUBLIC_SOUND_API_URL ||
  "https://wsnbbnbdc7.execute-api.us-east-2.amazonaws.com/sound";

// No extra headers needed for API Gateway
const NGROK_HEADERS: Record<string, string> = {};

class SoundApiClient {
  private currentAudio: HTMLAudioElement | null = null;

  async getVoices(): Promise<VoiceItem[]> {
    try {
      const res = await fetch(`${SOUND_API_URL}/api/voices`, {
        cache: "no-store",
        headers: { ...NGROK_HEADERS },
      });
      if (!res.ok) return FALLBACK_VOICES;
      const data = await res.json();
      return data.voices && data.voices.length > 0
        ? data.voices
        : FALLBACK_VOICES;
    } catch {
      return FALLBACK_VOICES;
    }
  }

  async speakTTS(params: {
    guildId?: string;
    channelId?: string;
    text: string;
    voice?: string;
    rate?: number | string;
    pitch?: number | string;
  }): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${SOUND_API_URL}/api/tts/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...NGROK_HEADERS },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Error al emitir en Discord." };
      }
      return { success: true, message: data.message };
    } catch (err: any) {
      return {
        success: false,
        error: "No se pudo conectar con el bot de sonido.",
      };
    }
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

      const res = await fetch(`${SOUND_API_URL}/api/tts/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...NGROK_HEADERS },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        throw new Error("No se pudo obtener el audio de previsualización.");
      }

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      return new Promise((resolve) => {
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
    } catch (err) {
      console.error("[previewTTS] Error:", err);
      throw err;
    }
  }

  // ─── Soundboard (catálogo real del bot) ────────────────────

  async getSounds(): Promise<SoundboardTrack[] | null> {
    try {
      const res = await fetch(`${SOUND_API_URL}/api/sounds`, {
        cache: "no-store",
        headers: { ...NGROK_HEADERS },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data.sounds) ? data.sounds : null;
    } catch {
      return null;
    }
  }

  async playSoundOnDiscord(params: {
    guildId?: string;
    channelId?: string;
    soundId: string;
    volume?: number;
  }): Promise<SoundPlayResult> {
    try {
      const res = await fetch(`${SOUND_API_URL}/api/sounds/play`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...NGROK_HEADERS },
        body: JSON.stringify(params),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          code: data.code,
          error: data.error || "Error al emitir el sonido en Discord.",
          channel: data.channel,
        };
      }
      return { success: true, message: data.message, channel: data.channel };
    } catch {
      return {
        success: false,
        error: "No se pudo conectar con el bot de sonido.",
      };
    }
  }

  async deleteSound(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${SOUND_API_URL}/api/sounds/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { ...NGROK_HEADERS },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async uploadSound(params: {
    name: string;
    emoji?: string;
    category?: string;
    duration?: number;
    file: File;
  }): Promise<{ success: boolean; sound?: SoundboardTrack; error?: string }> {
    try {
      const form = new FormData();
      form.append("name", params.name);
      if (params.emoji) form.append("emoji", params.emoji);
      if (params.category) form.append("category", params.category);
      if (params.duration) form.append("duration", String(params.duration));
      form.append("file", params.file);

      const res = await fetch(`${SOUND_API_URL}/api/sounds/upload`, {
        method: "POST",
        headers: { ...NGROK_HEADERS },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || "Error al subir el audio." };
      }
      return { success: true, sound: data.sound };
    } catch {
      return {
        success: false,
        error: "No se pudo conectar con el bot de sonido.",
      };
    }
  }
}

export const soundApi = new SoundApiClient();
