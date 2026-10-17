import { describe, it, expect, beforeEach } from "vitest";
import { usePlayerStore } from "@/features/music/stores/player-store";
import type { Song } from "@/types/domain";

const dummySong: Song = {
  id: "song-1",
  title: "Test Song",
  artist: "Test Artist",
  albumArt: "https://example.com/art.jpg",
  duration: 200,
  source: "youtube",
  url: "https://youtube.com/watch?v=123",
  category: "hits",
};

describe("usePlayerStore", () => {
  beforeEach(() => {
    usePlayerStore.setState({
      currentSong: null,
      isPlaying: false,
      currentTime: 0,
      volume: 80,
      isMuted: false,
      repeatMode: "off",
      shuffle: false,
      autoplay: false,
      activeFilter: null,
      isPlayerBusy: false,
      pendingAction: null,
    });
  });

  it("updates state atomically via setPlayerSnapshot", () => {
    usePlayerStore.getState().setPlayerSnapshot({
      currentSong: dummySong,
      isPlaying: true,
      volume: 60,
    });

    const state = usePlayerStore.getState();
    expect(state.currentSong?.id).toBe("song-1");
    expect(state.isPlaying).toBe(true);
    expect(state.volume).toBe(60);
  });

  it("advances currentTime by 1s on tickSecond without exceeding duration", () => {
    usePlayerStore.getState().setPlayerSnapshot({
      currentSong: dummySong,
      currentTime: 199,
    });

    usePlayerStore.getState().tickSecond();
    expect(usePlayerStore.getState().currentTime).toBe(200);

    // Clamps at duration
    usePlayerStore.getState().tickSecond();
    expect(usePlayerStore.getState().currentTime).toBe(200);
  });

  it("resets currentTime to 0 on tickSecond if no song is loaded", () => {
    usePlayerStore.getState().setPlayerSnapshot({
      currentSong: null,
      currentTime: 50,
    });

    usePlayerStore.getState().tickSecond();
    expect(usePlayerStore.getState().currentTime).toBe(0);
  });

  it("sets pendingAction and flags isPlayerBusy accordingly", () => {
    usePlayerStore.getState().setPendingAction("skip");
    expect(usePlayerStore.getState().pendingAction).toBe("skip");
    expect(usePlayerStore.getState().isPlayerBusy).toBe(true);

    usePlayerStore.getState().setPendingAction(null);
    expect(usePlayerStore.getState().pendingAction).toBeNull();
    expect(usePlayerStore.getState().isPlayerBusy).toBe(false);
  });
});
