import { describe, it, expect, beforeEach } from "vitest";
import { useQueueStore } from "@/features/music/stores/queue-store";
import type { Song } from "@/types/domain";

const s1: Song = {
  id: "s1",
  title: "Song 1",
  artist: "Artist 1",
  albumArt: "https://example.com/1.jpg",
  duration: 100,
  source: "youtube",
  url: "https://youtube.com/1",
  category: "hits",
};

const s2: Song = {
  id: "s2",
  title: "Song 2",
  artist: "Artist 2",
  albumArt: "https://example.com/2.jpg",
  duration: 200,
  source: "spotify",
  url: "https://spotify.com/2",
  category: "lofi",
};

describe("useQueueStore", () => {
  beforeEach(() => {
    useQueueStore.setState({
      queue: [],
      pendingSongActions: {},
      removingSongId: null,
      isReordering: false,
    });
  });

  it("handles optimistic add and rollback correctly", () => {
    useQueueStore.getState().setQueue([s1]);
    const rollback = useQueueStore.getState().addOptimistic(s2);

    expect(useQueueStore.getState().queue.map((s) => s.id)).toEqual(["s1", "s2"]);

    rollback();
    expect(useQueueStore.getState().queue.map((s) => s.id)).toEqual(["s1"]);
  });

  it("handles optimistic remove and rollback correctly", () => {
    useQueueStore.getState().setQueue([s1, s2]);
    const rollback = useQueueStore.getState().removeOptimistic("s1");

    expect(useQueueStore.getState().queue.map((s) => s.id)).toEqual(["s2"]);

    rollback();
    expect(useQueueStore.getState().queue.map((s) => s.id)).toEqual(["s1", "s2"]);
  });

  it("handles optimistic reorder and rollback correctly", () => {
    useQueueStore.getState().setQueue([s1, s2]);
    const rollback = useQueueStore.getState().reorderOptimistic(0, 1);

    expect(useQueueStore.getState().queue.map((s) => s.id)).toEqual(["s2", "s1"]);

    rollback();
    expect(useQueueStore.getState().queue.map((s) => s.id)).toEqual(["s1", "s2"]);
  });

  it("sets and clears pendingSongAction cleanly", () => {
    useQueueStore.getState().setPendingSongAction("s1", "play");
    expect(useQueueStore.getState().pendingSongActions["s1"]).toBe("play");

    useQueueStore.getState().setPendingSongAction("s1", null);
    expect(useQueueStore.getState().pendingSongActions["s1"]).toBeUndefined();
  });
});
