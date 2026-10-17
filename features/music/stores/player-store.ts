import { create } from "zustand";
import type { MusicSource, RepeatMode, Song } from "@/types/domain";
import type { PendingAction } from "@/types/player";
import { STORAGE_KEYS } from "@/lib/storage-keys";

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  shuffle: boolean;
  autoplay: boolean;
  activeFilter: string | null;
  defaultProvider: MusicSource;
  isPlayerCollapsed: boolean;
  isPlayerBusy: boolean;
  pendingAction: PendingAction;
  setPlayerSnapshot: (snapshot: Partial<Omit<PlayerState, "setPlayerSnapshot" | "tickSecond" | "setIsPlayerCollapsed">>) => void;
  setCurrentTime: (time: number | ((prev: number) => number)) => void;
  tickSecond: () => void;
  setVolume: (volume: number) => void;
  setIsMuted: (isMuted: boolean) => void;
  setIsPlayerCollapsed: (val: boolean | ((prev: boolean) => boolean)) => void;
  setPendingAction: (action: PendingAction) => void;
}

function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEYS.playerCollapsed) === "true";
  } catch {
    return false;
  }
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentSong: null,
  isPlaying: false,
  currentTime: 0,
  volume: 80,
  isMuted: false,
  repeatMode: "off",
  shuffle: false,
  autoplay: false,
  activeFilter: null,
  defaultProvider: "youtube",
  isPlayerCollapsed: getInitialCollapsed(),
  isPlayerBusy: false,
  pendingAction: null,

  setPlayerSnapshot: (snapshot) => set((state) => ({ ...state, ...snapshot })),

  setCurrentTime: (time) =>
    set((state) => ({
      currentTime: typeof time === "function" ? time(state.currentTime) : time,
    })),

  tickSecond: () =>
    set((state) => ({
      currentTime: state.currentSong
        ? Math.min(state.currentTime + 1, state.currentSong.duration || 180)
        : 0,
    })),

  setVolume: (volume) => set({ volume }),

  setIsMuted: (isMuted) => set({ isMuted }),

  setIsPlayerCollapsed: (val) =>
    set((state) => {
      const next = typeof val === "function" ? val(state.isPlayerCollapsed) : val;
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEYS.playerCollapsed, String(next));
        }
      } catch {
        // Ignorar QuotaExceededError
      }
      return { isPlayerCollapsed: next };
    }),

  setPendingAction: (pendingAction) =>
    set({ pendingAction, isPlayerBusy: pendingAction !== null }),
}));
