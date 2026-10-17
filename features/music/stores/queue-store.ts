import { create } from "zustand";
import type { Song } from "@/types/domain";
import type { PendingSongActions } from "@/types/player";

export interface QueueState {
  queue: Song[];
  pendingSongActions: PendingSongActions;
  removingSongId: string | null;
  isReordering: boolean;
  setQueue: (queue: Song[] | ((prev: Song[]) => Song[])) => void;
  setPendingSongAction: (songId: string, action: "play" | "playNext" | "queue" | null) => void;
  setRemovingSongId: (id: string | null) => void;
  setIsReordering: (isReordering: boolean) => void;
  addOptimistic: (song: Song) => () => void;
  removeOptimistic: (songId: string) => () => void;
  reorderOptimistic: (fromIndex: number, toIndex: number) => () => void;
  clearOptimistic: () => () => void;
}

export const useQueueStore = create<QueueState>((set) => ({
  queue: [],
  pendingSongActions: {},
  removingSongId: null,
  isReordering: false,

  setQueue: (queueOrUpdater) =>
    set((state) => ({
      queue:
        typeof queueOrUpdater === "function"
          ? queueOrUpdater(state.queue)
          : queueOrUpdater,
    })),

  setPendingSongAction: (songId, action) =>
    set((state) => {
      const next = { ...state.pendingSongActions };
      if (!action) {
        delete next[songId];
      } else {
        next[songId] = action;
      }
      return { pendingSongActions: next };
    }),

  setRemovingSongId: (removingSongId) => set({ removingSongId }),

  setIsReordering: (isReordering) => set({ isReordering }),

  addOptimistic: (song) => {
    let rollbackQueue: Song[] = [];
    set((state) => {
      rollbackQueue = state.queue;
      return { queue: [...state.queue, song] };
    });
    return () => set({ queue: rollbackQueue });
  },

  removeOptimistic: (songId) => {
    let rollbackQueue: Song[] = [];
    set((state) => {
      rollbackQueue = state.queue;
      return { queue: state.queue.filter((s) => s.id !== songId) };
    });
    return () => set({ queue: rollbackQueue });
  },

  reorderOptimistic: (fromIndex, toIndex) => {
    let rollbackQueue: Song[] = [];
    set((state) => {
      rollbackQueue = state.queue;
      const copy = [...state.queue];
      const [moved] = copy.splice(fromIndex, 1);
      if (moved) copy.splice(toIndex, 0, moved);
      return { queue: copy };
    });
    return () => set({ queue: rollbackQueue });
  },

  clearOptimistic: () => {
    let rollbackQueue: Song[] = [];
    set((state) => {
      rollbackQueue = state.queue;
      return { queue: [] };
    });
    return () => set({ queue: rollbackQueue });
  },
}));
