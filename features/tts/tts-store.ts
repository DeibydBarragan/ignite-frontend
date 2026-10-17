import { create } from "zustand";
import type { TTSMessage } from "@/types/domain";

export interface TTSStoreState {
  recentTTS: TTSMessage[];
  selectedVoice: string;
  pitch: number;
  rate: number;
  isGenerating: boolean;
  setRecentTTS: (messages: TTSMessage[] | ((prev: TTSMessage[]) => TTSMessage[])) => void;
  addRecentTTS: (message: TTSMessage) => void;
  setSelectedVoice: (voice: string) => void;
  setPitch: (pitch: number) => void;
  setRate: (rate: number) => void;
  setIsGenerating: (isGenerating: boolean) => void;
}

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

export const useTTSStore = create<TTSStoreState>((set) => ({
  recentTTS: INITIAL_TTS,
  selectedVoice: "Jorge (Español)",
  pitch: 1.0,
  rate: 1.0,
  isGenerating: false,

  setRecentTTS: (updater) =>
    set((state) => ({
      recentTTS:
        typeof updater === "function" ? updater(state.recentTTS) : updater,
    })),

  addRecentTTS: (message) =>
    set((state) => ({
      recentTTS: [message, ...state.recentTTS.slice(0, 9)],
    })),

  setSelectedVoice: (selectedVoice) => set({ selectedVoice }),

  setPitch: (pitch) => set({ pitch }),

  setRate: (rate) => set({ rate }),

  setIsGenerating: (isGenerating) => set({ isGenerating }),
}));
