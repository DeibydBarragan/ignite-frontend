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
}

export const soundApi = new SoundApiClient();
