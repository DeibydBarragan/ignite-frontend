// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  radioMemoryCache,
  topMemoryCache,
  clearRecommendationsCache,
  RADIO_CACHE_TTL_MS,
  TOP_CACHE_TTL_MS,
} from "@/features/music/hooks/use-recommendations";
import type { Song } from "@/types/domain";

const dummySong: Song = {
  id: "song-radio-1",
  title: "Radio Song",
  artist: "Radio Artist",
  albumArt: "https://example.com/art.jpg",
  duration: 180,
  source: "youtube",
  url: "https://youtube.com/watch?v=radio1",
  category: "hits",
};

describe("recommendations cache", () => {
  beforeEach(() => {
    clearRecommendationsCache();
    vi.restoreAllMocks();
  });

  it("stores and retrieves contextual radio recommendations by guild and song id", () => {
    const guildId = "guild-123";
    const songId = "song-radio-1";
    const cacheKey = `${guildId}:${songId}`;

    expect(radioMemoryCache.has(cacheKey)).toBe(false);

    radioMemoryCache.set(cacheKey, {
      songs: [dummySong],
      basedOn: dummySong,
      timestamp: Date.now(),
    });

    expect(radioMemoryCache.has(cacheKey)).toBe(true);
    const cached = radioMemoryCache.get(cacheKey);
    expect(cached?.songs).toHaveLength(1);
    expect(cached?.basedOn?.id).toBe(songId);
  });

  it("expires contextual radio entry when exceeding TTL", () => {
    const guildId = "guild-123";
    const songId = "song-radio-1";
    const cacheKey = `${guildId}:${songId}`;

    const oldTimestamp = Date.now() - (RADIO_CACHE_TTL_MS + 1000);
    radioMemoryCache.set(cacheKey, {
      songs: [dummySong],
      basedOn: dummySong,
      timestamp: oldTimestamp,
    });

    const entry = radioMemoryCache.get(cacheKey);
    expect(entry).toBeDefined();
    const isExpired = Date.now() - (entry?.timestamp ?? 0) >= RADIO_CACHE_TTL_MS;
    expect(isExpired).toBe(true);
  });

  it("expires top songs entry when exceeding TTL", () => {
    const key = "guild-123:week";
    topMemoryCache.set(key, {
      songs: [dummySong],
      timestamp: Date.now() - (TOP_CACHE_TTL_MS + 1000),
    });
    const entry = topMemoryCache.get(key);
    expect(entry).toBeDefined();
    const isExpired = Date.now() - (entry?.timestamp ?? 0) >= TOP_CACHE_TTL_MS;
    expect(isExpired).toBe(true);
  });

  it("differentiates cache keys between different songs on the same guild", () => {
    const guildId = "guild-123";
    const songA = "song-A";
    const songB = "song-B";

    radioMemoryCache.set(`${guildId}:${songA}`, {
      songs: [dummySong],
      basedOn: dummySong,
      timestamp: Date.now(),
    });

    expect(radioMemoryCache.has(`${guildId}:${songA}`)).toBe(true);
    expect(radioMemoryCache.has(`${guildId}:${songB}`)).toBe(false);
  });

  it("clears both radio and top cache on clearRecommendationsCache", () => {
    radioMemoryCache.set("g1:s1", { songs: [dummySong], basedOn: null, timestamp: Date.now() });
    topMemoryCache.set("g1:week", { songs: [dummySong], timestamp: Date.now() });

    expect(radioMemoryCache.size).toBe(1);
    expect(topMemoryCache.size).toBe(1);

    clearRecommendationsCache();

    expect(radioMemoryCache.size).toBe(0);
    expect(topMemoryCache.size).toBe(0);
  });
});
