import { create } from "zustand";
import type { PhraseTrigger, SoundCategory, SoundItem } from "@/types/domain";
import { MOCK_SOUNDS, MOCK_PHRASE_TRIGGERS } from "@/lib/mock-data";

export interface SoundboardStoreState {
  sounds: SoundItem[];
  activeSoundId: string | null;
  selectedCategory: SoundCategory | "all";
  searchQuery: string;
  phraseTriggers: PhraseTrigger[];
  setSounds: (sounds: SoundItem[] | ((prev: SoundItem[]) => SoundItem[])) => void;
  setActiveSoundId: (id: string | null) => void;
  setSelectedCategory: (category: SoundCategory | "all") => void;
  setSearchQuery: (query: string) => void;
  setPhraseTriggers: (triggers: PhraseTrigger[] | ((prev: PhraseTrigger[]) => PhraseTrigger[])) => void;
  addSound: (sound: SoundItem) => void;
  updateSound: (id: string, updates: Partial<SoundItem>) => void;
  removeSound: (id: string) => void;
  addPhraseTrigger: (trigger: PhraseTrigger) => void;
  togglePhraseTrigger: (id: string) => void;
  removePhraseTrigger: (id: string) => void;
}

const initialSounds: SoundItem[] =
  process.env.NEXT_PUBLIC_USE_MOCKS === "true" ? MOCK_SOUNDS : [];

const initialTriggers: PhraseTrigger[] =
  process.env.NEXT_PUBLIC_USE_MOCKS === "true" ? MOCK_PHRASE_TRIGGERS : [];

export const useSoundboardStore = create<SoundboardStoreState>((set) => ({
  sounds: initialSounds,
  activeSoundId: null,
  selectedCategory: "all",
  searchQuery: "",
  phraseTriggers: initialTriggers,

  setSounds: (updater) =>
    set((state) => ({
      sounds: typeof updater === "function" ? updater(state.sounds) : updater,
    })),

  setActiveSoundId: (activeSoundId) => set({ activeSoundId }),

  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setPhraseTriggers: (updater) =>
    set((state) => ({
      phraseTriggers:
        typeof updater === "function" ? updater(state.phraseTriggers) : updater,
    })),

  addSound: (sound) =>
    set((state) => ({
      sounds: [sound, ...state.sounds],
    })),

  updateSound: (id, updates) =>
    set((state) => ({
      sounds: state.sounds.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),

  removeSound: (id) =>
    set((state) => ({
      sounds: state.sounds.filter((s) => s.id !== id),
    })),

  addPhraseTrigger: (trigger) =>
    set((state) => ({
      phraseTriggers: [trigger, ...state.phraseTriggers],
    })),

  togglePhraseTrigger: (id) =>
    set((state) => ({
      phraseTriggers: state.phraseTriggers.map((t) =>
        t.id === id ? { ...t, enabled: !t.enabled } : t
      ),
    })),

  removePhraseTrigger: (id) =>
    set((state) => ({
      phraseTriggers: state.phraseTriggers.filter((t) => t.id !== id),
    })),
}));
