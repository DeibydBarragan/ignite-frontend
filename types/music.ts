import type { Song } from "@/types/domain";

export type MusicSubTab = "favorites" | "catalog" | "playlists";
export type RecommendationsSubTab = "radio" | "week" | "month" | "all";
export type MusicPlatform = "spotify" | "youtube";

export interface PlaylistLiveState {
  playlistId: string;
  status: "loading" | "ok" | "error";
  tracks: Song[];
  truncated: boolean;
}
